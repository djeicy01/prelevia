import { create } from 'zustand'

interface LaboUser {
  id:     string
  email:  string
  nom:    string
  prenom: string
  role:   string
}

interface LaboState {
  token: string | null
  user:  LaboUser | null
  login: (token: string, user: LaboUser) => void
  logout: () => void
}

export const useLaboStore = create<LaboState>((set) => ({
  token: localStorage.getItem('labo_token'),
  user: (() => {
    try { return JSON.parse(localStorage.getItem('labo_user') || 'null') } catch { return null }
  })(),

  login: (token, user) => {
    localStorage.setItem('labo_token', token)
    localStorage.setItem('labo_user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('labo_token')
    localStorage.removeItem('labo_user')
    set({ token: null, user: null })
  },
}))
