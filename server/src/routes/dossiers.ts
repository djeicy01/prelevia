import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'

const router = Router()
router.use(authMiddleware)

// ─── HELPER — Calcul part patient ─────────────────────────────────────────
//
// Règle métier figée :
//   - Examen couvert (assurance) → patient paie 20%, assurance paie 80%
//   - Examen non couvert          → patient paie 100%
//   - Examen couvert = null       → pas encore déterminé (inclus à 100% par sécurité)

interface ExamenPourCalcul {
  tarif: number
  couvert: boolean | null
}

export function calculerPartPatient(examens: ExamenPourCalcul[]) {
  let totalFacture = 0
  let partAssurance = 0
  let partPatient = 0

  for (const e of examens) {
    totalFacture += e.tarif
    if (e.couvert === true) {
      partAssurance += Math.round(e.tarif * 0.80)
      partPatient   += Math.round(e.tarif * 0.20)
    } else {
      partPatient += e.tarif  // 100 % charge patient
    }
  }

  return { totalFacture, partAssurance, partPatient }
}

// Transitions autorisées pour le workflow assurance
const TRANSITIONS_ASSURANCE: Record<string, string[]> = {
  DOCS_COLLECTES: ['SOUMIS_LABO'],
  SOUMIS_LABO:    ['EN_VALIDATION'],
  EN_VALIDATION:  ['VALIDE_TOTAL', 'VALIDE_PARTIEL', 'REFUSE'],
  // états terminaux — aucune transition autorisée
  VALIDE_TOTAL:   [],
  VALIDE_PARTIEL: [],
  REFUSE:         [],
}

