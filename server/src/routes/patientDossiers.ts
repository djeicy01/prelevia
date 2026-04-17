import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authPatient, PatientRequest } from '../middlewares/auth'

const router = Router()

// ─── POST /api/patient/dossiers ──────────────────────────────────────────────
// Crée un dossier + Examens liés pour le patient connecté.
// Champs hors schéma Dossier (commune, adresse, créneau) :
//   • commune + adresse  → mis à jour sur Patient
//   • creneauDate + creneauHeure + assuranceNonPartenaireNom → sérialisés dans noteAdmin (JSON)
//   • campagneCode → lookup Campagne.ref → campagneId sur Dossier
router.post('/', authPatient, async (req: PatientRequest, res: Response) => {
  try {
    const patientId = req.patient!.patientId

    const {
      examens,                   // string[] — catalogueIds
      ocrSource,
      bulletinUrl,
      assuranceId,
      assuranceNonPartenaireNom,
      campagneCode,
      commune,
      adresse,
      creneauDate,
      creneauHeure,
    } = req.body

    if (!examens || !Array.isArray(examens) || examens.length === 0)
      return res.status(400).json({ error: 'Au moins un examen est requis' })
    if (!commune || !adresse)
      return res.status(400).json({ error: 'commune et adresse sont obligatoires' })
    if (!creneauDate || !creneauHeure)
      return res.status(400).json({ error: 'creneauDate et creneauHeure sont obligatoires' })

    const communeN = String(commune).toUpperCase().trim()
    const adresseN = String(adresse).toUpperCase().trim()

    // Charger les tarifs pour figer le prix à la création
    const catalogueItems = await prisma.examenCatalogue.findMany({
      where: { id: { in: examens }, actif: true },
    })
    if (catalogueItems.length === 0)
      return res.status(400).json({ error: 'Aucun examen valide trouvé dans le catalogue' })

    // Vérifier que l'assuranceId fourni existe réellement en base.
    // Si l'ID est inconnu → ignorer silencieusement (pas d'erreur 400).
    let assuranceIdValide: string | null = null
    if (assuranceId) {
      const assurance = await prisma.assurance.findUnique({ where: { id: assuranceId } })
      if (assurance) {
        assuranceIdValide = assuranceId
      } else {
        console.warn(`[POST /patient/dossiers] assuranceId "${assuranceId}" introuvable en base — ignoré`)
      }
    }

    // Lookup campagne par code (= Campagne.ref)
    let campagneIdValide: string | null = null
    if (campagneCode) {
      const campagne = await prisma.campagne.findUnique({ where: { ref: campagneCode } })
      if (campagne) campagneIdValide = campagne.id
    }

    // Stocker les champs hors-schéma Dossier dans noteAdmin (JSON)
    // Note : Dossier n'a pas de champ assuranceId — l'assurance est sur Patient.
    // On stocke ici l'info assurance pour le back-office.
    const meta = {
      creneauDate,
      creneauHeure,
      ...(assuranceIdValide         ? { assuranceId: assuranceIdValide }                 : {}),
      ...(assuranceNonPartenaireNom ? { assuranceNonPartenaireNom }                      : {}),
    }

    // Générer la référence DOS-YYYY-NNNNN (auto-incrémenté par année)
    const year      = new Date().getFullYear()
    const yearCount = await prisma.dossier.count({ where: { ref: { startsWith: `DOS-${year}-` } } })
    const ref       = `DOS-${year}-${String(yearCount + 1).padStart(5, '0')}`

    // Mettre à jour commune + adresse sur le patient
    await prisma.patient.update({
      where: { id: patientId },
      data:  { commune: communeN, adresse: adresseN },
    })

    // Créer le dossier
    // Note : Dossier n'a pas de champ assuranceId dans le schéma Prisma.
    // L'assurance est stockée dans noteAdmin (JSON) et sur le modèle Patient.
    const dossier = await prisma.dossier.create({
      data: {
        ref,
        patientId,
        statut:          'EN_ATTENTE',
        ocrSource:       ocrSource ?? 'MANUAL',
        bulletinUrl:     bulletinUrl ?? null,
        campagneId:      campagneIdValide,
        statutAssurance: (assuranceIdValide || assuranceNonPartenaireNom) ? 'DOCS_COLLECTES' : null,
        noteAdmin:       JSON.stringify(meta),
        examens: {
          create: catalogueItems.map(item => ({
            catalogueId: item.id,
            tarif:       item.tarifMax,
            couvert:     null,
            quotePart:   null,
          })),
        },
      },
      include: {
        examens: { include: { catalogue: true } },
        patient: { select: { nom: true, prenom: true, telephone: true, commune: true, adresse: true } },
        campagne: { select: { nom: true, ref: true } },
      },
    })

    return res.status(201).json(dossier)
  } catch (err) {
    console.error('[POST /patient/dossiers]', err)
    return res.status(500).json({ error: 'Erreur lors de la création du dossier' })
  }
})

// ─── GET /api/patient/dossiers ───────────────────────────────────────────────
router.get('/', authPatient, async (req: PatientRequest, res: Response) => {
  try {
    const patientId = req.patient!.patientId

    const dossiers = await prisma.dossier.findMany({
      where:   { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        examens: {
          include: { catalogue: { select: { nom: true, code: true, categorie: true, tarifMax: true } } },
        },
        mission: {
          select: {
            statut:    true,
            date:      true,
            latitude:  true,
            longitude: true,
            agent:     { select: { nom: true, prenom: true, telephone: true } },
          },
        },
        campagne: { select: { nom: true, ref: true } },
      },
    })

    return res.json({ dossiers })
  } catch (err) {
    console.error('[GET /patient/dossiers]', err)
    return res.status(500).json({ error: 'Erreur lors de la récupération des dossiers' })
  }
})

// ─── GET /api/patient/dossiers/:id ───────────────────────────────────────────
router.get('/:id', authPatient, async (req: PatientRequest, res: Response) => {
  try {
    const patientId = req.patient!.patientId
    const { id }    = req.params

    const dossier = await prisma.dossier.findFirst({
      where: { id: String(req.params.id), patientId: String(patientId) },
      include: {
        examens: {
          include: { catalogue: true },
        },
        paiements: true,
        mission: {
          include: {
            agent: { select: { nom: true, prenom: true, telephone: true } },
          },
        },
        campagne: true,
      },
    })

    if (!dossier) return res.status(404).json({ error: 'Dossier non trouvé' })

    return res.json(dossier)
  } catch (err) {
    console.error('[GET /patient/dossiers/:id]', err)
    return res.status(500).json({ error: 'Erreur lors de la récupération du dossier' })
  }
})

// ─── PATCH /api/patient/dossiers/:id/annuler ─────────────────────────────────
// Patient peut annuler uniquement si statut EN_ATTENTE
router.patch('/:id/annuler', authPatient, async (req: PatientRequest, res: Response) => {
  try {
    const patientId = req.patient!.patientId
    const dossier   = await prisma.dossier.findFirst({
      where: { id: req.params.id, patientId },
    })
    if (!dossier) return res.status(404).json({ error: 'Dossier non trouvé' })
    if (dossier.statut !== 'EN_ATTENTE') {
      return res.status(403).json({ error: 'Annulation impossible : le dossier est déjà en traitement' })
    }
    const updated = await prisma.dossier.update({
      where: { id: dossier.id },
      data:  { statut: 'ANNULE' },
    })
    return res.json(updated)
  } catch (err) {
    console.error('[PATCH /patient/dossiers/:id/annuler]', err)
    return res.status(500).json({ error: 'Erreur lors de l\'annulation' })
  }
})

export default router
