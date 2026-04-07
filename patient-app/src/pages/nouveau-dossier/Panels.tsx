import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { useDossierStore } from '../../store/dossierStore'
import { catalogueApi } from '../../services/api'
import type { Panel } from '../../types'
import { CheckSquare, Square, ChevronRight, Loader2 } from 'lucide-react'

const CATEGORIE_ORDER = ['Bilan courant', 'Bilan spécialisé', 'Campagne']

export default function Panels() {
  const navigate   = useNavigate()
  const setExamens = useDossierStore(s => s.setExamens)

  const [panels, setPanels]     = useState<Panel[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    catalogueApi.getPanels()
      .then(data => setPanels(data.panels ?? data ?? []))
      .catch(() => toast('Impossible de charger les panels', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleNext = () => {
    if (selected.size === 0) { toast('Sélectionnez au moins un panel', 'error'); return }
    const choix = panels.filter(p => selected.has(p.id))
    const examens = choix.flatMap(p => p.examens.map(pe => pe.catalogue))
    const unique = [...new Map(examens.map(e => [e.id, e])).values()]
    setExamens(unique)
    navigate('/nouveau-dossier/assurance')
  }

  const grouped = CATEGORIE_ORDER.reduce<Record<string, Panel[]>>((acc, cat) => {
    const inCat = panels.filter(p => p.actif && (p.categorie ?? 'Bilan courant') === cat)
    if (inCat.length) acc[cat] = inCat
    return acc
  }, {})

  const totalExamens = panels
    .filter(p => selected.has(p.id))
    .flatMap(p => p.examens)
    .map(pe => pe.catalogue.id)

  const uniqueTotal = new Set(totalExamens).size

  return (
    <AppLayout noNav>
      <PageHeader title="Sélection panels" subtitle="Parcours B — Panels prédéfinis" back="/nouveau-dossier/parcours" />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="text-[#064D40] animate-spin" />
        </div>
      ) : (
        <div className="px-5 py-4 space-y-6">
          {Object.entries(grouped).map(([cat, panelsList]) => (
            <section key={cat}>
              <h2 className="text-xs font-bold text-[#5C7A74] uppercase tracking-wider mb-3">{cat}</h2>
              <div className="space-y-2">
                {panelsList.map(panel => {
                  const isSelected = selected.has(panel.id)
                  const examCount = panel.examens?.length ?? 0
                  const total = panel.examens?.reduce((s, pe) => s + pe.catalogue.tarifMax, 0) ?? 0
                  return (
                    <button
                      key={panel.id}
                      onClick={() => toggle(panel.id)}
                      className={`
                        w-full rounded-2xl p-4 border-2 text-left transition-all
                        ${isSelected
                          ? 'border-[#064D40] bg-[#064D40]/5'
                          : 'border-[#D4E5E1] bg-white hover:border-[#064D40]/30'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 ${isSelected ? 'text-[#064D40]' : 'text-[#D4E5E1]'}`}>
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                        </span>
                        <div className="flex-1">
                          <p className="font-bold text-[#1A2B26] text-[15px]">{panel.nom}</p>
                          <p className="text-xs text-[#5C7A74] mt-0.5">
                            {examCount} examen(s) · {total.toLocaleString()} XOF
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {panel.examens?.slice(0, 5).map(pe => (
                              <span key={pe.catalogue.id} className="text-[10px] bg-[#064D40]/8 text-[#064D40] px-1.5 py-0.5 rounded-md font-semibold">
                                {pe.catalogue.code}
                              </span>
                            ))}
                            {(panel.examens?.length ?? 0) > 5 && (
                              <span className="text-[10px] text-[#5C7A74] px-1.5 py-0.5">
                                +{panel.examens.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}

          {uniqueTotal > 0 && (
            <div className="bg-[#064D40]/5 rounded-xl p-4">
              <p className="text-sm font-bold text-[#064D40]">
                {selected.size} panel(s) · {uniqueTotal} examen(s) unique(s)
              </p>
            </div>
          )}
        </div>
      )}

      <div className="px-5 pb-8">
        <Button variant="primary" size="lg" fullWidth onClick={handleNext} disabled={selected.size === 0}>
          Continuer — Assurance
          <ChevronRight size={16} />
        </Button>
      </div>
    </AppLayout>
  )
}
