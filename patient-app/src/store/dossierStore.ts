import { create } from 'zustand'
import type { ExamenCatalogue } from '../types'

export type ParcourType = 'A' | 'B' | 'C' | 'D'

interface DossierDraft {
  parcours: ParcourType | null
  ocrSource: 'AUTO' | 'PATIENT' | 'MANUAL'
  bulletinUrl: string | null
  bulletinFile: File | null
  examensSelectionnes: ExamenCatalogue[]
  assuranceId: string | null
  assuranceNonPartenaireNom: string | null
  campagneCode: string | null
  campagneData: { nom: string; organisationId?: string } | null
  commune: string
  adresse: string
  creneauDate: string | null
  creneauHeure: string | null
}

interface DossierState extends DossierDraft {
  setParcours: (p: ParcourType) => void
  setBulletin: (url: string, file: File) => void
  setExamens: (examens: ExamenCatalogue[]) => void
  setAssurance: (id: string | null, nomNonPartenaire?: string) => void
  setCampagne: (code: string, data: { nom: string }) => void
  setCreneau: (date: string, heure: string) => void
  setAdresse: (commune: string, adresse: string) => void
  reset: () => void
}

const INITIAL: DossierDraft = {
  parcours: null,
  ocrSource: 'MANUAL',
  bulletinUrl: null,
  bulletinFile: null,
  examensSelectionnes: [],
  assuranceId: null,
  assuranceNonPartenaireNom: null,
  campagneCode: null,
  campagneData: null,
  commune: '',
  adresse: '',
  creneauDate: null,
  creneauHeure: null,
}

export const useDossierStore = create<DossierState>()((set) => ({
  ...INITIAL,

  setParcours: (p) => set({ parcours: p }),

  setBulletin: (url, file) => set({
    bulletinUrl: url,
    bulletinFile: file,
    ocrSource: 'AUTO',
  }),

  setExamens: (examens) => set({ examensSelectionnes: examens }),

  setAssurance: (id, nomNonPartenaire) => set({
    assuranceId: id,
    assuranceNonPartenaireNom: nomNonPartenaire ?? null,
  }),

  setCampagne: (code, data) => set({ campagneCode: code, campagneData: data }),

  setCreneau: (date, heure) => set({ creneauDate: date, creneauHeure: heure }),

  setAdresse: (commune, adresse) => set({ commune, adresse }),

  reset: () => set(INITIAL),
}))
