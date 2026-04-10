import api from './api'

export interface UserRecord {
  id:        string
  email:     string
  nom:       string
  prenom:    string
  role:      string
  actif:     boolean
  createdAt: string
}

export const usersService = {
  getAll: (): Promise<{ data: UserRecord[]; total: number }> =>
    api.get('/users').then(r => r.data),

  create: (data: { nom: string; prenom: string; email: string; password: string; role: string }): Promise<UserRecord> =>
    api.post('/users', data).then(r => r.data),

  update: (id: string, data: { role?: string; password?: string; actif?: boolean; nom?: string; prenom?: string }): Promise<UserRecord> =>
    api.patch(`/users/${id}`, data).then(r => r.data),

  disable: (id: string): Promise<{ message: string }> =>
    api.delete(`/users/${id}`).then(r => r.data),
}
