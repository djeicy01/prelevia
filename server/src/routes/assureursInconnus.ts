import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'

const router = Router()

// ─── POST /api/assureurs-inconnus ────────────────────────────
// Signaler un assureur non partenaire (public — app patient)
// Si déjà signalé → incrémenter nombreMentions, sinon créer
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nom } = req.body
    if (!nom || !String(nom).trim()) {
      return res.status(400).json({ error: 'nom requis' })
    }

    const nomNormalise = String(nom).trim()

    const existant = await prisma.assureurNonPartenaire.findUnique({
      where: { nom: nomNormalise },
    })

    if (existant) {
      await prisma.assureurNonPartenaire.update({
        where: { nom: nomNormalise },
        data:  { nombreMentions: { increment: 1 } },
      })
    } else {
      await prisma.assureurNonPartenaire.create({
        data: { nom: nomNormalise },
      })
    }

    res.json({ connu: false, message: 'Assureur non partenaire enregistré' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/assureurs-inconnus ─────────────────────────────
// Liste triée par nombreMentions DESC — back-office uniquement
router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const liste = await prisma.assureurNonPartenaire.findMany({
      orderBy: { nombreMentions: 'desc' },
    })
    res.json(liste)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
