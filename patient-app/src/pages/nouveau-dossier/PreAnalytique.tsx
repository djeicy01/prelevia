import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { useDossierStore } from '../../store/dossierStore'
import { Info, CheckSquare, Square, ChevronRight } from 'lucide-react'

export default function PreAnalytique() {
  const navigate = useNavigate()
  const examens  = useDossierStore(s => s.examensSelectionnes)
  const [checked, setChecked] = useState(false)

  return (
    <AppLayout noNav>
      <PageHeader
        title="Instructions pré-analytiques"
        subtitle="À lire avant votre prélèvement"
        back="/nouveau-dossier/assurance"
      />

      <div className="px-5 py-5 space-y-4 pb-36">
        {/* Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Respecter ces instructions est essentiel pour obtenir des résultats fiables.
            L'agent de prélèvement vérifiera que les conditions ont bien été respectées.
          </p>
        </div>

        {/* Exam list */}
        {examens.map(examen => (
          <div
            key={examen.id}
            className="bg-white rounded-2xl border border-[#D4E5E1] overflow-hidden shadow-sm"
          >
            <div className="px-4 py-3 bg-[#064D40]/5 border-b border-[#D4E5E1] flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#064D40] bg-[#064D40]/10 px-2 py-0.5 rounded shrink-0">
                {examen.code}
              </span>
              <span className="text-sm font-bold text-[#1A2B26] truncate">{examen.nom}</span>
              {examen.typesTube && (
                <span className="ml-auto text-[10px] text-[#5C7A74] font-semibold shrink-0">
                  {examen.typesTube}
                </span>
              )}
            </div>
            <div className="px-4 py-3">
              {examen.description ? (
                <p className="text-sm text-[#1A2B26] leading-relaxed">{examen.description}</p>
              ) : (
                <p className="text-sm text-[#5C7A74] italic">
                  Pas d'instructions particulières pour cet examen.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D4E5E1] px-5 py-4 safe-bottom space-y-3">
        <button
          onClick={() => setChecked(v => !v)}
          className="w-full flex items-start gap-3 text-left"
        >
          <span className={`shrink-0 mt-0.5 ${checked ? 'text-[#064D40]' : 'text-[#D4E5E1]'}`}>
            {checked ? <CheckSquare size={20} /> : <Square size={20} />}
          </span>
          <span className="text-sm font-semibold text-[#1A2B26] leading-snug">
            J'ai pris connaissance de toutes les instructions pré-analytiques
          </span>
        </button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!checked}
          onClick={() => navigate('/nouveau-dossier/confirmation')}
        >
          Continuer — Confirmation
          <ChevronRight size={16} />
        </Button>
      </div>
    </AppLayout>
  )
}
