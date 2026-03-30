import api from './api'
import type { Agent, Paginated, Revenu, StockAgent } from '../types'

export const agentsService = {
  list: (params?: Record<string, string | number>) =>
    api.get<Paginated<Agent>>('/agents', { params }).then(r => r.data),

  get: (id: string) =>
    api.get<Agent>(`/agents/${id}`).then(r => r.data),

  create: (data: Partial<Agent>) =>
    api.post<Agent>('/agents', data).then(r => r.data),

  update: (id: string, data: Partial<Agent>) =>
    api.patch<Agent>(`/agents/${id}`, data).then(r => r.data),

  getStock: (id: string) =>
    api.get<{ agentId: string; stocks: StockAgent[]; alertes: StockAgent[] }>(`/agents/${id}/stock`).then(r => r.data),

  updateStock: (id: string, items: { materiau: string; quantite: number; seuilAlerte?: number }[]) =>
    api.patch(`/agents/${id}/stock`, { items }).then(r => r.data),

  getRevenus: (id: string, params?: Record<string, string | number>) =>
    api.get<{ data: Revenu[]; total: number; totalMontant: number }>(`/agents/${id}/revenus`, { params }).then(r => r.data),
}
