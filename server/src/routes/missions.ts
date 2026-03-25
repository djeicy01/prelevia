import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'
import { calculerPartPatient } from './dossiers'

const router = Router()
router.use(authMiddleware)

// Transitions autorisées pour le statut de mission
const TRANSITIONS_MISSION: Record<string, string[]> = {
  PLANIFIEE:        ['EN_ROUTE'],
  EN_ROUTE:         ['ARRIVEE'],
  ARRIVEE:          ['PRELEVEMENT_FAIT'],
  PRELEVEMENT_FAIT: ['TERMINEE'],
  TERMINEE:         [],  // état terminal
}

// ─── GET /api/missions ────────────────────────────────────────────────────
// Filtres : agentId, statut, dateDebut, dateFin
// Pagination : page, limit
router.get('/', async (req: AuthRequest, res: Response) => {
  // ...liste paginée + finances agrégées par mission
})

// ─── GET /api/missions/:id ────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  // ...détail complet + transitionsAutorisees + totalEncaisse
})

// ─── POST /api/missions ───────────────────────────────────────────────────
// Corps : { agentId, date, dossierIds? }
router.post('/', async (req: AuthRequest, res: Response) => {
  // ...création, vérifie agent ACTIF, génère ref MIS-XXX
})

// ─── POST /api/missions/:id/dossiers ─────────────────────────────────────
// Corps : { dossierIds: string[] }
router.post('/:id/dossiers', async (req: AuthRequest, res: Response) => {
  // ...rattachement dossiers, bloqué si TERMINEE
})

// ─── PATCH /api/missions/:id/statut ──────────────────────────────────────
// Corps : { statut: MissionStatut }
router.patch('/:id/statut', async (req: AuthRequest, res: Response) => {
  // ...machine à états stricte, cascade PRELEVEMENT_FAIT → dossiers
})

// ─── PATCH /api/missions/:id/position ────────────────────────────────────
// Corps : { latitude: number, longitude: number }
router.patch('/:id/position', async (req: AuthRequest, res: Response) => {
  // ...mise à jour GPS temps réel
})

// ─── POST /api/missions/:id/encaissement ─────────────────────────────────
// Corps : { dossierId, montant, mode, reference? }
router.post('/:id/encaissement', async (req: AuthRequest, res: Response) => {
  // ...transaction atomique Paiement + Revenu commission, dossier → PAYE
})

export default router
