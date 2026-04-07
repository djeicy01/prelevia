import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { useDossierStore } from '../../store/dossierStore'
import { catalogueApi } from '../../services/api'
import type { ExamenCatalogue } from '../../types'
import { CheckSquare, Square, Search, Loader2, ChevronRight, X, Info, TestTube, Tag } from 'lucide-react'

export default function Catalogue() {
  const navigate   = useNavigate()
  const setExamens = useDossierStore(s => s.setExamens)

  const [examens, setExamensList]       = useState<ExamenCatalogue[]>([])
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [query, setQuery]               = useState('')
  const [loading, setLoading]           = useState(true)
  const [expanded, setExpanded]         = useState<Set<string>>(new Set())
  const [infoExamen, setInfoExamen]     = useState<ExamenCatalogue | null>(null)

  useEffect(() => {
    catalogueApi.getAll()
      .then(data => {
        const list: ExamenCatalogue[] = data.examens ?? data ?? []
        setExamensList(list.filter(e => e.actif))
        const cats = new Set(list.map((e: ExamenCatalogue) => e.categorie))
        setExpanded(cats)
      })
      .catch(() => toast('Impossible de charger le catalogue', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return examens
    const q = query.toLowerCase()
    return examens.filter(e =>
      e.nom.toLowerCase().includes(q) ||
      e.code.toLowerCase().includes(q) ||
      e.categorie.toLowerCase().includes(q)
    )
  }, [examens, query])

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, ExamenCatalogue[]>>((acc, e) => {
      if (!acc[e.categorie]) acc[e.categorie] = []
      acc[e.categorie].push(e)
      return acc
    }, {})
  }, [filtered])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleCategory = (cat: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const handleNext = () => {
    if (selected.size === 0) { toast('Sélectionnez au moins un examen', 'error'); return }
    const choix = examens.filter(e => selected.has(e.id))
    setExamens(choix)
    navigate('/nouveau-dossier/assurance')
  }

  const totalXOF = examens
    .filter(e => selected.has(e.id))
    .reduce((s, e) => s + e.tarifMax, 0)

  return (
    <AppLayout noNav>
      <PageHeader title="Catalogue examens" subtitle="Parcours D — Sélection libre" back="/nouveau-dossier/parcours" />

      {/* Search bar */}
      <div className="px-5 pt-4 pb-2 sticky top-0 bg-[#F5F7F6] z-10">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C7A74]" />
          <input
            type="text"
            placeholder="Rechercher un examen (nom ou code)…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#D4E5E1] bg-white text-sm focus:outline-none focus:border-[#064D40] text-[#1A2B26] placeholder:text-[#5C7A74]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C7A74]">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="text-[#064D40] animate-spin" />
        </div>
      ) : (
        <div className="px-5 py-3 space-y-4 pb-36">
          {Object.keys(grouped).length === 0 && (
            <p className="text-center text-sm text-[#5C7A74] py-10">Aucun examen trouvé</p>
          )}

          {Object.entries(grouped).map(([cat, list]) => (
            <section key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between mb-2"
              >
                <h2 className="text-xs font-bold text-[#5C7A74] uppercase tracking-wider">{cat}</h2>
                <span className="text-[10px] text-[#5C7A74]">
                  {list.filter(e => selected.has(e.id)).length}/{list.length} ·{' '}
                  {expanded.has(cat) ? '▲' : '▼'}
                </span>
              </button>

              {expanded.has(cat) && (
                <div className="space-y-1.5">
                  {list.map(examen => {
                    const isSelected = selected.has(examen.id)
                    return (
                      <div
                        key={examen.id}
                        className={`
                          rounded-xl border flex items-center gap-3 transition-all overflow-hidden
                          ${isSelected ? 'border-[#064D40] bg-[#064D40]/5' : 'border-[#D4E5E1] bg-white'}
                        `}
                      >
                        {/* Checkbox area */}
                        <button
                          onClick={() => toggle(examen.id)}
                          className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 text-left"
                        >
                          <span className={isSelected ? 'text-[#064D40]' : 'text-[#D4E5E1]'}>
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1A2B26] truncate">{examen.nom}</p>
                            <p className="text-xs text-[#5C7A74]">
                              <span className="font-mono font-bold">{examen.code}</span>
                              {examen.typesTube && <span> · {examen.typesTube}</span>}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-[#064D40] shrink-0">
                            {examen.tarifMax.toLocaleString()} XOF
                          </span>
                        </button>

                        {/* Info button */}
                        <button
                          onClick={e => { e.stopPropagation(); setInfoExamen(examen) }}
                          className="px-3 py-3 text-[#5C7A74] hover:text-[#064D40] shrink-0 border-l border-[#D4E5E1]"
                          aria-label={`Infos sur ${examen.nom}`}
                        >
                          <Info size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D4E5E1] px-5 py-4 safe-bottom">
        {selected.size > 0 && (
          <p className="text-xs text-[#5C7A74] mb-2 text-center">
            {selected.size} examen(s) sélectionné(s) · {totalXOF.toLocaleString()} XOF
          </p>
        )}
        <Button variant="primary" size="lg" fullWidth onClick={handleNext} disabled={selected.size === 0}>
          Continuer — Assurance
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Info modal */}
      {infoExamen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setInfoExamen(null)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block font-mono text-xs font-bold text-[#064D40] bg-[#064D40]/10 px-2 py-0.5 rounded mb-1">
                  {infoExamen.code}
                </span>
                <h3 className="text-lg font-bold text-[#1A2B26]">{infoExamen.nom}</h3>
                <p className="text-xs text-[#5C7A74] mt-0.5">{infoExamen.categorie}</p>
              </div>
              <button onClick={() => setInfoExamen(null)} className="text-[#5C7A74] mt-1 shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-bold text-[#5C7A74] uppercase tracking-wider mb-1.5">
                Instructions pré-analytiques
              </p>
              {infoExamen.description ? (
                <p className="text-sm text-[#1A2B26] leading-relaxed">{infoExamen.description}</p>
              ) : (
                <p className="text-sm text-[#5C7A74] italic">Pas d'instructions particulières pour cet examen.</p>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3">
              {infoExamen.typesTube && (
                <div className="bg-[#F5F7F6] rounded-xl p-3 flex items-center gap-2">
                  <TestTube size={14} className="text-[#064D40] shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#5C7A74] uppercase font-bold">Tube</p>
                    <p className="text-xs font-semibold text-[#1A2B26]">{infoExamen.typesTube}</p>
                  </div>
                </div>
              )}
              <div className="bg-[#F5F7F6] rounded-xl p-3 flex items-center gap-2">
                <Tag size={14} className="text-[#064D40] shrink-0" />
                <div>
                  <p className="text-[10px] text-[#5C7A74] uppercase font-bold">Tarif</p>
                  <p className="text-xs font-semibold text-[#1A2B26]">{infoExamen.tarifMax.toLocaleString()} XOF</p>
                </div>
              </div>
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={() => { toggle(infoExamen.id); setInfoExamen(null) }}>
              {selected.has(infoExamen.id) ? 'Retirer la sélection' : 'Sélectionner cet examen'}
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
