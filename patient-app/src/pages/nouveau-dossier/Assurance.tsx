import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useDossierStore } from '../../store/dossierStore'
import { assurancesApi } from '../../services/api'
import type { Assurance } from '../../types'
import { Shield, AlertTriangle, CheckCircle, ChevronRight, X } from 'lucide-react'

const PARTENAIRES_IDS = ['MUGEFCI', 'CNPS', 'NSIA', 'SANLAM', 'ALLIANZ']

export default function AssurancePage() {
  const navigate     = useNavigate()
  const setAssurance = useDossierStore(s => s.setAssurance)

  const [assurances, setAssurances] = useState<Assurance[]>([])
  const [selected, setSelected]     = useState<string | null>(null)
  const [nonPartenaire, setNonPart] = useState('')
  const [mode, setMode]             = useState<'partenaire' | 'autre' | 'sans'>('partenaire')

  useEffect(() => {
    assurancesApi.getAll()
      .then(data => setAssurances(data.assurances ?? data ?? []))
      .catch(() => {})
  }, [])

  const handleNext = () => {
    if (mode === 'partenaire' && !selected) return
    if (mode === 'autre') {
      setAssurance(null, nonPartenaire || 'Autre assurance')
    } else if (mode === 'partenaire') {
      setAssurance(selected!, undefined)
    } else {
      setAssurance(null, undefined)
    }
    navigate('/nouveau-dossier/pre-analytique')
  }

  const canContinue =
    mode === 'sans' ||
    (mode === 'partenaire' && !!selected) ||
    (mode === 'autre')

  return (
    <AppLayout noNav>
      <PageHeader title="Assurance" subtitle="Prise en charge mutualisée" back="/nouveau-dossier/ocr" />

      <div className="px-5 py-5 space-y-4">
        {/* Mode selector */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'partenaire', label: 'Partenaire', icon: <Shield size={14} /> },
            { id: 'autre',      label: 'Autre',      icon: <AlertTriangle size={14} /> },
            { id: 'sans',       label: 'Sans',        icon: <X size={14} /> },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setMode(id as typeof mode); setSelected(null) }}
              className={`
                flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-colors
                ${mode === id ? 'border-[#064D40] bg-[#064D40]/5 text-[#064D40]' : 'border-[#D4E5E1] text-[#5C7A74]'}
              `}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Partenaires */}
        {mode === 'partenaire' && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#1A2B26]">Choisissez votre assureur partenaire</p>
            {assurances.map(assur => {
              const isSelected = selected === assur.id
              return (
                <button
                  key={assur.id}
                  onClick={() => setSelected(assur.id)}
                  className={`
                    w-full rounded-2xl p-4 border-2 text-left flex items-center gap-3 transition-all
                    ${isSelected ? 'border-[#064D40] bg-[#064D40]/5' : 'border-[#D4E5E1] bg-white'}
                  `}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#064D40]' : 'bg-[#064D40]/8'}`}>
                    <Shield size={16} className={isSelected ? 'text-white' : 'text-[#064D40]'} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[14px] text-[#1A2B26]">{assur.nom}</p>
                    <p className="text-xs text-[#5C7A74]">Couverture {assur.tauxCouverture}% · {assur.type}</p>
                  </div>
                  {isSelected && <CheckCircle size={18} className="text-[#064D40] shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        {/* Assurance non partenaire */}
        {mode === 'autre' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Assurance non partenaire</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Votre assureur n'est pas encore partenaire de Prelevia. Vous devrez avancer le montant total et être remboursé directement par votre assureur. Nous enregistrerons votre assurance pour faciliter les démarches.
                  </p>
                </div>
              </div>
            </div>
            <Input
              label="Nom de votre assureur"
              placeholder="ex : Saham Assurance, GA Côte d'Ivoire…"
              value={nonPartenaire}
              onChange={e => setNonPart(e.target.value)}
            />
          </div>
        )}

        {/* Sans assurance */}
        {mode === 'sans' && (
          <div className="bg-[#f0f5f4] rounded-xl p-4">
            <p className="text-sm text-[#5C7A74]">
              Vous paierez l'intégralité du montant des examens. Paiement possible en cash, Orange Money, MTN ou Wave.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 pb-8">
        <Button variant="primary" size="lg" fullWidth onClick={handleNext} disabled={!canContinue}>
          Continuer — Instructions
          <ChevronRight size={16} />
        </Button>
      </div>
    </AppLayout>
  )
}
