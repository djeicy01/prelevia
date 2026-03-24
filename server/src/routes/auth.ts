import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'

const router = Router()

// ─── POST /api/auth/login ─────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Validation basique
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' })
    }

    if (!user.actif) {
      return res.status(401).json({ error: 'Compte désactivé' })
    }

    // Vérifier le mot de passe
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants invalides' })
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    )

    res.json({
      token,
      user: {
        id:     user.id,
        email:  user.email,
        nom:    user.nom,
        prenom: user.prenom,
        role:   user.role,
      }
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/auth/me ─────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id:true, email:true, nom:true, prenom:true, role:true, createdAt:true }
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router