// ─── GET /api/dossiers ────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      patientId,
      statut,
      statutAssurance,
      search,
      page  = '1',
      limit = '20',
    } = req.query

    const where: any = {}

    if (patientId)       where.patientId       = String(patientId)
    if (statut)          where.statut          = String(statut)
    if (statutAssurance) where.statutAssurance = String(statutAssurance)

    // Recherche par ref dossier ou nom/prénom/tél du patient
    if (search) {
      where.OR = [
        { ref: { contains: String(search), mode: 'insensitive' } },
        { patient: { nom:       { contains: String(search), mode: 'insensitive' } } },
        { patient: { prenom:    { contains: String(search), mode: 'insensitive' } } },
        { patient: { telephone: { contains: String(search) } } },
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [dossiers, total] = await Promise.all([
      prisma.dossier.findMany({
        where,
        include: {
          patient:  { select: { id: true, ref: true, nom: true, prenom: true, telephone: true, commune: true } },
          examens:  { select: { id: true, tarif: true, couvert: true, quotePart: true, catalogue: { select: { code: true, nom: true } } } },
          paiements:{ select: { id: true, montant: true, statut: true, mode: true, encaisseA: true } },
          mission:  { select: { id: true, ref: true, statut: true, date: true, agent: { select: { nom: true, prenom: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.dossier.count({ where }),
    ])

    // Calcul financier pour chaque dossier
    const data = dossiers.map(d => ({
      ...d,
      finances: calculerPartPatient(d.examens),
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

// ─── GET /api/dossiers/:id ────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const dossier = await prisma.dossier.findUnique({
      where: { id: String(req.params.id) },
      include: {
        patient:    { include: { assurance: true } },
        examens:    { include: { catalogue: true, resultat: true } },
        paiements:  true,
        mission:    { include: { agent: true } },
        laboratoire:true,
        documentsResultats: true,
      },
    })

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier introuvable' })
    }

    res.json({
      ...dossier,
      finances: calculerPartPatient(dossier.examens),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/dossiers ───────────────────────────────────────────────────
// Corps attendu :
//   { patientId, ocrSource?, catalogueIds?, laboratoireId?, noteAdmin? }
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      patientId,
      ocrSource    = 'MANUAL',
      catalogueIds = [],
      laboratoireId,
      noteAdmin,
    } = req.body

    if (!patientId) {
      return res.status(400).json({ error: 'patientId est obligatoire' })
    }

    // Vérifier que le patient existe
    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return res.status(404).json({ error: 'Patient introuvable' })
    }

    // Générer la référence DOS-XXX
    const count = await prisma.dossier.count()
    const ref   = `DOS-${String(count + 1).padStart(3, '0')}`

    // Récupérer les tarifs des examens demandés
    let examensData: { catalogueId: string; tarif: number }[] = []
    if (catalogueIds.length > 0) {
      const catalogues = await prisma.examenCatalogue.findMany({
        where: { id: { in: catalogueIds }, actif: true },
        select: { id: true, tarifMax: true },
      })
      examensData = catalogues.map(c => ({ catalogueId: c.id, tarif: c.tarifMax }))
    }

    const dossier = await prisma.dossier.create({
      data: {
        ref,
        patientId,
        ocrSource,
        laboratoireId,
        noteAdmin,
        // Si le patient a une assurance, on initialise le workflow à DOCS_COLLECTES
        statutAssurance: patient.assuranceId ? 'DOCS_COLLECTES' : undefined,
        examens: examensData.length > 0
          ? { create: examensData }
          : undefined,
      },
      include: {
        patient:  { include: { assurance: true } },
        examens:  { include: { catalogue: true } },
        paiements:true,
      },
    })

    res.status(201).json({
      ...dossier,
      finances: calculerPartPatient(dossier.examens),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/dossiers/:id/examens ──────────────────────────────────────
// Ajoute des examens à un dossier existant.
// Corps attendu : { catalogueIds: string[] }
router.post('/:id/examens', async (req: AuthRequest, res: Response) => {
  try {
    const { catalogueIds } = req.body

    if (!catalogueIds || !Array.isArray(catalogueIds) || catalogueIds.length === 0) {
      return res.status(400).json({ error: 'catalogueIds (tableau non vide) est obligatoire' })
    }

    const dossier = await prisma.dossier.findUnique({
      where: { id: String(req.params.id) },
      include: { examens: { select: { catalogueId: true } } },
    })
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier introuvable' })
    }

    // Éviter les doublons dans le dossier
    const existants = new Set(dossier.examens.map(e => e.catalogueId))
    const nouveaux  = catalogueIds.filter((id: string) => !existants.has(id))

    if (nouveaux.length === 0) {
      return res.status(400).json({ error: 'Tous ces examens sont déjà présents dans le dossier' })
    }

    // Récupérer les tarifs (figés au moment de l'ajout)
    const catalogues = await prisma.examenCatalogue.findMany({
      where: { id: { in: nouveaux }, actif: true },
      select: { id: true, tarifMax: true },
    })

    if (catalogues.length === 0) {
      return res.status(404).json({ error: 'Aucun examen valide trouvé pour les IDs fournis' })
    }

    // Créer les examens
    await prisma.examen.createMany({
      data: catalogues.map(c => ({
        dossierId:   dossier.id,
        catalogueId: c.id,
        tarif:       c.tarifMax,
      })),
    })

    // Retourner le dossier mis à jour avec calcul financier
    const dossierMaj = await prisma.dossier.findUnique({
      where:   { id: dossier.id },
      include: {
        patient:  { include: { assurance: true } },
        examens:  { include: { catalogue: true } },
        paiements:true,
      },
    })

    res.status(201).json({
      ...dossierMaj,
      finances: calculerPartPatient(dossierMaj!.examens),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/dossiers/:id/assurance ───────────────────────────────────
// Avance le workflow assurance selon les transitions autorisées.
//
// Corps commun : { statut: AssuranceStatut }
//
// Cas VALIDE_PARTIEL : { statut: 'VALIDE_PARTIEL', couvertures: [{ examenId, couvert: boolean }] }
//   → couvert=true  : patient 20% / assurance 80%
//   → couvert=false : patient 100%
//
// Cas VALIDE_TOTAL  : tous les examens passent couvert=true automatiquement
// Cas REFUSE        : tous les examens passent couvert=false automatiquement

router.patch('/:id/assurance', async (req: AuthRequest, res: Response) => {
  try {
    const { statut: nouveauStatut, couvertures } = req.body

    if (!nouveauStatut) {
      return res.status(400).json({ error: 'statut est obligatoire' })
    }

    const dossier = await prisma.dossier.findUnique({
      where:   { id: String(req.params.id) },
      include: { examens: true },
    })
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier introuvable' })
    }

    // Vérifier la transition
    const statutActuel = dossier.statutAssurance ?? 'DOCS_COLLECTES'
    const transitions  = TRANSITIONS_ASSURANCE[statutActuel] ?? []

    if (!transitions.includes(nouveauStatut)) {
      return res.status(400).json({
        error: `Transition interdite : ${statutActuel} → ${nouveauStatut}`,
        transitionsAutorisees: transitions,
      })
    }

    // Préparer les mises à jour des examens selon le nouveau statut
    if (nouveauStatut === 'VALIDE_TOTAL') {
      await Promise.all(
        dossier.examens.map(e =>
          prisma.examen.update({
            where: { id: e.id },
            data:  { couvert: true, quotePart: Math.round(e.tarif * 0.20) },
          })
        )
      )
    } else if (nouveauStatut === 'VALIDE_PARTIEL') {
      if (!couvertures || !Array.isArray(couvertures) || couvertures.length === 0) {
        return res.status(400).json({
          error: 'couvertures ([{ examenId, couvert }]) est obligatoire pour VALIDE_PARTIEL',
        })
      }

      await Promise.all(
        couvertures.map((c: { examenId: string; couvert: boolean }) => {
          const examen = dossier.examens.find(e => e.id === c.examenId)
          if (!examen) return Promise.resolve()

          const quotePart = c.couvert
            ? Math.round(examen.tarif * 0.20)
            : examen.tarif

          return prisma.examen.update({
            where: { id: c.examenId },
            data:  { couvert: c.couvert, quotePart },
          })
        })
      )
    } else if (nouveauStatut === 'REFUSE') {
      await Promise.all(
        dossier.examens.map(e =>
          prisma.examen.update({
            where: { id: e.id },
            data:  { couvert: false, quotePart: e.tarif },
          })
        )
      )
    }

    const dossierMaj = await prisma.dossier.update({
      where: { id: dossier.id },
      data:  { statutAssurance: nouveauStatut },
      include: {
        patient:  { include: { assurance: true } },
        examens:  { include: { catalogue: true } },
        paiements:true,
      },
    })

    res.json({
      ...dossierMaj,
      finances: calculerPartPatient(dossierMaj.examens),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/dossiers/:id/statut ──────────────────────────────────────
router.patch('/:id/statut', async (req: AuthRequest, res: Response) => {
  try {
    const { statut, noteAdmin } = req.body

    const statutsValides = [
      'EN_ATTENTE', 'PRET_PRELEVEMENT', 'PRELEVEMENT_FAIT',
      'PAYE', 'RESULTATS_EN_COURS', 'RESULTATS_DISPONIBLES', 'ARCHIVE',
    ]

    if (!statut || !statutsValides.includes(statut)) {
      return res.status(400).json({ error: `statut invalide. Valeurs : ${statutsValides.join(', ')}` })
    }

    const dossier = await prisma.dossier.update({
      where: { id: String(req.params.id) },
      data:  { statut, ...(noteAdmin !== undefined && { noteAdmin }) },
      include: {
        patient:  { include: { assurance: true } },
        examens:  { include: { catalogue: true } },
        paiements:true,
      },
    })

    res.json({
      ...dossier,
      finances: calculerPartPatient(dossier.examens),
    })
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Dossier introuvable' })
    }
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
