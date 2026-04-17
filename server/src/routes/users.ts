import { Router, Response } from 'express'
import bcrypt from 'bcrypt'
import prisma from '../lib/prisma'
import { authMiddleware, requireRole, AuthRequest } from '../middlewares/auth'

const router = Router()

// Toutes les routes /api/users exigent SUPER_ADMIN
router.use(authMiddleware)
router.use(requireRole(['SUPER_ADMIN']))

const ROLES_VALIDES = ['SUPER_ADMIN', 'ADMIN', 'COORDINATEUR', 'COMPTABLE', 'LABO']

// ─── GET /api/users ───────────────────────────────────────────
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, nom: true, prenom: true,
        role: true, actif: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: users, total: users.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/users ──────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, email, password, role = 'ADMIN' } = req.body

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: 'nom, prenom, email et password sont obligatoires' })
    }
    if (!ROLES_VALIDES.includes(role)) {
      return res.status(400).json({ error: `Rôle invalide. Valeurs acceptées : ${ROLES_VALIDES.join(', ')}` })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        nom:      String(nom).toUpperCase().trim(),
        prenom:   String(prenom).toUpperCase().trim(),
        email:    String(email).toLowerCase().trim(),
        password: hashed,
        role,
      },
      select: { id: true, email: true, nom: true, prenom: true, role: true, actif: true, createdAt: true },
    })

    res.status(201).json(user)
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Cet email est déjà utilisé' })
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/users/:id ─────────────────────────────────────
// Permet de : modifier le rôle, réinitialiser le mot de passe, activer/désactiver
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { role, password, actif, nom, prenom } = req.body
    const data: any = {}

    if (role !== undefined) {
      if (!ROLES_VALIDES.includes(role)) return res.status(400).json({ error: 'Rôle invalide' })
      data.role = role
    }
    if (password)          data.password = await bcrypt.hash(String(password), 10)
    if (actif !== undefined) data.actif  = Boolean(actif)
    if (nom)               data.nom      = String(nom).toUpperCase().trim()
    if (prenom)            data.prenom   = String(prenom).toUpperCase().trim()

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' })
    }

    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data,
      select: { id: true, email: true, nom: true, prenom: true, role: true, actif: true },
    })

    res.json(user)
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Utilisateur introuvable' })
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── DELETE /api/users/:id ────────────────────────────────────
// Soft delete — désactive le compte (actif = false)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.userId === req.params.id) {
      return res.status(400).json({ error: 'Impossible de désactiver votre propre compte' })
    }

    await prisma.user.update({
      where: { id: String(req.params.id) },
      data:  { actif: false },
    })

    res.json({ message: 'Compte désactivé' })
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Utilisateur introuvable' })
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
