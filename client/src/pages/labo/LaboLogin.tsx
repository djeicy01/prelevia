import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLaboStore } from '../../store/laboStore'

const P  = '#0A6E5C'
const BD = '#D4E5E1'
const TX = '#1A2B26'
const TL = '#5C7A74'

export default function LaboLogin() {
  const navigate = useNavigate()
  const login    = useLaboStore(s => s.login)

  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Email et mot de passe requis'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post('/api/auth/login', { email, password })
      const { token, user } = res.data

      if (user.role !== 'LABO') {
        setError('Accès réservé aux comptes laboratoire. Utilisez le back-office pour les autres rôles.')
        return
      }

      login(token, user)
      navigate('/labo/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F7F6' }}>
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: P }}>
            <span className="text-white text-2xl font-extrabold">P</span>
          </div>
          <h1 className="text-xl font-extrabold" style={{ color: TX }}>Portail Laboratoire</h1>
          <p className="text-sm mt-1" style={{ color: TL }}>Saisie des résultats d'examens</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
          style={{ border: `1px solid ${BD}` }}>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="labo@prelevia.ci"
              autoComplete="username"
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
              style={{ borderColor: BD, color: TX }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
              style={{ borderColor: BD, color: TX }}
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-center" style={{ color: '#E05C5C' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
            style={{ background: P }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs mt-4" style={{ color: TL }}>
          Accès réservé au personnel du laboratoire
        </p>
      </div>
    </div>
  )
}
