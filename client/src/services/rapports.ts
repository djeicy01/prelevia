import api from './api'
import type { DashboardData } from '../types'

export const rapportsService = {
  dashboard: () =>
    api.get<DashboardData>('/rapports/dashboard').then(r => r.data),

  ca: (periode?: 'mois' | 'semaine' | 'annee') =>
    api.get('/rapports/ca', { params: { periode } }).then(r => r.data),

  ocr: (params?: Record<string, string>) =>
    api.get('/rapports/ocr', { params }).then(r => r.data),

  examens: (params?: { limit?: number; dateDebut?: string; dateFin?: string }) =>
    api.get('/rapports/examens', { params }).then(r => r.data),

  communes: () =>
    api.get('/rapports/communes').then(r => r.data),

  agents: (periode?: 'mois' | 'semaine' | 'annee') =>
    api.get('/rapports/agents', { params: { periode } }).then(r => r.data),
}
