import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'

const router = Router()
router.use(authMiddleware)

// ─── GET /api/agents ──────────────────────────────────────────────────────
// Filtres : statut, commune, search (nom/prénom/tél)
// Pagination : page, limit
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      statut,
      commune,
      search,
      page  = '1',
      limit = '20',
    } = req.query

    const where: any = {}

    if (statut)  where.statut  = String(statut)
    if (commune) where.commune = { contains: String(commune), mode: 'insensitive' }

    if (search) {
      where.OR = [
        { nom:       { contains: String(search), mode: 'insensitive' } },
        { prenom:    { contains: String(search), mode: 'insensitive' } },
        { telephone: { contains: String(search) } },
        { email:     { contains: String(search), mode: 'insensitive' } },
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          stocks:   true,
          missions: {
            where:   { statut: { in: ['PLANIFIEE', 'EN_ROUTE', 'ARRIVEE', 'PRELEVEMENT_FAIT'] } },
            orderBy: { date: 'asc' },
            select:  { id: true, ref: true, statut: true, date: true },
          },
          _count: { select: { missions: true, revenus: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.agent.count({ where }),
    ])

    // KPIs revenus du jour pour chaque agent
    const debutJour = new Date()
    debutJour.setHours(0, 0, 0, 0)

    const agentsAvecKpis = await Promise.all(
      agents.map(async a => {
        const revenuJour = await prisma.revenu.aggregate({
          where:  { agentId: a.id, date: { gte: debutJour } },
          _sum:   { montant: true },
          _count: true,
        })
        return {
          ...a,
          revenuJour:      revenuJour._sum.montant ?? 0,
          nbPrelevJour:    revenuJour._count,
          stocksEnAlerte:  a.stocks.filter(s => s.quantite <= s.seuilAlerte).length,
        }
      })
    )

    res.json({
      data:  agentsAvecKpis,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/agents/:id ──────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const agent = await prisma.agent.findUnique({
      where:   { id: String(req.params.id) },
      include: {
        stocks: true,
        missions: {
          orderBy: { date: 'desc' },
          take:    20,
          include: {
            dossiers: {
              select: {
                id: true, ref: true, statut: true,
                patient: { select: { nom: true, prenom: true, telephone: true } },
              },
            },
          },
        },
        revenus: {
          orderBy: { date: 'desc' },
          take:    50,
        },
      },
    })

    if (!agent) {
      return res.status(404).json({ error: 'Agent introuvable' })
    }

    // Agrégats revenus
    const [revenuTotal, revenuMois] = await Promise.all([
      prisma.revenu.aggregate({
        where: { agentId: agent.id },
        _sum:  { montant: true },
      }),
      prisma.revenu.aggregate({
        where: {
          agentId: agent.id,
          date:    { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum:  { montant: true },
      }),
    ])

    res.json({
      ...agent,
      stats: {
        revenuTotal:       revenuTotal._sum.montant ?? 0,
        revenuMoisEnCours: revenuMois._sum.montant ?? 0,
        nbMissions:        agent.missions.length,
        stocksEnAlerte:    agent.stocks.filter(s => s.quantite <= s.seuilAlerte).length,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/agents ─────────────────────────────────────────────────────
// Corps : { nom, prenom, telephone, email?, commune, statut?, tauxCommission? }
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      nom,
      prenom,
      telephone,
      email,
      commune,
      statut         = 'ACTIF',
      tauxCommission = 0.15,
    } = req.body

    if (!nom || !prenom || !telephone || !commune) {
      return res.status(400).json({ error: 'nom, prenom, telephone et commune sont obligatoires' })
    }

    const agent = await prisma.agent.create({
      data: { nom, prenom, telephone, email, commune, statut, tauxCommission },
    })

    res.status(201).json(agent)
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Un agent avec ce numéro de téléphone existe déjà' })
    }
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/agents/:id ────────────────────────────────────────────────
// Mise à jour partielle (tous les champs optionnels)
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const {
      nom,
      prenom,
      telephone,
      email,
      commune,
      statut,
      tauxCommission,
    } = req.body

    const statutsValides = ['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_FORMATION']
    if (statut && !statutsValides.includes(statut)) {
      return res.status(400).json({ error: `statut invalide. Valeurs : ${statutsValides.join(', ')}` })
    }

    const data: any = {}
    if (nom            !== undefined) data.nom            = nom
    if (prenom         !== undefined) data.prenom         = prenom
    if (telephone      !== undefined) data.telephone      = telephone
    if (email          !== undefined) data.email          = email
    if (commune        !== undefined) data.commune        = commune
    if (statut         !== undefined) data.statut         = statut
    if (tauxCommission !== undefined) data.tauxCommission = tauxCommission

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' })
    }

    const agent = await prisma.agent.update({
      where: { id: String(req.params.id) },
      data,
    })

    res.json(agent)
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Agent introuvable' })
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ce numéro de téléphone est déjà utilisé' })
    }
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/agents/:id/stock ────────────────────────────────────────────
router.get('/:id/stock', async (req: AuthRequest, res: Response) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: String(req.params.id) } })
    if (!agent) {
      return res.status(404).json({ error: 'Agent introuvable' })
    }

    const stocks = await prisma.stockAgent.findMany({
      where:   { agentId: String(req.params.id) },
      orderBy: { materiau: 'asc' },
    })

    res.json({
      agentId:  agent.id,
      agentNom: `${agent.prenom} ${agent.nom}`,
      stocks,
      alertes:  stocks.filter(s => s.quantite <= s.seuilAlerte),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/agents/:id/stock ──────────────────────────────────────────
// Corps : { items: [{ materiau, quantite, seuilAlerte? }] }
// Utilise upsert — crée l'article si inexistant, met à jour sinon.
router.patch('/:id/stock', async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items (tableau non vide) est obligatoire' })
    }

    const agent = await prisma.agent.findUnique({ where: { id: String(req.params.id) } })
    if (!agent) {
      return res.status(404).json({ error: 'Agent introuvable' })
    }

    // Validation des articles
    for (const item of items) {
      if (!item.materiau || item.quantite === undefined) {
        return res.status(400).json({ error: 'Chaque item doit avoir materiau et quantite' })
      }
      if (typeof item.quantite !== 'number' || item.quantite < 0) {
        return res.status(400).json({ error: `Quantité invalide pour ${item.materiau}` })
      }
    }

    const agentId = String(req.params.id)

    await Promise.all(
      items.map((item: { materiau: string; quantite: number; seuilAlerte?: number }) =>
        prisma.stockAgent.upsert({
          where:  { agentId_materiau: { agentId, materiau: item.materiau } },
          create: {
            agentId,
            materiau:    item.materiau,
            quantite:    item.quantite,
            seuilAlerte: item.seuilAlerte ?? 10,
          },
          update: {
            quantite: item.quantite,
            ...(item.seuilAlerte !== undefined && { seuilAlerte: item.seuilAlerte }),
          },
        })
      )
    )

    const stocks = await prisma.stockAgent.findMany({
      where:   { agentId },
      orderBy: { materiau: 'asc' },
    })

    res.json({
      agentId,
      stocks,
      alertes: stocks.filter(s => s.quantite <= s.seuilAlerte),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/agents/:id/revenus ──────────────────────────────────────────
// Filtres optionnels : dateDebut, dateFin, type
router.get('/:id/revenus', async (req: AuthRequest, res: Response) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: String(req.params.id) } })
    if (!agent) {
      return res.status(404).json({ error: 'Agent introuvable' })
    }

    const { dateDebut, dateFin, type, page = '1', limit = '50' } = req.query

    const where: any = { agentId: String(req.params.id) }

    if (dateDebut || dateFin) {
      where.date = {}
      if (dateDebut) where.date.gte = new Date(String(dateDebut))
      if (dateFin)   where.date.lte = new Date(String(dateFin))
    }
    if (type) where.type = String(type)

    const skip = (Number(page) - 1) * Number(limit)

    const [revenus, total, agregat] = await Promise.all([
      prisma.revenu.findMany({
        where,
        include: {
          mission: { select: { ref: true, date: true, statut: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.revenu.count({ where }),
      prisma.revenu.aggregate({ where, _sum: { montant: true } }),
    ])

    res.json({
      data:         revenus,
      total,
      page:         Number(page),
      pages:        Math.ceil(total / Number(limit)),
      totalMontant: agregat._sum.montant ?? 0,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
