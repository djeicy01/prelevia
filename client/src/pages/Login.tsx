import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate  = useNavigate()
  const login     = useAuthStore(s => s.login)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login(data.token, data.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F7F6' }}>
      <div className="bg-white rounded-2xl border p-10 w-full max-w-sm shadow-sm" style={{ borderColor: '#D4E5E1' }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#064D40', fontFamily: 'Lora, serif' }}>
            Prelevia
          </h1>
          <p className="text-sm mt-1" style={{ color: '#5C7A74' }}>Back-office — Connexion</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#1A2B26' }}>
              Adresse e-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@prelevia.ci"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ borderColor: '#D4E5E1', color: '#1A2B26' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#1A2B26' }}>
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ borderColor: '#D4E5E1', color: '#1A2B26' }}
            />
          </div>

          {error && (
            <p className="text-xs text-center" style={{ color: '#E05C5C' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: '#0A6E5C' }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: '#5C7A74' }}>
          Labo Maison Blanche · Yopougon, Abidjan
        </p>

        <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: '#D4E5E1' }}>
          <p className="text-xs mb-2" style={{ color: '#5C7A74' }}>Vous êtes un laboratoire partenaire ?</p>
          <a
            href="/labo/login"
            className="text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: '#0A6E5C' }}
          >
            → Accéder au portail laboratoire
          </a>
        </div>
      </div>
    </div>
  )
}
