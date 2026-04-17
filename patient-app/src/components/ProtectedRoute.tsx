import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuth = useAuthStore(s => s.isAuthenticated)
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />
}
