import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'

const router = Router()
router.use(authMiddleware)

// ─── GET /api/parametres ──────────────────────────────────────
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const params = await prisma.parametre.findMany({ orderBy: { cle: 'asc' } })
    res.json(params)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/parametres/laboratoire ─────────────────────────
// NOTE: static routes MUST come before /:cle
router.get('/laboratoire', async (_req: AuthRequest, res: Response) => {
  try {
    const labo = await prisma.laboratoire.findFirst({ where: { principal: true } })
    res.json(labo)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/parametres/laboratoire ───────────────────────
router.patch('/laboratoire', async (req: AuthRequest, res: Response) => {
  try {
    const { nom, adresse, telephone, email, valeurB } = req.body
    const labo = await prisma.laboratoire.findFirst({ where: { principal: true } })
    if (!labo) return res.status(404).json({ error: 'Laboratoire principal introuvable' })

    const data: Record<string, unknown> = {}
    if (nom       !== undefined) data.nom       = nom
    if (adresse   !== undefined) data.adresse   = adresse
    if (telephone !== undefined) data.telephone = telephone
    if (email     !== undefined) data.email     = email
    if (valeurB   !== undefined) data.valeurB   = Number(valeurB)

    const updated = await prisma.laboratoire.update({ where: { id: labo.id }, data })
    res.json(updated)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/parametres/recalculer-tarifs ───────────────────
router.post('/recalculer-tarifs', async (_req: AuthRequest, res: Response) => {
  try {
    const paramVB = await prisma.parametre.findUnique({ where: { cle: 'VALEUR_B' } })
    const vb = paramVB ? parseInt(paramVB.valeur) : 200

    const examens = await prisma.examenCatalogue.findMany()
    for (const e of examens) {
      const tarifMax = Math.round(e.valeurB * vb)
      const tarifMin = Math.round(tarifMax * 0.9)
      await prisma.examenCatalogue.update({ where: { id: e.id }, data: { tarifMax, tarifMin } })
    }

    res.json({ success: true, count: examens.length, valeurB: vb })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/parametres/templates-sms ───────────────────────
router.get('/templates-sms', async (_req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.templateSMS.findMany({ orderBy: { code: 'asc' } })
    res.json(templates)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/parametres/templates-sms/:code ───────────────
router.patch('/templates-sms/:code', async (req: AuthRequest, res: Response) => {
  try {
    const { sujet, contenu, actif } = req.body
    const data: Record<string, unknown> = {}
    if (sujet   !== undefined) data.sujet   = sujet
    if (contenu !== undefined) data.contenu = contenu
    if (actif   !== undefined) data.actif   = actif

    const tpl = await prisma.templateSMS.update({ where: { code: req.params.code }, data })
    res.json(tpl)
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Template introuvable' })
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/parametres/zones ───────────────────────────────
router.get('/zones', async (_req: AuthRequest, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({ orderBy: { nom: 'asc' } })
    res.json(zones)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/parametres/:cle ──────────────────────────────
// Must be declared LAST to avoid shadowing static paths above
router.patch('/:cle', async (req: AuthRequest, res: Response) => {
  try {
    const { valeur } = req.body
    const param = await prisma.parametre.update({
      where: { cle: req.params.cle },
      data: { valeur: String(valeur) }
    })
    res.json(param)
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Paramètre introuvable' })
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
