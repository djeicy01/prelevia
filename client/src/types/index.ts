// ── Enums ──────────────────────────────────────────────────────────────────

export type Role            = 'SUPER_ADMIN' | 'ADMIN' | 'COORDINATEUR'
export type AgentStatut     = 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'EN_FORMATION'
export type DossierStatut   = 'EN_ATTENTE' | 'PRET_PRELEVEMENT' | 'PRELEVEMENT_FAIT' | 'PAYE' | 'RESULTATS_EN_COURS' | 'RESULTATS_DISPONIBLES' | 'ARCHIVE' | 'ANNULE'
export type OcrSource       = 'AUTO' | 'PATIENT' | 'AGENT' | 'MANUAL'
export type AssuranceStatut = 'DOCS_COLLECTES' | 'SOUMIS_LABO' | 'EN_VALIDATION' | 'VALIDE_TOTAL' | 'VALIDE_PARTIEL' | 'REFUSE'
export type MissionStatut   = 'PLANIFIEE' | 'EN_ROUTE' | 'ARRIVEE' | 'PRELEVEMENT_FAIT' | 'TERMINEE'
export type ModePaiement    = 'CASH' | 'ORANGE_MONEY' | 'MTN_MONEY' | 'WAVE' | 'VIREMENT'
export type PaiementStatut  = 'EN_ATTENTE' | 'CONFIRME' | 'ECHEC'
export type TypeRevenu      = 'FIXE_MENSUEL' | 'PRIME_PRELEVEMENT' | 'COMMISSION_ENCAISSEMENT' | 'PRIME_QUALITE'

// ── Modèles ────────────────────────────────────────────────────────────────

export interface Assurance {
  id:              string
  nom:             string
  type:            string
  tauxCouverture:  number
  delaiValidation: string
  contactEmail?:   string
  contactTel?:     string
}

export interface Patient {
  id:          string
  ref:         string
  nom:         string
  prenom:      string
  telephone:   string
  commune:     string
  adresse?:    string
  assuranceId?: string
  assurance?:  Assurance
  numCarte?:   string
  createdAt:   string
  updatedAt:   string
}

export interface ExamenCatalogue {
  id:        string
  code:      string
  nom:       string
  categorie: string
  valeurB:   number
  tarifMin:  number
  tarifMax:  number
  typesTube: string
  actif:     boolean
}

export interface Examen {
  id:          string
  dossierId:   string
  catalogueId: string
  catalogue?:  ExamenCatalogue
  tarif:       number
  couvert?:    boolean | null
  quotePart?:  number | null
}

export interface Finances {
  totalFacture:   number
  partAssurance:  number
  partPatient:    number
}

export interface Dossier {
  id:                string
  ref:               string
  patientId:         string
  patient?:          Patient
  statut:            DossierStatut
  statutAssurance?:  AssuranceStatut | null
  ocrSource:         OcrSource
  bulletinUrl?:      string | null
  carteAssuranceUrl?: string | null
  cniUrl?:           string | null
  noteAdmin?:        string | null
  examens?:          Examen[]
  paiements?:        Paiement[]
  missionId?:        string | null
  mission?:          Mission | null
  finances?:         Finances
  createdAt:         string
  updatedAt:         string
}

export interface StockAgent {
  id:          string
  agentId:     string
  materiau:    string
  quantite:    number
  seuilAlerte: number
  updatedAt:   string
}

export interface Revenu {
  id:        string
  agentId:   string
  missionId?: string | null
  mission?:  { ref: string; date: string; statut: MissionStatut } | null
  montant:   number
  type:      TypeRevenu
  date:      string
}

export interface Agent {
  id:             string
  nom:            string
  prenom:         string
  telephone:      string
  email?:         string | null
  commune:        string
  statut:         AgentStatut
  tauxCommission: number
  stocks?:        StockAgent[]
  missions?:      Mission[]
  revenus?:       Revenu[]
  revenuJour?:    number
  nbPrelevJour?:  number
  stocksEnAlerte?: number
  stats?: {
    revenuTotal:       number
    revenuMoisEnCours: number
    nbMissions:        number
    stocksEnAlerte:    number
  }
  createdAt:      string
  updatedAt:      string
}

export interface Paiement {
  id:        string
  dossierId: string
  dossier?:  Dossier
  montant:   number
  mode:      ModePaiement
  statut:    PaiementStatut
  reference?: string | null
  encaisseA?: string | null
  finances?:  Finances
  createdAt: string
}

export interface Mission {
  id:        string
  ref:       string
  agentId:   string
  agent?:    Agent
  dossiers?: Dossier[]
  revenus?:  Revenu[]
  date:      string
  statut:    MissionStatut
  latitude?:  number | null
  longitude?: number | null
  finances?: {
    totalFacture:   number
    totalPatient:   number
    totalAssurance: number
    totalEncaisse?: number
  }
  transitionsAutorisees?: MissionStatut[]
  createdAt: string
  updatedAt: string
}

// ── Réponses API paginées ──────────────────────────────────────────────────

export interface Paginated<T> {
  data:  T[]
  total: number
  page:  number
  pages: number
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardData {
  patients: { total: number; aujourdhui: number }
  dossiers: {
    total:             number
    parStatut:         Record<DossierStatut, number>
    assurancesEnCours: number
  }
  revenus: {
    jour:  { montant: number; count: number }
    mois:  { montant: number; count: number }
    annee: { montant: number; count: number }
  }
  ocr: {
    total:   number
    auto:    { count: number; pct: number }
    patient: { count: number; pct: number }
    agent:   { count: number; pct: number }
    manual:  { count: number; pct: number }
  }
  terrain: { missionsActives: number; agentsActifs: number }
}
