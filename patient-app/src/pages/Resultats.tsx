import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { resultatsApi } from '../services/api'
import type { ResultatDossier } from '../types'
import { AlertTriangle, FlaskConical, ChevronRight, Loader2 } from 'lucide-react'

export default function Resultats() {
  const navigate = useNavigate()
  const [resultats, setResultats] = useState<ResultatDossier[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    resultatsApi.getMesResultats()
      .then(data => setResultats(data.resultats ?? data ?? []))
      .catch(() => setResultats([]))
      .finally(() => setLoading(false))
  }, [])

  const hasCritique = resultats.some(r => r.resultats?.some(v => v.critique))

  return (
    <AppLayout>
      <PageHeader title="Mes résultats" />

      <div className="px-5 py-5 space-y-4">
        {/* Alerte critique */}
        {hasCritique && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle size={20} className="text-[#E05C5C] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Valeurs critiques détectées 🚨</p>
              <p className="text-xs text-red-600 mt-0.5">
                Un SMS vous a été envoyé. Consultez un médecin rapidement.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={26} className="text-[#064D40] animate-spin" />
          </div>
        ) : resultats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#D4E5E1] p-8 text-center">
            <FlaskConical size={36} className="text-[#D4E5E1] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#1A2B26]">Aucun résultat disponible</p>
            <p className="text-xs text-[#5C7A74] mt-1">Vos résultats apparaîtront ici sous 24h</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resultats.map(r => {
              const critique = r.resultats?.some(v => v.critique)
              const date = new Date(r.renduLe).toLocaleDateString('fr-CI', {
                day: '2-digit', month: 'long', year: 'numeric'
              })
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(`/resultats/${r.dossierId}`)}
                  className="w-full bg-white rounded-2xl border border-[#D4E5E1] p-4 flex items-center gap-4 text-left shadow-sm hover:border-[#064D40]/30 transition-colors active:scale-[0.98]"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${critique ? 'bg-red-100' : 'bg-[#064D40]/8'}`}>
                    {critique
                      ? <AlertTriangle size={18} className="text-[#E05C5C]" />
                      : <FlaskConical  size={18} className="text-[#064D40]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1A2B26]">{r.dossier?.ref ?? '—'}</span>
                      {critique && (
                        <span className="text-[10px] font-bold bg-red-100 text-[#E05C5C] px-2 py-0.5 rounded-full">
                          🚨 Critique
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5C7A74] mt-0.5">
                      {r.resultats?.length ?? 0} résultat(s) · {date}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-[#5C7A74] shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
