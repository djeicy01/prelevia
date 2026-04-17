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

// ─── POST /api/assurances ─────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nom, type, tauxCouverture, delaiValidation, contactEmail, contactTel } = req.body
    if (!nom || !type || tauxCouverture === undefined || !delaiValidation) {
      return res.status(400).json({ error: 'nom, type, tauxCouverture et delaiValidation sont obligatoires' })
    }
    const assurance = await prisma.assurance.create({
      data: {
        nom,
        type,
        tauxCouverture: Number(tauxCouverture),
        delaiValidation,
        contactEmail: contactEmail || null,
        contactTel:   contactTel   || null,
      },
    })
    res.status(201).json(assurance)
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Une assurance avec ce nom existe déjà' })
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/assurances/:id ────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nom, type, tauxCouverture, delaiValidation, contactEmail, contactTel, actif } = req.body
    const data: any = {}
    if (nom             !== undefined) data.nom             = nom
    if (type            !== undefined) data.type            = type
    if (tauxCouverture  !== undefined) data.tauxCouverture  = Number(tauxCouverture)
    if (delaiValidation !== undefined) data.delaiValidation = delaiValidation
    if (contactEmail    !== undefined) data.contactEmail    = contactEmail || null
    if (contactTel      !== undefined) data.contactTel      = contactTel   || null
    if (actif           !== undefined) data.actif           = actif
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' })
    }
    const assurance = await prisma.assurance.update({ where: { id: req.params.id }, data })
    res.json(assurance)
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Assurance introuvable' })
    if (err.code === 'P2002') return res.status(409).json({ error: 'Ce nom est déjà utilisé' })
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
