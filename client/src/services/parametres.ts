import api from './api'

// ── Paramètres système ──────────────────────────────────────
export const getParametres     = ()                    => api.get('/parametres').then(r => r.data)
export const updateParametre   = (cle: string, v: string) =>
  api.patch(`/parametres/${cle}`, { valeur: v }).then(r => r.data)
export const recalculerTarifs  = ()                    => api.post('/parametres/recalculer-tarifs').then(r => r.data)

// ── Laboratoire ─────────────────────────────────────────────
export const getLaboratoire    = ()        => api.get('/parametres/laboratoire').then(r => r.data)
export const updateLaboratoire = (d: any)  => api.patch('/parametres/laboratoire', d).then(r => r.data)

// ── Templates SMS ───────────────────────────────────────────
export const getTemplatesSMS   = ()                       => api.get('/parametres/templates-sms').then(r => r.data)
export const updateTemplateSMS = (code: string, d: any)   =>
  api.patch(`/parametres/templates-sms/${code}`, d).then(r => r.data)

// ── Zones ───────────────────────────────────────────────────
export const getZones          = () => api.get('/parametres/zones').then(r => r.data)

// ── Catalogue examens ───────────────────────────────────────
export const getCatalogue      = (p?: any)              => api.get('/catalogue', { params: p }).then(r => r.data)
export const createExamen      = (d: any)               => api.post('/catalogue', d).then(r => r.data)
export const updateExamen      = (id: string, d: any)   => api.patch(`/catalogue/${id}`, d).then(r => r.data)

// ── Panels ──────────────────────────────────────────────────
export const getPanels         = ()                       => api.get('/panels').then(r => r.data)
export const createPanel       = (d: any)                 => api.post('/panels', d).then(r => r.data)
export const updatePanel       = (id: string, d: any)     => api.patch(`/panels/${id}`, d).then(r => r.data)
export const updatePanelExamens= (id: string, ids: string[]) =>
  api.put(`/panels/${id}/examens`, { catalogueIds: ids }).then(r => r.data)
