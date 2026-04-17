import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from '../components/ui/Toast'
import { authApi } from '../services/api'
import { Phone, ChevronLeft } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as { telephone?: string })?.telephone ?? ''

  const [telephone, setTelephone] = useState(prefill)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleSend = async () => {
    if (!telephone.trim()) { setError('Numéro requis'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.sendOtp(telephone)
      toast('Code envoyé par SMS !', 'success')
      navigate('/otp', { state: { telephone, devOtp: res?.otp ?? null } })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur'
      toast(msg, 'error')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-[#064D40] px-4 pt-14 pb-10 safe-top text-white">
        <button onClick={() => navigate('/onboarding')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 mb-4">
          <ChevronLeft size={22} />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
          <Phone size={26} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold">Connexion</h1>
        <p className="text-white/70 text-sm mt-1">Entrez votre numéro pour recevoir un code SMS</p>
      </div>

      <div className="flex-1 px-5 pt-8 space-y-5">
        <div className="bg-white rounded-2xl p-5 border border-[#D4E5E1] shadow-sm">
          <Input
            label="Numéro de téléphone"
            type="tel"
            placeholder="+225 07 12 34 56"
            value={telephone}
            onChange={e => { setTelephone(e.target.value); setError('') }}
            error={error}
            left={<Phone size={16} />}
            autoFocus
          />
          <p className="text-xs text-[#5C7A74] mt-2">
            Vous recevrez un code à 6 chiffres par SMS via <strong>Twilio</strong>.
          </p>
        </div>

        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleSend}>
          Recevoir le code SMS
        </Button>

        <p className="text-center text-sm text-[#5C7A74]">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-[#064D40] font-semibold">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
