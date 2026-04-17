import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { toast } from '../../components/ui/Toast'
import { useDossierStore } from '../../store/dossierStore'
import { campagnesApi } from '../../services/api'
import { Building2, CheckCircle, ChevronRight, Loader2 } from 'lucide-react'

export default function Campagne() {
  const navigate   = useNavigate()
  const setCampagne = useDossierStore(s => s.setCampagne)
  const setExamens  = useDossierStore(s => s.setExamens)

  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [validated, setVal]   = useState<{ nom: string; examens: { id: string; nom: string; tarifMax: number; code: string; typesTube: string; categorie: string; valeurB: number; tarifMin: number; actif: boolean }[] } | null>(null)

  const handleValidate = async () => {
    if (!code.trim()) { toast('Entrez votre code', 'error'); return }
    setLoading(true)
    try {
      const data = await campagnesApi.validerCode(code.trim())
      setVal(data)
      setCampagne(code.trim(), { nom: data.nom })
      if (data.examens?.length) setExamens(data.examens)
      toast('Code campagne validé !', 'success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Code invalide ou expiré'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout noNav>
      <PageHeader title="Code campagne" subtitle="Parcours C — Prélèvement entreprise" back="/nouveau-dossier/parcours" />

      <div className="px-5 py-6 space-y-5">
        <div className="bg-white rounded-2xl p-5 border border-[#D4E5E1] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 size={20} className="text-[#3B82F6]" />
            </div>
            <div>
              <p className="font-bold text-[#1A2B26]">Code campagne</p>
              <p className="text-xs text-[#5C7A74]">Fourni par votre employeur ou mutuelle</p>
            </div>
          </div>

          <Input
            label="Code"
            placeholder="ex : MTN-2026-CAMP"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            disabled={!!validated}
          />

          {!validated && (
            <Button variant="primary" fullWidth loading={loading} onClick={handleValidate}>
              {loading ? 'Validation…' : 'Valider le code'}
            </Button>
          )}
        </div>

        {validated && (
          <div className="bg-[#2CB67D]/8 rounded-2xl p-5 border border-[#2CB67D]/30">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} className="text-[#2CB67D]" />
              <span className="font-bold text-[#1A2B26]">{validated.nom}</span>
            </div>
            <p className="text-sm text-[#5C7A74] mb-3">
              {validated.examens?.length ?? 0} examen(s) inclus dans cette campagne
            </p>
            <div className="flex flex-wrap gap-1.5">
              {validated.examens?.slice(0, 8).map((e) => (
                <span key={e.id} className="text-xs bg-white border border-[#2CB67D]/30 text-[#064D40] px-2 py-0.5 rounded-md font-semibold">
                  {e.code}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#3B82F6]/8 rounded-xl p-4">
          <p className="text-xs text-[#3B82F6] font-semibold mb-1">Exemples de codes</p>
          <p className="text-xs text-[#5C7A74]">
            Police Nationale · MTN CI · Orange CI et autres partenaires institutionnels.
          </p>
        </div>
      </div>

      {validated && (
        <div className="px-5 pb-8">
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/nouveau-dossier/assurance')}>
            Continuer — Assurance
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </AppLayout>
  )
}
