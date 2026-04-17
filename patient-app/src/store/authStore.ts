import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Patient } from '../types'

interface AuthState {
  token: string | null
  patient: Patient | null
  isAuthenticated: boolean
  setAuth: (token: string, patient: Patient) => void
  updatePatient: (patient: Partial<Patient>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      patient: null,
      isAuthenticated: false,

      setAuth: (token, patient) => {
        localStorage.setItem('patient_token', token)
        set({ token, patient, isAuthenticated: true })
      },

      updatePatient: (updates) => {
        const current = get().patient
        if (current) set({ patient: { ...current, ...updates } })
      },

      logout: () => {
        localStorage.removeItem('patient_token')
        set({ token: null, patient: null, isAuthenticated: false })
      },
    }),
    {
      name: 'prelevia-patient-auth',
      partialize: (s) => ({ token: s.token, patient: s.patient, isAuthenticated: s.isAuthenticated }),
    }
  )
)
