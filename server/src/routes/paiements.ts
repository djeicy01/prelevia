import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'
import { calculerPartPatient } from './dossiers'
import { envoyerSMSTemplate } from '../services/sms'

const router = Router()
router.use(authMiddleware)

const MODES_VALIDES  = ['CASH', 'ORANGE_MONEY', 'MTN_MONEY', 'WAVE', 'VIREMENT']
const STATUTS_VALIDES = ['EN_ATTENTE', 'CONFIRME', 'ECHEC']

// ─── GET /api/paiements/stats ──────────────────────────────────────────────
// KPIs globaux : total encaissé, répartition par mode, encaissements du jour/mois.
// IMPORTANT : route statique avant /:id pour éviter le conflit de paramètre.
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { dateDebut, dateFin } = req.query

    const where: any = { statut: 'CONFIRME' }
    if (dateDebut || dateFin) {
      where.encaisseA = {}
      if (dateDebut) where.encaisseA.gte = new Date(String(dateDebut))
      if (dateFin)   where.encaisseA.lte = new Date(String(dateFin))
    }

    const debutJour = new Date()
    debutJour.setHours(0, 0, 0, 0)
    const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const [
      totalGlobal,
      totalJour,
      totalMois,
      parMode,
      nbEnAttente,
    ] = await Promise.all([
      prisma.paiement.aggregate({
        where,
        _sum:   { montant: true },
        _count: true,
      }),
      prisma.paiement.aggregate({
        where: { statut: 'CONFIRME', encaisseA: { gte: debutJour } },
        _sum:  { montant: true },
        _count: true,
      }),
      prisma.paiement.aggregate({
        where: { statut: 'CONFIRME', encaisseA: { gte: debutMois } },
        _sum:  { montant: true },
        _count: true,
      }),
      // Agrégat par mode de paiement (seulement confirmés)
      Promise.all(
        MODES_VALIDES.map(async mode => {
          const agg = await prisma.paiement.aggregate({
            where: { ...where, mode },
            _sum:  { montant: true },
            _count: true,
          })
          return { mode, montant: agg._sum.montant ?? 0, count: agg._count }
        })
      ),
      prisma.paiement.count({ where: { statut: 'EN_ATTENTE' } }),
    ])

    res.json({
      totalEncaisse:  totalGlobal._sum.montant ?? 0,
      nbPaiements:    totalGlobal._count,
      jour: {
        montant: totalJour._sum.montant ?? 0,
        count:   totalJour._count,
      },
      mois: {
        montant: totalMois._sum.montant ?? 0,
        count:   totalMois._count,
      },
      parMode:        parMode.filter(m => m.count > 0),
      nbEnAttente,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/paiements ────────────────────────────────────────────────────
// Filtres : dossierId, statut, mode, dateDebut, dateFin
// Pagination : page, limit
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      dossierId,
      statut,
      mode,
      dateDebut,
      dateFin,
      page  = '1',
      limit = '20',
    } = req.query

    const where: any = {}

    if (dossierId) where.dossierId = String(dossierId)
    if (statut)    where.statut    = String(statut)
    if (mode)      where.mode      = String(mode)

    if (dateDebut || dateFin) {
      where.encaisseA = {}
      if (dateDebut) where.encaisseA.gte = new Date(String(dateDebut))
      if (dateFin)   where.encaisseA.lte = new Date(String(dateFin))
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [paiements, total] = await Promise.all([
      prisma.paiement.findMany({
        where,
        include: {
          dossier: {
            select: {
              ref:    true,
              statut: true,
              patient: { select: { nom: true, prenom: true, telephone: true, commune: true } },
              examens: { select: { tarif: true, couvert: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.paiement.count({ where }),
    ])

    const data = paiements.map(p => ({
      ...p,
      finances: calculerPartPatient(p.dossier.examens),
    }))

    res.json({
      data,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/paiements/:id ────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const paiement = await prisma.paiement.findUnique({
      where:   { id: String(req.params.id) },
      include: {
        dossier: {
          include: {
            patient:  { include: { assurance: true } },
            examens:  { include: { catalogue: true } },
            mission:  { include: { agent: true } },
          },
        },
      },
    })

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement introuvable' })
    }

    res.json({
      ...paiement,
      finances: calculerPartPatient(paiement.dossier.examens),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/paiements ───────────────────────────────────────────────────
// Crée un paiement et envoie un SMS de confirmation au patient.
//
// Corps : { dossierId, montant, mode, reference?, statut? }
//
// - statut par défaut : CONFIRME (encaissement direct par agent)
// - Après confirmation : SMS template RECU_PAIEMENT + dossier → PAYE
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      dossierId,
      montant,
      mode,
      reference,
      statut = 'CONFIRME',
    } = req.body

    if (!dossierId || montant === undefined || !mode) {
      return res.status(400).json({ error: 'dossierId, montant et mode sont obligatoires' })
    }

    if (!MODES_VALIDES.includes(mode)) {
      return res.status(400).json({ error: `mode invalide. Valeurs : ${MODES_VALIDES.join(', ')}` })
    }

    if (!STATUTS_VALIDES.includes(statut)) {
      return res.status(400).json({ error: `statut invalide. Valeurs : ${STATUTS_VALIDES.join(', ')}` })
    }

    // Vérifier le dossier et récupérer les données patient
    const dossier = await prisma.dossier.findUnique({
      where:   { id: dossierId },
      include: {
        patient:  { include: { assurance: true } },
        examens:  true,
      },
    })

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier introuvable' })
    }

    const finances = calculerPartPatient(dossier.examens)

    const maintenant = new Date()

    const paiement = await prisma.paiement.create({
      data: {
        dossierId,
        montant:   Number(montant),
        mode,
        statut,
        reference: reference ?? null,
        encaisseA: statut === 'CONFIRME' ? maintenant : null,
      },
      include: {
        dossier: {
          include: { patient: true, examens: { include: { catalogue: true } } },
        },
      },
    })

    // Si paiement confirmé : mettre le dossier en PAYE + SMS
    if (statut === 'CONFIRME') {
      await prisma.dossier.update({
        where: { id: dossierId },
        data:  { statut: 'PAYE' },
      })

      // SMS de reçu au patient (non bloquant)
      const modesLibelles: Record<string, string> = {
        CASH:         'espèces',
        ORANGE_MONEY: 'Orange Money',
        MTN_MONEY:    'MTN Money',
        WAVE:         'Wave',
        VIREMENT:     'virement',
      }

      envoyerSMSTemplate('RECU_PAIEMENT', dossier.patient.telephone, {
        nom:       `${dossier.patient.prenom} ${dossier.patient.nom}`,
        montant:   `${Number(montant).toLocaleString('fr-FR')} XOF`,
        mode:      modesLibelles[mode] ?? mode,
        ref:       dossier.ref,
        date:      maintenant.toLocaleDateString('fr-FR'),
      }).catch(err => console.error('[SMS] Erreur non bloquante RECU_PAIEMENT :', err))
    }

    res.status(201).json({
      ...paiement,
      finances,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/paiements/:id/confirmer ───────────────────────────────────
// Confirme un paiement EN_ATTENTE.
// Met le dossier en PAYE et envoie le SMS RECU_PAIEMENT.
router.patch('/:id/confirmer', async (req: AuthRequest, res: Response) => {
  try {
    const paiement = await prisma.paiement.findUnique({
      where:   { id: String(req.params.id) },
      include: {
        dossier: {
          include: { patient: true, examens: true },
        },
      },
    })

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement introuvable' })
    }

    if (paiement.statut !== 'EN_ATTENTE') {
      return res.status(400).json({
        error: `Impossible de confirmer un paiement en statut : ${paiement.statut}`,
      })
    }

    const maintenant = new Date()

    const paiementMaj = await prisma.paiement.update({
      where: { id: paiement.id },
      data:  { statut: 'CONFIRME', encaisseA: maintenant },
      include: {
        dossier: {
          include: { patient: true, examens: { include: { catalogue: true } } },
        },
      },
    })

    // Dossier → PAYE
    await prisma.dossier.update({
      where: { id: paiement.dossierId },
      data:  { statut: 'PAYE' },
    })

    // SMS reçu (non bloquant)
    const modesLibelles: Record<string, string> = {
      CASH:         'espèces',
      ORANGE_MONEY: 'Orange Money',
      MTN_MONEY:    'MTN Money',
      WAVE:         'Wave',
      VIREMENT:     'virement',
    }

    envoyerSMSTemplate('RECU_PAIEMENT', paiement.dossier.patient.telephone, {
      nom:     `${paiement.dossier.patient.prenom} ${paiement.dossier.patient.nom}`,
      montant: `${paiement.montant.toLocaleString('fr-FR')} XOF`,
      mode:    modesLibelles[paiement.mode] ?? paiement.mode,
      ref:     paiement.dossier.ref,
      date:    maintenant.toLocaleDateString('fr-FR'),
    }).catch(err => console.error('[SMS] Erreur non bloquante RECU_PAIEMENT :', err))

    res.json({
      ...paiementMaj,
      finances: calculerPartPatient(paiementMaj.dossier.examens),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/paiements/:id/echec ───────────────────────────────────────
// Marque un paiement EN_ATTENTE comme ECHEC.
router.patch('/:id/echec', async (req: AuthRequest, res: Response) => {
  try {
    const paiement = await prisma.paiement.findUnique({
      where: { id: String(req.params.id) },
    })

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement introuvable' })
    }

    if (paiement.statut !== 'EN_ATTENTE') {
      return res.status(400).json({
        error: `Impossible de marquer en échec un paiement en statut : ${paiement.statut}`,
      })
    }

    const paiementMaj = await prisma.paiement.update({
      where: { id: paiement.id },
      data:  { statut: 'ECHEC' },
    })

    res.json(paiementMaj)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
