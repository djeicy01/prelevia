import axios from 'axios'

const BASE = '/api'

const api = axios.create({ baseURL: BASE })

// Inject patient JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('patient_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Auth Patient ──────────────────────────────────────────────
export const authApi = {
  register: (data: { nom: string; prenom: string; telephone: string; commune: string }) =>
    api.post('/patient/register', data).then(r => r.data),

  sendOtp: (telephone: string) =>
    api.post('/patient/otp/send', { telephone }).then(r => r.data),

  verifyOtp: (telephone: string, otp: string) =>
    api.post('/patient/otp/verify', { telephone, otp }).then(r => r.data),

  getMe: () =>
    api.get('/patient/me').then(r => r.data),

  updateMe: (data: { email?: string; assuranceId?: string; numCarte?: string; commune?: string }) =>
    api.patch('/patient/me', data).then(r => r.data),
}

// ─── Dossiers ──────────────────────────────────────────────────
export const dossiersApi = {
  getMesDossiers: () =>
    api.get('/patient/dossiers').then(r => r.data),

  getDossier: (id: string) =>
    api.get(`/patient/dossiers/${id}`).then(r => r.data),

  createDossier: (data: {
    examens: string[]       // catalogueIds
    ocrSource: string
    bulletinUrl?: string
    assuranceId?: string
    assuranceNonPartenaireNom?: string
    campagneCode?: string
    commune?: string
    adresse?: string
    creneauDate?: string
    creneauHeure?: string
  }) => api.post('/patient/dossiers', data).then(r => r.data),

  annulerDossier: (id: string) =>
    api.patch(`/patient/dossiers/${id}/annuler`).then(r => r.data),
}

// ─── OCR ───────────────────────────────────────────────────────
export const ocrApi = {
  analyserBulletin: (file: File) => {
    const form = new FormData()
    form.append('bulletin', file)
    return api.post('/patient/ocr', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}

// ─── Catalogue ─────────────────────────────────────────────────
export const catalogueApi = {
  getAll: () =>
    api.get('/catalogue').then(r => r.data),

  getPanels: () =>
    api.get('/panels').then(r => r.data),
}

// ─── Assurances ────────────────────────────────────────────────
export const assurancesApi = {
  getAll: () =>
    api.get('/assurances').then(r => r.data),
}

// ─── Paiements ─────────────────────────────────────────────────
export const paiementsApi = {
  initierPaiement: (dossierId: string, mode: string) =>
    api.post('/patient/paiements', { dossierId, mode }).then(r => r.data),

  confirmerPaiement: (paiementId: string, reference?: string) =>
    api.patch(`/patient/paiements/${paiementId}/confirmer`, { reference }).then(r => r.data),
}

// ─── Résultats ─────────────────────────────────────────────────
export const resultatsApi = {
  getMesResultats: () =>
    api.get('/patient/resultats').then(r => r.data),

  getResultat: (dossierId: string) =>
    api.get(`/patient/resultats/${dossierId}`).then(r => r.data),
}

// ─── Campagnes ─────────────────────────────────────────────────
export const campagnesApi = {
  validerCode: (code: string) =>
    api.post('/campagnes/valider', { code }).then(r => r.data),
}

export default api
