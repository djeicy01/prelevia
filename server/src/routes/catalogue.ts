import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'

const router = Router()
router.use(authMiddleware)

// ─── GET /api/catalogue ───────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { categorie, actif } = req.query
    const where: Record<string, unknown> = {}
    if (categorie) where.categorie = categorie
    if (actif !== undefined) where.actif = actif === 'true'

    const examens = await prisma.examenCatalogue.findMany({
      where,
      orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
    })
    res.json(examens)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/catalogue ──────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { code, nom, categorie, valeurB, typesTube, description } = req.body
    const vbParam = await prisma.parametre.findUnique({ where: { cle: 'VALEUR_B' } })
    const vb = vbParam ? parseInt(vbParam.valeur) : 200
    const coeff = Number(valeurB)
    const tarifMax = Math.round(coeff * vb)
    const tarifMin = Math.round(tarifMax * 0.9)

    const examen = await prisma.examenCatalogue.create({
      data: {
        code: String(code).toUpperCase(),
        nom,
        categorie,
        valeurB: coeff,
        tarifMin,
        tarifMax,
        typesTube: typesTube ?? '',
        description: description ?? null,
      },
    })
    res.status(201).json(examen)
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Code ou nom déjà existant' })
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/catalogue/:id ─────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nom, categorie, valeurB, typesTube, description, actif } = req.body
    const data: Record<string, unknown> = {}

    if (nom         !== undefined) data.nom         = nom
    if (categorie   !== undefined) data.categorie   = categorie
    if (typesTube   !== undefined) data.typesTube   = typesTube
    if (description !== undefined) data.description = description
    if (actif       !== undefined) data.actif       = actif

    if (valeurB !== undefined) {
      const vbParam = await prisma.parametre.findUnique({ where: { cle: 'VALEUR_B' } })
      const vb = vbParam ? parseInt(vbParam.valeur) : 200
      data.valeurB  = Number(valeurB)
      data.tarifMax = Math.round(Number(valeurB) * vb)
      data.tarifMin = Math.round((data.tarifMax as number) * 0.9)
    }

    const examen = await prisma.examenCatalogue.update({ where: { id: req.params.id }, data })
    res.json(examen)
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Examen introuvable' })
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
