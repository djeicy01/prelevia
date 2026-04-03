import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth'

const router = Router()

// ─── GET /api/campagnes/valider/:code ────────────────────────
// Vérifie qu'une campagne est active et retourne ses examens
// :code correspond au champ ref de la campagne (ex: "CAMP-2026-00001")
router.get('/valider/:code', async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params

    const campagne = await prisma.campagne.findUnique({
      where:   { ref: String(code) },
      include: {
        organisation: { select: { id: true, nom: true, type: true } },
        panels: {
          include: {
            panel: {
              include: {
                examens: {
                  include: { catalogue: { select: { id: true, code: true, nom: true, tarifMax: true } } },
                  orderBy: { ordre: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!campagne) {
      return res.json({ valide: false, message: 'Code campagne introuvable' })
    }

    if (campagne.statut !== 'EN_COURS') {
      return res.json({
        valide:   false,
        message:  `Campagne ${campagne.statut.toLowerCase().replace('_', ' ')}`,
        statut:   campagne.statut,
      })
    }

    // Aplatir les examens de tous les panels
    const examens = campagne.panels.flatMap(cp =>
      cp.panel.examens.map(pe => pe.catalogue)
    )

    res.json({
      valide:       true,
      ref:          campagne.ref,
      nom:          campagne.nom,
      organisation: campagne.organisation,
      dateDebut:    campagne.dateDebut,
      dateFin:      campagne.dateFin,
      examens,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
