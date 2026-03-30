import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'

const router = Router()
router.use(authMiddleware)

// ─── GET /api/assurances ──────────────────────────────────────
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const assurances = await prisma.assurance.findMany({ orderBy: { nom: 'asc' } })
    res.json(assurances)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
