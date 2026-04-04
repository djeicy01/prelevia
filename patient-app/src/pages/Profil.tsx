import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from '../components/ui/Toast'
import { useAuthStore } from '../store/authStore'
import { authApi, assurancesApi } from '../services/api'
import type { Assurance } from '../types'
import {
  User, Phone, MapPin, Mail, Shield, AlertTriangle,
  LogOut, Save, ChevronRight,
} from 'lucide-react'

const COMMUNES = [
  'Yopougon', 'Cocody', 'Abobo', 'Attécoubé', 'Plateau',
  'Marcory', 'Treichville', 'Adjamé', 'Koumassi', 'Port-Bouët',
]

export default function Profil() {
  const navigate      = useNavigate()
  const patient       = useAuthStore(s => s.patient)
  const updatePatient = useAuthStore(s => s.updatePatient)
  const logout        = useAuthStore(s => s.logout)

  const [email, setEmail]           = useState(patient?.email ?? '')
  const [commune, setCommune]       = useState(patient?.commune ?? 'Yopougon')
  const [assurances, setAssurances] = useState<Assurance[]>([])
  const [assuranceId, setAssurId]   = useState(patient?.assuranceId ?? '')
  const [numCarte, setNumCarte]     = useState(patient?.numCarte ?? '')
  const [nonPartenaire, setNonPart] = useState('')
  const [saving, setSaving]         = useState(false)

  const isPartenaire = assurances.some(a => a.id === assuranceId)

  useEffect(() => {
    assurancesApi.getAll()
      .then(data => setAssurances(data.assurances ?? data ?? []))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await authApi.updateMe({
        email: email || undefined,
        assuranceId: assuranceId || undefined,
        numCarte: numCarte || undefined,
        commune,
      })
      updatePatient(updated)
      toast('Profil mis à jour', 'success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur'
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/onboarding', { replace: true })
  }

  return (
    <AppLayout>
      <PageHeader title="Mon profil" />

      <div className="px-5 py-5 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-[#064D40] flex items-center justify-center text-white text-2xl font-extrabold">
            {patient?.prenom?.[0]}{patient?.nom?.[0]}
          </div>
          <div className="text-center">
            <p className="font-extrabold text-[18px] text-[#1A2B26]">{patient?.prenom} {patient?.nom}</p>
            <p className="text-sm text-[#5C7A74]">{patient?.ref}</p>
          </div>
        </div>

        {/* Infos personnelles */}
        <div className="bg-white rounded-2xl p-5 border border-[#D4E5E1] shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User size={15} className="text-[#064D40]" />
            <span className="text-sm font-bold text-[#1A2B26]">Informations</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-[#f0f5f4] rounded-xl">
            <Phone size={15} className="text-[#5C7A74]" />
            <span className="text-sm text-[#1A2B26]">{patient?.telephone}</span>
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            left={<Mail size={15} />}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1A2B26] flex items-center gap-1.5">
              <MapPin size={14} /> Commune
            </label>
            <select
              className="w-full border border-[#D4E5E1] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[#064D40]"
              value={commune}
              onChange={e => setCommune(e.target.value)}
            >
              {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Assurance */}
        <div className="bg-white rounded-2xl p-5 border border-[#D4E5E1] shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={15} className="text-[#064D40]" />
            <span className="text-sm font-bold text-[#1A2B26]">Assurance</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1A2B26]">Assureur partenaire</label>
            <select
              className="w-full border border-[#D4E5E1] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[#064D40]"
              value={assuranceId}
              onChange={e => setAssurId(e.target.value)}
            >
              <option value="">— Sans assurance —</option>
              {assurances.map(a => (
                <option key={a.id} value={a.id}>{a.nom} ({a.tauxCouverture}%)</option>
              ))}
            </select>
          </div>

          {assuranceId && (
            <Input
              label="Numéro de carte"
              placeholder="N° carte assurance"
              value={numCarte}
              onChange={e => setNumCarte(e.target.value)}
            />
          )}

          {/* Non partenaire warning */}
          {nonPartenaire && !isPartenaire && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Votre assureur n'est pas partenaire. Vous devrez avancer les frais et vous faire rembourser directement.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <Button variant="primary" size="lg" fullWidth loading={saving} onClick={handleSave}>
          <Save size={16} />
          Sauvegarder
        </Button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-[#E05C5C] hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>

        <p className="text-center text-xs text-[#5C7A74] pb-2">
          Couvert par <strong className="text-[#064D40]">Labo Maison Blanche</strong> · Yopougon, Abidjan
        </p>
      </div>
    </AppLayout>
  )
}
