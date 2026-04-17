import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import { paiementsApi } from '../services/api'
import type { ModePaiement } from '../types'
import { Banknote, Smartphone, ChevronRight, Info } from 'lucide-react'

const MODES: { id: ModePaiement; label: string; logo: string; color: string }[] = [
  { id: 'CASH',         label: 'Espèces',      logo: '💵', color: 'bg-gray-50 border-gray-200' },
  { id: 'ORANGE_MONEY', label: 'Orange Money', logo: '🟠', color: 'bg-orange-50 border-orange-200' },
  { id: 'MTN_MONEY',    label: 'MTN Money',    logo: '🟡', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'WAVE',         label: 'Wave',         logo: '🔵', color: 'bg-blue-50 border-blue-100' },
]

export default function Paiement() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const state     = (location.state ?? {}) as { dossierId?: string; montant?: number; ref?: string }

  const [mode, setMode]       = useState<ModePaiement | null>(null)
  const [loading, setLoading] = useState(false)

  const montant = state.montant ?? 0

  const handlePay = async () => {
    if (!mode) { toast('Choisissez un mode de paiement', 'error'); return }
    if (!state.dossierId) { toast('Dossier introuvable', 'error'); return }
    setLoading(true)
    try {
      const paiement = await paiementsApi.initierPaiement(state.dossierId, mode)
      await paiementsApi.confirmerPaiement(paiement.id)
      navigate('/recu', {
        replace: true,
        state: { mode, montant, ref: paiement.reference ?? state.ref, dossierId: state.dossierId },
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur paiement'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout noNav>
      <PageHeader title="Paiement" subtitle="Régler votre part" back={-1 as unknown as string} />

      <div className="px-5 py-5 space-y-5">
        {/* Montant */}
        <div className="bg-[#064D40] rounded-2xl p-5 text-white text-center">
          <p className="text-white/70 text-sm mb-1">Montant à régler</p>
          <p className="text-4xl font-extrabold">{montant.toLocaleString()}</p>
          <p className="text-white/70 text-lg font-semibold mt-0.5">XOF</p>
        </div>

        {/* Modes */}
        <div>
          <p className="text-sm font-bold text-[#1A2B26] mb-3">Mode de paiement</p>
          <div className="space-y-2">
            {MODES.map(({ id, label, logo, color }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`
                  w-full rounded-2xl p-4 border-2 flex items-center gap-4 text-left transition-all
                  ${mode === id ? 'border-[#064D40] bg-[#064D40]/5' : `${color} border-transparent hover:border-[#064D40]/30`}
                `}
              >
                <span className="text-3xl">{logo}</span>
                <span className="font-bold text-[#1A2B26] text-[15px] flex-1">{label}</span>
                {mode === id && (
                  <span className="w-6 h-6 rounded-full bg-[#064D40] flex items-center justify-center">
                    <ChevronRight size={14} className="text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Info Mobile Money */}
        {mode && mode !== 'CASH' && (
          <div className="bg-[#3B82F6]/8 rounded-xl p-4 flex gap-2">
            <Info size={16} className="text-[#3B82F6] shrink-0 mt-0.5" />
            <p className="text-xs text-[#3B82F6]">
              L'agent vous guidera pour valider le paiement Mobile Money sur place lors de la visite.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 pb-8">
        <Button variant="accent" size="lg" fullWidth loading={loading} disabled={!mode} onClick={handlePay}>
          Confirmer le paiement
          <ChevronRight size={16} />
        </Button>
      </div>
    </AppLayout>
  )
}
