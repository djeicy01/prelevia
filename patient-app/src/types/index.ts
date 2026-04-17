export interface Patient {
  id: string
  ref: string
  nom: string
  prenom: string
  telephone: string
  commune: string
  email?: string
  assuranceId?: string
  assurance?: Assurance
  numCarte?: string
}

export interface Assurance {
  id: string
  nom: string
  type: string
  tauxCouverture: number
  delaiValidation: string
  contactEmail?: string
  contactTel?: string
}

export type OcrSource = 'AUTO' | 'PATIENT' | 'AGENT' | 'MANUAL'

export type DossierStatut =
  | 'EN_ATTENTE'
  | 'PRET_PRELEVEMENT'
  | 'PRELEVEMENT_FAIT'
  | 'PAYE'
  | 'RESULTATS_EN_COURS'
  | 'RESULTATS_DISPONIBLES'
  | 'ARCHIVE'
  | 'ANNULE'

export type AssuranceStatut =
  | 'DOCS_COLLECTES'
  | 'SOUMIS_LABO'
  | 'EN_VALIDATION'
  | 'VALIDE_TOTAL'
  | 'VALIDE_PARTIEL'
  | 'REFUSE'

export interface ExamenCatalogue {
  id: string
  code: string
  nom: string
  categorie: string
  valeurB: number
  tarifMin: number
  tarifMax: number
  typesTube: string
  description?: string
  actif: boolean
}

export interface ExamenDossier {
  id: string
  catalogueId: string
  catalogue: ExamenCatalogue
  tarif: number
  couvert?: boolean | null
  quotePart?: number | null
}

export interface Panel {
  id: string
  code: string
  nom: string
  categorie?: string
  actif: boolean
  examens: { catalogue: ExamenCatalogue; ordre: number }[]
}

export interface Dossier {
  id: string
  ref: string
  patientId: string
  statut: DossierStatut
  statutAssurance?: AssuranceStatut
  ocrSource: OcrSource
  bulletinUrl?: string
  noteAdmin?: string
  examens: ExamenDossier[]
  createdAt: string
  updatedAt: string
  missionId?: string
  mission?: Mission
}

export interface MissionStatut {
  statut: 'PLANIFIEE' | 'EN_ROUTE' | 'ARRIVEE' | 'PRELEVEMENT_FAIT' | 'TERMINEE'
  latitude?: number
  longitude?: number
  agent?: { nom: string; prenom: string; telephone: string }
  date: string
}

export interface Mission {
  id: string
  ref: string
  date: string
  statut: string
  agent?: { nom: string; prenom: string; telephone: string }
  latitude?: number
  longitude?: number
}

export interface ResultatExamen {
  id: string
  examenId: string
  valeur: string
  unite: string
  referenceMin?: number
  referenceMax?: number
  critique: boolean
  catalogue: { nom: string; code: string }
}

export interface ResultatDossier {
  id: string
  dossierId: string
  dossier: { ref: string; createdAt: string }
  resultats: ResultatExamen[]
  renduLe: string
}

export type ModePaiement = 'CASH' | 'ORANGE_MONEY' | 'MTN_MONEY' | 'WAVE' | 'VIREMENT'

export interface Paiement {
  id: string
  montant: number
  mode: ModePaiement
  statut: string
  reference?: string
  encaisseA?: string
  createdAt: string
}
