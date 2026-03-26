import api from './api'
import type { Patient, Paginated } from '../types'

export const patientsService = {
  list: (params?: Record<string, string | number>) =>
    api.get<Paginated<Patient>>('/patients', { params }).then(r => r.data),

  get: (id: string) =>
    api.get<Patient>(`/patients/${id}`).then(r => r.data),

  create: (data: Partial<Patient>) =>
    api.post<Patient>('/patients', data).then(r => r.data),

  update: (id: string, data: Partial<Patient>) =>
    api.patch<Patient>(`/patients/${id}`, data).then(r => r.data),
}
