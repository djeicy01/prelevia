import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Étend le type Request pour ajouter user
export interface AuthRequest extends Request {
  user?: {
    userId: string
    role:   string
    email:  string
  }
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}

// Contrôle des rôles
export const requireRole = (roles: string[]) => (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé — droits insuffisants' })
  }
  next()
}