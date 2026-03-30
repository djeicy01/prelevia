import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'

const router = Router()
router.use(authMiddleware)

const INCLUDE_EXAMENS = {
  examens: {
    include: { catalogue: true },
    orderBy: { ordre: 'asc' as const },
  },
}

// ─── GET /api/panels ─────────────────────────────────────────
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const panels = await prisma.panel.findMany({
      include: INCLUDE_EXAMENS,
      orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
    })
    res.json(panels)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/panels/:id ─────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const panel = await prisma.panel.findUnique({
      where: { id: String(req.params.id) },
      include: INCLUDE_EXAMENS,
    })
    if (!panel) return res.status(404).json({ error: 'Panel introuvable' })
    res.json(panel)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/panels ────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { code, nom, description, categorie, catalogueIds } = req.body
    const panel = await prisma.panel.create({
      data: {
        code: String(code).toUpperCase(),
        nom,
        description: description ?? null,
        categorie,
        examens: {
          create: ((catalogueIds as string[]) ?? []).map((id, i) => ({
            catalogueId: id,
            ordre: i,
          })),
        },
      },
      include: INCLUDE_EXAMENS,
    })
    res.status(201).json(panel)
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Code ou nom déjà existant' })
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/panels/:id ───────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nom, description, categorie, actif } = req.body
    const data: Record<string, unknown> = {}
    if (nom         !== undefined) data.nom         = nom
    if (description !== undefined) data.description = description
    if (categorie   !== undefined) data.categorie   = categorie
    if (actif       !== undefined) data.actif       = actif

    const panel = await prisma.panel.update({
      where: { id: String(req.params.id) },
      data,
      include: INCLUDE_EXAMENS,
    })
    res.json(panel)
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Panel introuvable' })
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PUT /api/panels/:id/examens ─────────────────────────────
router.put('/:id/examens', async (req: AuthRequest, res: Response) => {
  try {
    const panelId = String(req.params.id)
    const catalogueIds: string[] = req.body.catalogueIds ?? []

    await prisma.$transaction([
      prisma.panelExamen.deleteMany({ where: { panelId: String(panelId) } }),
      prisma.panelExamen.createMany({
        data: catalogueIds.map((id, i) => ({ panelId: String(panelId), catalogueId: id, ordre: i })),
      }),
    ])

    const panel = await prisma.panel.findUnique({
      where: { id: String(panelId) },
      include: INCLUDE_EXAMENS,
    })
    res.json(panel)
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Panel introuvable' })
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
