import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'
import { calculerPartPatient } from './dossiers'

const router = Router()
router.use(authMiddleware)

// Transitions autorisées pour le statut de mission
const TRANSITIONS_MISSION: Record<string, string[]> = {
  PLANIFIEE:        ['EN_ROUTE'],
  EN_ROUTE:         ['ARRIVEE'],
  ARRIVEE:          ['PRELEVEMENT_FAIT'],
  PRELEVEMENT_FAIT: ['TERMINEE'],
  TERMINEE:         [],  // état terminal
}

// ─── GET /api/missions ────────────────────────────────────────────────────
// Filtres : agentId, statut, dateDebut, dateFin
// Pagination : page, limit
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      agentId,
      statut,
      dateDebut,
      dateFin,
      page  = '1',
      limit = '20',
    } = req.query

    const where: any = {}

    if (agentId) where.agentId = String(agentId)
    if (statut)  where.statut  = String(statut)

    if (dateDebut || dateFin) {
      where.date = {}
      if (dateDebut) where.date.gte = new Date(String(dateDebut))
      if (dateFin)   where.date.lte = new Date(String(dateFin))
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        include: {
          agent: {
            select: { id: true, nom: true, prenom: true, telephone: true, commune: true },
          },
          dossiers: {
            select: {
              id: true, ref: true, statut: true, ocrSource: true, statutAssurance: true,
              patient: { select: { nom: true, prenom: true, telephone: true, commune: true } },
              examens: { select: { tarif: true, couvert: true } },
            },
          },
          _count: { select: { dossiers: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.mission.count({ where }),
    ])

    // Calcul financier agrégé par mission
    const data = missions.map(m => ({
      ...m,
      finances: {
        totalFacture:   m.dossiers.reduce((acc, d) => acc + calculerPartPatient(d.examens).totalFacture, 0),
        totalPatient:   m.dossiers.reduce((acc, d) => acc + calculerPartPatient(d.examens).partPatient, 0),
        totalAssurance: m.dossiers.reduce((acc, d) => acc + calculerPartPatient(d.examens).partAssurance, 0),
      },
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

// ─── GET /api/missions/:id ────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const mission = await prisma.mission.findUnique({
      where:   { id: String(req.params.id) },
      include: {
        agent: true,
        dossiers: {
          include: {
            patient:  { include: { assurance: true } },
            examens:  { include: { catalogue: true } },
            paiements: true,
          },
        },
        revenus: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!mission) {
      return res.status(404).json({ error: 'Mission introuvable' })
    }

    const finances = {
      totalFacture:    mission.dossiers.reduce((acc, d) => acc + calculerPartPatient(d.examens).totalFacture, 0),
      totalPatient:    mission.dossiers.reduce((acc, d) => acc + calculerPartPatient(d.examens).partPatient, 0),
      totalAssurance:  mission.dossiers.reduce((acc, d) => acc + calculerPartPatient(d.examens).partAssurance, 0),
      totalEncaisse:   mission.revenus.reduce((acc, r) => acc + r.montant, 0),
    }

    res.json({
      ...mission,
      dossiers: mission.dossiers.map(d => ({
        ...d,
        finances: calculerPartPatient(d.examens),
      })),
      finances,
      transitionsAutorisees: TRANSITIONS_MISSION[mission.statut] ?? [],
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/missions ───────────────────────────────────────────────────
// Corps : { agentId, date, dossierIds? }
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agentId, date, dossierIds = [] } = req.body

    if (!agentId || !date) {
      return res.status(400).json({ error: 'agentId et date sont obligatoires' })
    }

    // Vérifier que l'agent existe et est actif
    const agent = await prisma.agent.findUnique({ where: { id: agentId } })
    if (!agent) {
      return res.status(404).json({ error: 'Agent introuvable' })
    }
    if (agent.statut !== 'ACTIF') {
      return res.status(400).json({ error: `Agent non disponible — statut : ${agent.statut}` })
    }

    // Générer la référence MIS-XXX
    const count = await prisma.mission.count()
    const ref   = `MIS-${String(count + 1).padStart(3, '0')}`

    const mission = await prisma.mission.create({
      data: {
        ref,
        agentId,
        date: new Date(date),
        // Rattacher les dossiers si fournis
        dossiers: dossierIds.length > 0
          ? { connect: (dossierIds as string[]).map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        agent:    { select: { id: true, nom: true, prenom: true, telephone: true } },
        dossiers: {
          include: {
            patient:  { select: { nom: true, prenom: true, telephone: true, commune: true } },
            examens:  { include: { catalogue: true } },
            paiements: true,
          },
        },
      },
    })

    res.status(201).json({
      ...mission,
      dossiers: mission.dossiers.map(d => ({
        ...d,
        finances: calculerPartPatient(d.examens),
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/missions/:id/dossiers ─────────────────────────────────────
// Rattache des dossiers supplémentaires à une mission existante.
// Corps : { dossierIds: string[] }
router.post('/:id/dossiers', async (req: AuthRequest, res: Response) => {
  try {
    const { dossierIds } = req.body

    if (!dossierIds || !Array.isArray(dossierIds) || dossierIds.length === 0) {
      return res.status(400).json({ error: 'dossierIds (tableau non vide) est obligatoire' })
    }

    const mission = await prisma.mission.findUnique({ where: { id: String(req.params.id) } })
    if (!mission) {
      return res.status(404).json({ error: 'Mission introuvable' })
    }

    if (mission.statut === 'TERMINEE') {
      return res.status(400).json({ error: 'Impossible de modifier une mission terminée' })
    }

    await prisma.mission.update({
      where: { id: mission.id },
      data:  { dossiers: { connect: (dossierIds as string[]).map((id: string) => ({ id })) } },
    })

    const missionMaj = await prisma.mission.findUnique({
      where:   { id: mission.id },
      include: {
        agent:    { select: { id: true, nom: true, prenom: true, telephone: true } },
        dossiers: {
          include: {
            patient:  { select: { nom: true, prenom: true, telephone: true, commune: true } },
            examens:  { include: { catalogue: true } },
            paiements: true,
          },
        },
      },
    })

    res.json({
      ...missionMaj,
      dossiers: missionMaj!.dossiers.map(d => ({
        ...d,
        finances: calculerPartPatient(d.examens),
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/missions/:id/statut ──────────────────────────────────────
// Avance le statut selon les transitions autorisées.
// Corps : { statut: MissionStatut }
router.patch('/:id/statut', async (req: AuthRequest, res: Response) => {
  try {
    const { statut: nouveauStatut } = req.body

    if (!nouveauStatut) {
      return res.status(400).json({ error: 'statut est obligatoire' })
    }

    const mission = await prisma.mission.findUnique({
      where: { id: String(req.params.id) },
    })
    if (!mission) {
      return res.status(404).json({ error: 'Mission introuvable' })
    }

    const transitions = TRANSITIONS_MISSION[mission.statut] ?? []
    if (!transitions.includes(nouveauStatut)) {
      return res.status(400).json({
        error: `Transition interdite : ${mission.statut} → ${nouveauStatut}`,
        transitionsAutorisees: transitions,
      })
    }

    // Quand la mission passe à PRELEVEMENT_FAIT,
    // mettre à jour le statut de tous les dossiers rattachés
    if (nouveauStatut === 'PRELEVEMENT_FAIT') {
      await prisma.dossier.updateMany({
        where: { missionId: mission.id },
        data:  { statut: 'PRELEVEMENT_FAIT' },
      })
    }

    const missionMaj = await prisma.mission.update({
      where: { id: mission.id },
      data:  { statut: nouveauStatut },
      include: {
        agent:    { select: { id: true, nom: true, prenom: true, telephone: true } },
        dossiers: {
          include: {
            patient:   { select: { nom: true, prenom: true, telephone: true } },
            examens:   { include: { catalogue: true } },
            paiements: true,
          },
        },
      },
    })

    res.json({
      ...missionMaj,
      dossiers: missionMaj.dossiers.map(d => ({
        ...d,
        finances: calculerPartPatient(d.examens),
      })),
      transitionsAutorisees: TRANSITIONS_MISSION[nouveauStatut] ?? [],
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/missions/:id/position ────────────────────────────────────
// Met à jour la position GPS de l'agent en temps réel.
// Corps : { latitude: number, longitude: number }
router.patch('/:id/position', async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude et longitude sont obligatoires' })
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude et longitude doivent être des nombres' })
    }

    const mission = await prisma.mission.update({
      where: { id: String(req.params.id) },
      data:  { latitude, longitude },
      select: { id: true, ref: true, statut: true, latitude: true, longitude: true, agentId: true },
    })

    res.json(mission)
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Mission introuvable' })
    }
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/missions/:id/encaissement ─────────────────────────────────
// Enregistre l'encaissement d'un dossier par l'agent et calcule sa commission.
//
// Corps : {
//   dossierId: string,
//   montant:   number,    // montant total encaissé (= partPatient calculée)
//   mode:      ModePaiement,
//   reference?: string
// }
//
// Règle commission : montant × tauxCommission de l'agent
router.post('/:id/encaissement', async (req: AuthRequest, res: Response) => {
  try {
    const { dossierId, montant, mode, reference } = req.body

    if (!dossierId || !montant || !mode) {
      return res.status(400).json({ error: 'dossierId, montant et mode sont obligatoires' })
    }

    const modesValides = ['CASH', 'ORANGE_MONEY', 'MTN_MONEY', 'WAVE', 'VIREMENT']
    if (!modesValides.includes(mode)) {
      return res.status(400).json({ error: `mode invalide. Valeurs : ${modesValides.join(', ')}` })
    }

    // Vérifier la mission
    const mission = await prisma.mission.findUnique({
      where:   { id: String(req.params.id) },
      include: { agent: true },
    })
    if (!mission) {
      return res.status(404).json({ error: 'Mission introuvable' })
    }
    if (mission.statut === 'TERMINEE') {
      return res.status(400).json({ error: 'Mission terminée — encaissement impossible' })
    }

    // Vérifier que le dossier appartient bien à cette mission
    const dossier = await prisma.dossier.findUnique({
      where:   { id: dossierId },
      include: { examens: true },
    })
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier introuvable' })
    }
    if (dossier.missionId !== mission.id) {
      return res.status(400).json({ error: 'Ce dossier n\'appartient pas à cette mission' })
    }

    // Enregistrer le paiement et la commission en transaction
    const now = new Date()
    const commissionMontant = Math.round(montant * mission.agent.tauxCommission)

    const [paiement, revenu] = await prisma.$transaction([
      prisma.paiement.create({
        data: {
          dossierId,
          montant:   Number(montant),
          mode,
          statut:    'CONFIRME',
          reference: reference ?? null,
          encaisseA: now,
        },
      }),
      prisma.revenu.create({
        data: {
          agentId:   mission.agentId,
          missionId: mission.id,
          montant:   commissionMontant,
          type:      'COMMISSION_ENCAISSEMENT',
          date:      now,
        },
      }),
    ])

    // Mettre le dossier en statut PAYE
    await prisma.dossier.update({
      where: { id: dossierId },
      data:  { statut: 'PAYE' },
    })

    res.status(201).json({
      paiement,
      revenu,
      commission: {
        taux:    mission.agent.tauxCommission,
        montant: commissionMontant,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
