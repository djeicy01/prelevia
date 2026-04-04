import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { resultatsApi } from '../services/api'
import type { ResultatDossier, ResultatExamen } from '../types'
import { AlertTriangle, CheckCircle, TrendingUp, Loader2, Download } from 'lucide-react'

function ValeurBadge({ resultat }: { resultat: ResultatExamen }) {
  const val = parseFloat(resultat.valeur)
  const isNum = !isNaN(val)

  let status: 'normal' | 'warning' | 'critique' = 'normal'
  if (resultat.critique) status = 'critique'
  else if (isNum && resultat.referenceMin !== undefined && resultat.referenceMax !== undefined) {
    if (val < resultat.referenceMin || val > resultat.referenceMax) status = 'warning'
  }

  const colors = {
    normal:   'bg-[#2CB67D]/10 text-[#2CB67D]',
    warning:  'bg-amber-100 text-amber-700',
    critique: 'bg-red-100 text-[#E05C5C]',
  }

  return (
    <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${colors[status]}`}>
      {resultat.valeur} {resultat.unite}
      {resultat.critique && ' 🚨'}
    </span>
  )
}

export default function ResultatDetail() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()

  const [data, setData]     = useState<ResultatDossier | null>(null)
  const [loading, setLoad]  = useState(true)

  useEffect(() => {
    if (!id) return
    resultatsApi.getResultat(id)
      .then(r => setData(r.resultat ?? r))
      .catch(() => navigate('/resultats'))
      .finally(() => setLoad(false))
  }, [id])

  if (loading) return (
    <AppLayout noNav>
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="text-[#064D40] animate-spin" />
      </div>
    </AppLayout>
  )

  if (!data) return null
  const hasCritique = data.resultats?.some(r => r.critique)

  return (
    <AppLayout noNav>
      <PageHeader
        title={data.dossier?.ref ?? 'Résultats'}
        subtitle={new Date(data.renduLe).toLocaleDateString('fr-CI', { day: '2-digit', month: 'long', year: 'numeric' })}
        back="/resultats"
      />

      <div className="px-5 py-5 space-y-4">
        {/* Alerte critique */}
        {hasCritique && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle size={20} className="text-[#E05C5C] shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800">🚨 Valeur(s) critique(s)</p>
              <p className="text-xs text-red-600 mt-0.5">
                Consultez un médecin. Un SMS d'alerte vous a été envoyé automatiquement.
              </p>
            </div>
          </div>
        )}

        {/* Résultats */}
        <div className="bg-white rounded-2xl border border-[#D4E5E1] overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#D4E5E1]">
            <p className="text-sm font-bold text-[#1A2B26]">{data.resultats?.length ?? 0} résultat(s)</p>
          </div>
          {data.resultats?.map(r => {
            const hasRef = r.referenceMin !== undefined && r.referenceMax !== undefined
            return (
              <div key={r.id} className="px-4 py-4 border-b border-[#D4E5E1] last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#1A2B26]">{r.catalogue?.nom ?? '—'}</p>
                    <p className="text-xs text-[#5C7A74] mt-0.5 flex items-center gap-1">
                      <TrendingUp size={11} />
                      {hasRef ? `Référence : ${r.referenceMin} – ${r.referenceMax} ${r.unite}` : 'Pas de référence'}
                    </p>
                  </div>
                  <ValeurBadge resultat={r} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-[#2CB67D]">
            <CheckCircle size={12} /> Normal
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle size={12} /> Hors norme
          </span>
          <span className="flex items-center gap-1 text-[#E05C5C]">
            🚨 Critique
          </span>
        </div>

        {/* Télécharger PDF */}
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#064D40]/30 text-[#064D40] text-sm font-semibold hover:bg-[#064D40]/3 transition-colors">
          <Download size={16} />
          Télécharger le PDF
        </button>
      </div>
    </AppLayout>
  )
}
