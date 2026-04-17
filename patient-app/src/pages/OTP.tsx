import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { ChevronLeft, MessageSquare, RotateCcw } from 'lucide-react'

export default function OTP() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const telephone = (location.state as { telephone?: string; devOtp?: string })?.telephone ?? ''
  const devOtp    = (location.state as { devOtp?: string })?.devOtp ?? null
  const setAuth   = useAuthStore(s => s.setAuth)

  const [digits, setDigits]     = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading]   = useState(false)
  const [resending, setResend]  = useState(false)
  const [countdown, setCount]   = useState(60)
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null))

  useEffect(() => {
    if (!telephone) { navigate('/login'); return }
    refs[0].current?.focus()
    const id = setInterval(() => setCount(c => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [])

  const handleInput = (i: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[i] = v
    setDigits(next)
    if (v && i < 5) refs[i + 1].current?.focus()
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(''))
      refs[5].current?.focus()
    }
  }

  const verify = async () => {
    const otp = digits.join('')
    if (otp.length < 6) { toast('Entrez les 6 chiffres', 'error'); return }
    setLoading(true)
    try {
      const { token, patient } = await authApi.verifyOtp(telephone, otp)
      setAuth(token, patient)
      toast('Connexion réussie !', 'success')
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Code incorrect'
      toast(msg, 'error')
      setDigits(Array(6).fill(''))
      refs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (countdown > 0) return
    setResend(true)
    try {
      await authApi.sendOtp(telephone)
      setCount(60)
      toast('Nouveau code envoyé !', 'success')
    } catch {
      toast('Erreur lors du renvoi', 'error')
    } finally {
      setResend(false)
    }
  }

  const maskTel = telephone.replace(/(\+?\d{3})(\d+)(\d{2})/, '$1 ******* $3')

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
      <div className="bg-[#064D40] px-4 pt-14 pb-10 safe-top text-white">
        <button onClick={() => navigate('/login')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 mb-4">
          <ChevronLeft size={22} />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
          <MessageSquare size={26} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold">Vérification SMS</h1>
        <p className="text-white/70 text-sm mt-1">Code envoyé au <strong className="text-white">{maskTel}</strong></p>
      </div>

      <div className="flex-1 px-5 pt-10 flex flex-col items-center gap-8">
        {/* Hint dev — OTP visible seulement hors production */}
        {devOtp && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-amber-700 font-medium">Mode dev — Code OTP :</p>
            <p className="text-2xl font-extrabold tracking-widest text-amber-800 mt-1">{devOtp}</p>
          </div>
        )}
        {/* OTP inputs */}
        <div className="flex gap-3" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className={`
                w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-colors
                ${d ? 'border-[#064D40] text-[#064D40]' : 'border-[#D4E5E1] text-[#1A2B26]'}
                focus:border-[#064D40] focus:ring-2 focus:ring-[#064D40]/20
              `}
            />
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={digits.join('').length < 6}
          onClick={verify}
        >
          Vérifier le code
        </Button>

        {/* Resend */}
        <button
          onClick={resend}
          disabled={countdown > 0 || resending}
          className="flex items-center gap-2 text-sm font-semibold text-[#5C7A74] disabled:opacity-50"
        >
          <RotateCcw size={14} />
          {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
        </button>
      </div>
    </div>
  )
}
