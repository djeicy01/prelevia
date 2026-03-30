import api from './api'
import type { Dossier, Paginated, AssuranceStatut } from '../types'

export const dossiersService = {
  list: (params?: Record<string, string | number>) =>
    api.get<Paginated<Dossier>>('/dossiers', { params }).then(r => r.data),

  get: (id: string) =>
    api.get<Dossier>(`/dossiers/${id}`).then(r => r.data),

  create: (data: Partial<Dossier>) =>
    api.post<Dossier>('/dossiers', data).then(r => r.data),

  update: (id: string, data: Partial<Dossier>) =>
    api.patch<Dossier>(`/dossiers/${id}`, data).then(r => r.data),

  updateAssurance: (id: string, statut: AssuranceStatut, examens?: Record<string, boolean>) =>
    api.patch<Dossier>(`/dossiers/${id}/assurance`, { statut, examens }).then(r => r.data),

  addExamen: (id: string, data: { catalogueId: string; tarif: number }) =>
    api.post(`/dossiers/${id}/examens`, data).then(r => r.data),

  removeExamen: (id: string, examenId: string) =>
    api.delete(`/dossiers/${id}/examens/${examenId}`).then(r => r.data),
}
