import api from './api'
import type { Paiement, Paginated } from '../types'

interface PaiementStats {
  totalEncaisse: number
  nbPaiements:   number
  jour:          { montant: number; count: number }
  mois:          { montant: number; count: number }
  parMode:       { mode: string; montant: number; count: number }[]
  nbEnAttente:   number
}

export const paiementsService = {
  stats: (params?: Record<string, string>) =>
    api.get<PaiementStats>('/paiements/stats', { params }).then(r => r.data),

  list: (params?: Record<string, string | number>) =>
    api.get<Paginated<Paiement>>('/paiements', { params }).then(r => r.data),

  get: (id: string) =>
    api.get<Paiement>(`/paiements/${id}`).then(r => r.data),

  create: (data: { dossierId: string; montant: number; mode: string; reference?: string; statut?: string }) =>
    api.post<Paiement>('/paiements', data).then(r => r.data),

  confirmer: (id: string) =>
    api.patch<Paiement>(`/paiements/${id}/confirmer`).then(r => r.data),

  echec: (id: string) =>
    api.patch<Paiement>(`/paiements/${id}/echec`).then(r => r.data),
}
