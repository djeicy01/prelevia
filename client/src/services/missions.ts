import api from './api'
import type { Mission, MissionStatut, Paginated } from '../types'

export const missionsService = {
  list: (params?: Record<string, string | number>) =>
    api.get<Paginated<Mission>>('/missions', { params }).then(r => r.data),

  get: (id: string) =>
    api.get<Mission>(`/missions/${id}`).then(r => r.data),

  create: (data: { agentId: string; date: string; dossierIds?: string[] }) =>
    api.post<Mission>('/missions', data).then(r => r.data),

  addDossiers: (id: string, dossierIds: string[]) =>
    api.post<Mission>(`/missions/${id}/dossiers`, { dossierIds }).then(r => r.data),

  updateStatut: (id: string, statut: MissionStatut) =>
    api.patch<Mission>(`/missions/${id}/statut`, { statut }).then(r => r.data),

  updatePosition: (id: string, latitude: number, longitude: number) =>
    api.patch(`/missions/${id}/position`, { latitude, longitude }).then(r => r.data),

  encaissement: (id: string, data: { dossierId: string; montant: number; mode: string; reference?: string }) =>
    api.post(`/missions/${id}/encaissement`, data).then(r => r.data),
}
