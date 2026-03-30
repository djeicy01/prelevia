import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middlewares/auth'

const router = Router()
router.use(authMiddleware)

// ─── Helpers ──────────────────────────────────────────────────────────────

function debutPeriode(type: 'jour' | 'semaine' | 'mois' | 'annee'): Date {
  const d = new Date()
  if (type === 'jour')    { d.setHours(0, 0, 0, 0); return d }
  if (type === 'semaine') { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d }
  if (type === 'mois')    { return new Date(d.getFullYear(), d.getMonth(), 1) }
  if (type === 'annee')   { return new Date(d.getFullYear(), 0, 1) }
  return d
}

// ─── GET /api/rapports/dashboard ──────────────────────────────────────────
// Tous les KPIs principaux du back-office en une seule requête.
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const debutJour  = debutPeriode('jour')
    const debutMois  = debutPeriode('mois')
    const debutAnnee = debutPeriode('annee')

    const [
      // Patients
      totalPatients,
      patientsJour,

      // Dossiers par statut
      dossiersParStatut,

      // Assurances en cours (workflow actif)
      assurancesEnCours,

      // Revenus (paiements confirmés)
      revenuJour,
      revenuMois,
      revenuAnnee,

      // Sources OCR
      ocrAuto,
      ocrPatient,
      ocrAgent,
      ocrManual,

      // Missions actives
      missionsActives,

      // Agents actifs
      agentsActifs,

    ] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({ where: { createdAt: { gte: debutJour } } }),

      // groupBy statut dossier
      prisma.dossier.groupBy({ by: ['statut'], _count: { _all: true } }),

      // Assurances en cours : pas encore terminées/refusées
      prisma.dossier.count({
        where: {
          statutAssurance: { in: ['DOCS_COLLECTES', 'SOUMIS_LABO', 'EN_VALIDATION'] },
        },
      }),

      prisma.paiement.aggregate({
        where: { statut: 'CONFIRME', encaisseA: { gte: debutJour } },
        _sum:  { montant: true },
        _count: true,
      }),
      prisma.paiement.aggregate({
        where: { statut: 'CONFIRME', encaisseA: { gte: debutMois } },
        _sum:  { montant: true },
        _count: true,
      }),
      prisma.paiement.aggregate({
        where: { statut: 'CONFIRME', encaisseA: { gte: debutAnnee } },
        _sum:  { montant: true },
        _count: true,
      }),

      // OCR sources
      prisma.dossier.count({ where: { ocrSource: 'AUTO' } }),
      prisma.dossier.count({ where: { ocrSource: 'PATIENT' } }),
      prisma.dossier.count({ where: { ocrSource: 'AGENT' } }),
      prisma.dossier.count({ where: { ocrSource: 'MANUAL' } }),

      prisma.mission.count({
        where: { statut: { in: ['PLANIFIEE', 'EN_ROUTE', 'ARRIVEE', 'PRELEVEMENT_FAIT'] } },
      }),

      prisma.agent.count({ where: { statut: 'ACTIF' } }),
    ])

    const totalDossiers = dossiersParStatut.reduce((acc, d) => acc + d._count._all, 0)
    const totalOcr = ocrAuto + ocrPatient + ocrAgent + ocrManual

    res.json({
      patients: {
        total:  totalPatients,
        aujourdhui: patientsJour,
      },
      dossiers: {
        total:     totalDossiers,
        parStatut: Object.fromEntries(
          dossiersParStatut.map(d => [d.statut, d._count._all])
        ),
        assurancesEnCours,
      },
      revenus: {
        jour:  { montant: revenuJour._sum.montant  ?? 0, count: revenuJour._count },
        mois:  { montant: revenuMois._sum.montant  ?? 0, count: revenuMois._count },
        annee: { montant: revenuAnnee._sum.montant ?? 0, count: revenuAnnee._count },
      },
      ocr: {
        total:   totalOcr,
        auto:    { count: ocrAuto,    pct: totalOcr ? Math.round(ocrAuto    / totalOcr * 100) : 0 },
        patient: { count: ocrPatient, pct: totalOcr ? Math.round(ocrPatient / totalOcr * 100) : 0 },
        agent:   { count: ocrAgent,   pct: totalOcr ? Math.round(ocrAgent   / totalOcr * 100) : 0 },
        manual:  { count: ocrManual,  pct: totalOcr ? Math.round(ocrManual  / totalOcr * 100) : 0 },
      },
      terrain: {
        missionsActives,
        agentsActifs,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/rapports/ca ─────────────────────────────────────────────────
// Chiffre d'affaires par période, ventilé par jour (30 derniers jours).
// Paramètres : periode (mois | semaine | annee), granularite (jour | mois)
router.get('/ca', async (req: AuthRequest, res: Response) => {
  try {
    const { periode = 'mois' } = req.query

    const debut = debutPeriode(
      ['mois', 'semaine', 'annee'].includes(String(periode))
        ? (String(periode) as 'mois' | 'semaine' | 'annee')
        : 'mois'
    )

    // Récupérer tous les paiements confirmés sur la période
    const paiements = await prisma.paiement.findMany({
      where: {
        statut:    'CONFIRME',
        encaisseA: { gte: debut },
      },
      select: { montant: true, encaisseA: true, mode: true },
      orderBy: { encaisseA: 'asc' },
    })

    // Agréger par jour
    const parJour: Record<string, { montant: number; count: number }> = {}

    for (const p of paiements) {
      if (!p.encaisseA) continue
      const cle = p.encaisseA.toISOString().slice(0, 10) // YYYY-MM-DD
      if (!parJour[cle]) parJour[cle] = { montant: 0, count: 0 }
      parJour[cle].montant += p.montant
      parJour[cle].count   += 1
    }

    // Répartition par mode
    const parMode: Record<string, number> = {}
    for (const p of paiements) {
      parMode[p.mode] = (parMode[p.mode] ?? 0) + p.montant
    }

    const totalMontant = paiements.reduce((acc, p) => acc + p.montant, 0)

    res.json({
      periode,
      debut:       debut.toISOString(),
      totalMontant,
      nbPaiements: paiements.length,
      parJour:     Object.entries(parJour).map(([date, v]) => ({ date, ...v })),
      parMode:     Object.entries(parMode).map(([mode, montant]) => ({ mode, montant })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/rapports/ocr ────────────────────────────────────────────────
// Répartition des sources OCR sur une période.
router.get('/ocr', async (req: AuthRequest, res: Response) => {
  try {
    const { dateDebut, dateFin } = req.query

    const where: any = {}
    if (dateDebut || dateFin) {
      where.createdAt = {}
      if (dateDebut) where.createdAt.gte = new Date(String(dateDebut))
      if (dateFin)   where.createdAt.lte = new Date(String(dateFin))
    }

    const sources = await prisma.dossier.groupBy({
      by:    ['ocrSource'],
      where,
      _count: { _all: true },
    })

    const total = sources.reduce((acc, s) => acc + s._count._all, 0)

    res.json({
      total,
      sources: sources.map(s => ({
        source:    s.ocrSource,
        count:     s._count._all,
        pourcentage: total ? Math.round(s._count._all / total * 100) : 0,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/rapports/examens ────────────────────────────────────────────
// Top examens les plus demandés (par nombre de dossiers).
// Paramètre : limit (défaut 10)
router.get('/examens', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '10', dateDebut, dateFin } = req.query

    const where: any = {}
    if (dateDebut || dateFin) {
      where.dossier = { createdAt: {} }
      if (dateDebut) where.dossier.createdAt.gte = new Date(String(dateDebut))
      if (dateFin)   where.dossier.createdAt.lte = new Date(String(dateFin))
    }

    const topExamens = await prisma.examen.groupBy({
      by:      ['catalogueId'],
      where,
      _count:  { _all: true },
      _sum:    { tarif: true },
      orderBy: { _count: { catalogueId: 'desc' } },
      take:    Number(limit),
    })

    // Enrichir avec les infos catalogue
    const catalogueIds = topExamens.map(e => e.catalogueId)
    const catalogues = await prisma.examenCatalogue.findMany({
      where:  { id: { in: catalogueIds } },
      select: { id: true, code: true, nom: true, categorie: true, tarifMax: true },
    })

    const catalogueMap = Object.fromEntries(catalogues.map(c => [c.id, c]))

    res.json({
      data: topExamens.map(e => ({
        catalogueId: e.catalogueId,
        catalogue:   catalogueMap[e.catalogueId] ?? null,
        nbDossiers:  e._count._all,
        caTotal:     e._sum.tarif ?? 0,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/rapports/communes ───────────────────────────────────────────
// Répartition des patients et dossiers par commune.
router.get('/communes', async (req: AuthRequest, res: Response) => {
  try {
    const patientsParCommune = await prisma.patient.groupBy({
      by:      ['commune'],
      _count:  { _all: true },
      orderBy: { _count: { commune: 'desc' } },
    })

    // Pour les dossiers par commune, on passe par les patients
    const patientIds = await prisma.patient.findMany({
      select: { id: true, commune: true },
    })
    const communeParPatient = Object.fromEntries(patientIds.map(p => [p.id, p.commune]))

    const dossiersAvecPatient = await prisma.dossier.findMany({
      select: { patientId: true },
    })

    const dossiersParCommuneMap: Record<string, number> = {}
    for (const d of dossiersAvecPatient) {
      const commune = communeParPatient[d.patientId] ?? 'Inconnue'
      dossiersParCommuneMap[commune] = (dossiersParCommuneMap[commune] ?? 0) + 1
    }

    res.json({
      communes: patientsParCommune.map(p => ({
        commune:       p.commune,
        nbPatients:    p._count._all,
        nbDossiers:    dossiersParCommuneMap[p.commune] ?? 0,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/rapports/agents ─────────────────────────────────────────────
// Performance agents : revenus, nombre de missions, taux de completion.
// Paramètre : periode (mois | semaine | annee)
router.get('/agents', async (req: AuthRequest, res: Response) => {
  try {
    const { periode = 'mois' } = req.query

    const debut = debutPeriode(
      ['mois', 'semaine', 'annee'].includes(String(periode))
        ? (String(periode) as 'mois' | 'semaine' | 'annee')
        : 'mois'
    )

    const agents = await prisma.agent.findMany({
      where:   { statut: 'ACTIF' },
      include: {
        missions: {
          where: { date: { gte: debut } },
          select: { statut: true },
        },
        revenus: {
          where:  { date: { gte: debut } },
          select: { montant: true, type: true },
        },
        stocks: { select: { quantite: true, seuilAlerte: true } },
      },
      orderBy: { nom: 'asc' },
    })

    res.json({
      periode,
      debut: debut.toISOString(),
      agents: agents.map(a => {
        const revenuTotal    = a.revenus.reduce((acc, r) => acc + r.montant, 0)
        const nbMissions     = a.missions.length
        const nbTerminees    = a.missions.filter(m => m.statut === 'TERMINEE').length
        const stocksEnAlerte = a.stocks.filter(s => s.quantite <= s.seuilAlerte).length

        return {
          id:              a.id,
          nom:             a.nom,
          prenom:          a.prenom,
          telephone:       a.telephone,
          commune:         a.commune,
          tauxCommission:  a.tauxCommission,
          periode: {
            revenuTotal,
            nbMissions,
            nbTerminees,
            tauxCompletion: nbMissions ? Math.round(nbTerminees / nbMissions * 100) : 0,
          },
          stocksEnAlerte,
        }
      }),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
