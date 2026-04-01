import api from './api'
import type { DashboardData } from '../types'

export const rapportsService = {
  dashboard: () =>
    api.get<DashboardData>('/rapports/dashboard').then(r => r.data),

  ca: (params: { periode?: string; dateDebut?: string; dateFin?: string }) =>
    api.get('/rapports/ca', { params }).then(r => r.data),

  ocr: (params?: Record<string, string>) =>
    api.get('/rapports/ocr', { params }).then(r => r.data),

  examens: (params?: { limit?: number; dateDebut?: string; dateFin?: string }) =>
    api.get('/rapports/examens', { params }).then(r => r.data),

  communes: () =>
    api.get('/rapports/communes').then(r => r.data),

  agents: (params: { periode?: string; dateDebut?: string; dateFin?: string }) =>
    api.get('/rapports/agents', { params }).then(r => r.data),
}
