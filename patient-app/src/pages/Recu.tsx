import { useNavigate, useLocation } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { CheckCircle, Home, ArrowRight } from 'lucide-react'

const LABELS: Record<string, string> = {
  CASH: 'Espèces', ORANGE_MONEY: 'Orange Money', MTN_MONEY: 'MTN Money', WAVE: 'Wave',
}

export default function Recu() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as {
    mode?: string; montant?: number; ref?: string; dossierId?: string
  }

  return (
    <AppLayout noNav>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8 text-center">
        {/* Success icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#2CB67D]/15 flex items-center justify-center pulse-ring" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle size={52} className="text-[#2CB67D]" strokeWidth={1.5} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[#1A2B26]">Paiement confirmé !</h1>
          <p className="text-[#5C7A74] text-[15px] mt-2">
            Votre règlement a bien été enregistré.
          </p>
        </div>

        {/* Détails */}
        <div className="w-full bg-white rounded-2xl border border-[#D4E5E1] shadow-sm overflow-hidden">
          {[
            { label: 'Montant', value: `${(state.montant ?? 0).toLocaleString()} XOF` },
            { label: 'Mode', value: LABELS[state.mode ?? ''] ?? state.mode ?? '—' },
            { label: 'Référence', value: state.ref ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between px-5 py-3.5 border-b border-[#D4E5E1] last:border-0">
              <span className="text-sm text-[#5C7A74]">{label}</span>
              <span className="text-sm font-bold text-[#1A2B26]">{value}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#5C7A74]">
          Un SMS de confirmation vous sera envoyé sous peu.
        </p>

        <div className="w-full space-y-3">
          {state.dossierId && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate(`/suivi/${state.dossierId}`)}
            >
              Suivre mon dossier
              <ArrowRight size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => navigate('/home', { replace: true })}
          >
            <Home size={16} />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
