import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, requireRole, AuthRequest } from '../middlewares/auth'

const router = Router()

const authLabo = [authMiddleware, requireRole(['LABO', 'SUPER_ADMIN', 'ADMIN'])]

// ─── GET /api/labo/dossiers ───────────────────────────────────
// Dossiers dont le prélèvement est fait mais les résultats pas encore tous saisis
router.get('/dossiers', ...authLabo, async (req: AuthRequest, res: Response) => {
  try {
    const { statut } = req.query

    const statutsFiltres = statut
      ? [String(statut)]
      : ['PRELEVEMENT_FAIT', 'RESULTATS_EN_COURS']

    const dossiers = await prisma.dossier.findMany({
      where: { statut: { in: statutsFiltres as any } },
      include: {
        patient: {
          select: { nom: true, prenom: true, ref: true, commune: true, telephone: true },
        },
        examens: {
          include: {
            catalogue: { select: { code: true, nom: true, categorie: true, typesTube: true } },
            resultat:  true,
          },
        },
        mission: {
          select: { date: true, ref: true },
        },
      },
      orderBy: { updatedAt: 'asc' },
    })

    // Enrichir avec le compte de résultats saisis
    const enrichis = dossiers.map(d => ({
      ...d,
      nbExamens:    d.examens.length,
      nbResultats:  d.examens.filter(e => e.resultat !== null).length,
    }))

    res.json({ data: enrichis, total: enrichis.length })
  } catch (err) {
    console.error('[GET /labo/dossiers]', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/labo/resultats ────────────────────────────────
// Saisir ou mettre à jour le résultat d'un examen
router.post('/resultats', ...authLabo, async (req: AuthRequest, res: Response) => {
  try {
    const {
      examenId,
      valeur,
      unite,
      interpretation = 'EN_ATTENTE',
      commentaire,
      normaleMin,
      normaleMax,
      normeMin,
      normeMax,
      estCritique = false,
    } = req.body

    if (!examenId) {
      return res.status(400).json({ error: 'examenId est obligatoire' })
    }

    const INTERPRETATIONS_VALIDES = ['NORMAL', 'ELEVE', 'BAS', 'CRITIQUE', 'POSITIF', 'NEGATIF', 'EN_ATTENTE']
    if (!INTERPRETATIONS_VALIDES.includes(interpretation)) {
      return res.status(400).json({ error: `interpretation invalide. Valeurs : ${INTERPRETATIONS_VALIDES.join(', ')}` })
    }

    // Récupérer l'examen + dossier
    const examen = await prisma.examen.findUnique({
      where:   { id: examenId },
      include: { dossier: { select: { id: true, patientId: true, statut: true } } },
    })
    if (!examen) return res.status(404).json({ error: 'Examen introuvable' })

    // Upsert du résultat (create ou update)
    const resultat = await prisma.resultatExamen.upsert({
      where:  { examenId },
      create: {
        examenId,
        patientId:      examen.dossier.patientId,
        valeur:         valeur   ?? null,
        unite:          unite    ?? null,
        normaleMin:     normaleMin ?? null,
        normaleMax:     normaleMax ?? null,
        normeMin:       normeMin   ?? null,
        normeMax:       normeMax   ?? null,
        estCritique:    Boolean(estCritique),
        interpretation,
        commentaire:    commentaire ?? null,
        saisiPar:       req.user!.email,
      },
      update: {
        valeur:         valeur   ?? undefined,
        unite:          unite    ?? undefined,
        normaleMin:     normaleMin ?? undefined,
        normaleMax:     normaleMax ?? undefined,
        normeMin:       normeMin   ?? undefined,
        normeMax:       normeMax   ?? undefined,
        estCritique:    Boolean(estCritique),
        interpretation,
        commentaire:    commentaire ?? undefined,
        saisiPar:       req.user!.email,
      },
    })

    // Transitions de statut automatiques
    const dossierId = examen.dossier.id

    if (examen.dossier.statut === 'PRELEVEMENT_FAIT') {
      await prisma.dossier.update({ where: { id: dossierId }, data: { statut: 'RESULTATS_EN_COURS' } })
    }

    // Si tous les examens du dossier ont un résultat → RESULTATS_DISPONIBLES
    const tousExamens = await prisma.examen.findMany({
      where:   { dossierId },
      include: { resultat: { select: { id: true } } },
    })
    if (tousExamens.every(e => e.resultat !== null)) {
      await prisma.dossier.update({ where: { id: dossierId }, data: { statut: 'RESULTATS_DISPONIBLES' } })
    }

    res.status(201).json(resultat)
  } catch (err) {
    console.error('[POST /labo/resultats]', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/labo/dossiers/:id ──────────────────────────────
// Détail d'un dossier avec tous ses examens + résultats
router.get('/dossiers/:id', ...authLabo, async (req: AuthRequest, res: Response) => {
  try {
    const dossier = await prisma.dossier.findUnique({
      where: { id: String(req.params.id) },
      include: {
        patient: {
          select: { nom: true, prenom: true, ref: true, commune: true, telephone: true },
        },
        examens: {
          include: {
            catalogue: true,
            resultat:  true,
          },
        },
      },
    })
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' })
    res.json(dossier)
  } catch (err) {
    console.error('[GET /labo/dossiers/:id]', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
