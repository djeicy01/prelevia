import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'

const router = Router()

// Toutes les routes patients nécessitent d'être connecté
router.use(authMiddleware)

// ─── GET /api/patients ────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, commune, page = '1', limit = '20' } = req.query

    const where: any = {}

    // Recherche par nom ou téléphone
    if (search) {
      where.OR = [
        { nom:       { contains: String(search), mode: 'insensitive' } },
        { prenom:    { contains: String(search), mode: 'insensitive' } },
        { telephone: { contains: String(search) } },
        { ref:       { contains: String(search), mode: 'insensitive' } },
      ]
    }

    // Filtre par commune
    if (commune) {
      where.commune = String(commune)
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          assurance: { select: { nom:true } },
          dossiers:  { select: { id:true, statut:true, createdAt:true }, orderBy: { createdAt:'desc' }, take:1 }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.patient.count({ where })
    ])

    res.json({
      data:  patients,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/patients/:id ────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: String(req.params.id) },
      include: {
        assurance: true,
        dossiers: {
          include: {
            examens:  { include: { catalogue:true } },
            paiements: true,
            mission:  { include: { agent:true } },
            documentsResultats: true,
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!patient) {
      return res.status(404).json({ error: 'Patient introuvable' })
    }

    res.json(patient)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/patients ───────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, telephone, commune, adresse, assuranceId, numCarte } = req.body

    if (!nom || !prenom || !telephone || !commune) {
      return res.status(400).json({ error: 'Champs obligatoires : nom, prenom, telephone, commune' })
    }

    const nomN     = String(nom).toUpperCase().trim()
    const prenomN  = String(prenom).toUpperCase().trim()
    const communeN = String(commune).toUpperCase().trim()
    const adresseN = adresse ? String(adresse).toUpperCase().trim() : undefined

    // Générer la référence PRV-XXX
    const count = await prisma.patient.count()
    const ref   = `PRV-${String(count + 1).padStart(3, '0')}`

    const patient = await prisma.patient.create({
      data: { nom: nomN, prenom: prenomN, telephone, commune: communeN, adresse: adresseN, assuranceId, numCarte, ref },
      include: { assurance: true }
    })

    res.status(201).json(patient)
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Ce numéro de téléphone existe déjà' })
    }
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/patients/:id ──────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, telephone, commune, adresse, assuranceId, numCarte } = req.body

    const patient = await prisma.patient.update({
      where: { id: String(req.params.id) },
      data:  {
        ...(nom     !== undefined && { nom:     String(nom).toUpperCase().trim()     }),
        ...(prenom  !== undefined && { prenom:  String(prenom).toUpperCase().trim()  }),
        ...(commune !== undefined && { commune: String(commune).toUpperCase().trim() }),
        ...(adresse !== undefined && { adresse: String(adresse).toUpperCase().trim() }),
        telephone, assuranceId, numCarte,
      },
      include: { assurance: true }
    })

    res.json(patient)
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Patient introuvable' })
    }
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router