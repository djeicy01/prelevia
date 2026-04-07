import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { useDossierStore } from '../../store/dossierStore'
import { useAuthStore } from '../../store/authStore'
import { dossiersApi } from '../../services/api'
import { MapPin, Calendar, Clock, CheckCircle, Loader2, LocateFixed } from 'lucide-react'
import { AddressAutocomplete } from '../../components/ui/AddressAutocomplete'

const COMMUNES = [
  'Yopougon', 'Cocody', 'Abobo', 'Attécoubé', 'Plateau',
  'Marcory', 'Treichville', 'Adjamé', 'Koumassi', 'Port-Bouët',
]

// Generate next 7 days slots
function genCreneaux() {
  const slots = []
  for (let d = 1; d <= 7; d++) {
    const date = new Date()
    date.setDate(date.getDate() + d)
    if (date.getDay() === 0) continue // skip Sunday
    const dateStr = date.toLocaleDateString('fr-CI', { weekday: 'short', day: '2-digit', month: 'short' })
    for (const h of ['07:00', '08:30', '10:00', '11:30', '14:00', '15:30']) {
      slots.push({ date: date.toISOString().split('T')[0], dateStr, heure: h })
    }
  }
  return slots
}

export default function Confirmation() {
  const navigate  = useNavigate()
  const store     = useDossierStore()
  const patient   = useAuthStore(s => s.patient)
  const reset     = useDossierStore(s => s.reset)

  const [commune, setCommune]   = useState(patient?.commune ?? 'Yopougon')
  const [adresse, setAdresse]   = useState('')
  const [creneau, setCreneau]   = useState<{ date: string; heure: string } | null>(null)
  const [loading, setLoading]     = useState(false)
  const [locating, setLocating]   = useState(false)
  const [locError, setLocError]   = useState<string | null>(null)

  const handleGetLocation = () => {
    setLocError(null)
    if (!navigator.geolocation) {
      setLocError('Localisation non disponible. Veuillez saisir votre adresse manuellement.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`,
            { headers: { Accept: 'application/json' } }
          )
          const data = await res.json()
          const addr = data.address ?? {}

          // Match commune from Nominatim response
          const detected = (addr.city_district ?? addr.suburb ?? addr.neighbourhood ?? '').toLowerCase()
          const matched = COMMUNES.find(c =>
            detected.includes(c.toLowerCase()) || c.toLowerCase().includes(detected)
          )
          if (matched) setCommune(matched)

          // Build address string from available Nominatim fields
          const parts = [addr.house_number, addr.road, addr.neighbourhood].filter(Boolean)
          if (parts.length > 0) {
            setAdresse(parts.join(', '))
          } else if (data.display_name) {
            setAdresse(data.display_name.split(',').slice(0, 2).join(',').trim())
          }

          toast('Position détectée', 'success')
        } catch {
          setLocError('Localisation non disponible. Veuillez saisir votre adresse manuellement.')
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocError('Localisation non disponible. Veuillez saisir votre adresse manuellement.')
        setLocating(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  const creneaux = genCreneaux()
  const grouped = creneaux.reduce<Record<string, typeof creneaux>>((acc, c) => {
    acc[c.dateStr] = acc[c.dateStr] ?? []
    acc[c.dateStr].push(c)
    return acc
  }, {})

  const total = store.examensSelectionnes.reduce((s, e) => s + e.tarifMax, 0)

  const handleSubmit = async () => {
    if (!creneau) { toast('Choisissez un créneau', 'error'); return }
    if (!adresse.trim()) { toast('Entrez votre adresse', 'error'); return }
    setLoading(true)
    try {
      const dossier = await dossiersApi.createDossier({
        examens: store.examensSelectionnes.map(e => e.id),
        ocrSource: store.ocrSource,
        bulletinUrl: store.bulletinUrl ?? undefined,
        assuranceId: store.assuranceId ?? undefined,
        assuranceNonPartenaireNom: store.assuranceNonPartenaireNom ?? undefined,
        campagneCode: store.campagneCode ?? undefined,
        commune,
        adresse,
        creneauDate: creneau.date,
        creneauHeure: creneau.heure,
      })
      reset()
      navigate(`/suivi/${dossier.id}`, { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur lors de la création'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout noNav>
      <PageHeader title="Confirmation" subtitle="Récapitulatif de votre dossier" back="/nouveau-dossier/pre-analytique" />

      <div className="px-5 py-5 space-y-4">
        {/* Examens */}
        <div className="bg-white rounded-2xl border border-[#D4E5E1] overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#D4E5E1]">
            <p className="text-sm font-bold text-[#1A2B26]">{store.examensSelectionnes.length} examen(s)</p>
          </div>
          {store.examensSelectionnes.slice(0, 5).map(e => (
            <div key={e.id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#D4E5E1] last:border-0">
              <span className="text-sm text-[#1A2B26]">{e.nom}</span>
              <span className="text-sm font-semibold text-[#5C7A74]">{e.tarifMax.toLocaleString()} XOF</span>
            </div>
          ))}
          {store.examensSelectionnes.length > 5 && (
            <p className="px-4 py-2 text-xs text-[#5C7A74]">+{store.examensSelectionnes.length - 5} autres</p>
          )}
          <div className="px-4 py-3 bg-[#f0f5f4] flex justify-between">
            <span className="text-sm font-bold text-[#1A2B26]">Total à payer</span>
            <span className="text-sm font-extrabold text-[#064D40]">{total.toLocaleString()} XOF</span>
          </div>
        </div>

        {/* Assurance — note remboursement uniquement */}
        {(store.assuranceId || store.assuranceNonPartenaireNom) && (
          <div className="bg-[#064D40]/5 rounded-xl px-4 py-3 flex items-start gap-2">
            <CheckCircle size={16} className="text-[#064D40] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#064D40]">
                {store.assuranceId ? 'Assurance partenaire' : store.assuranceNonPartenaireNom}
              </p>
              <p className="text-xs text-[#5C7A74] mt-0.5 leading-relaxed">
                Un dossier de remboursement sera constitué après validation par votre assurance.
              </p>
            </div>
          </div>
        )}

        {/* Adresse */}
        <div className="bg-white rounded-2xl border border-[#D4E5E1] p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#064D40]" />
              <span className="text-sm font-bold text-[#1A2B26]">Adresse de prélèvement</span>
            </div>
            <button
              onClick={handleGetLocation}
              disabled={locating}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#064D40] border border-[#064D40]/30 rounded-lg px-3 py-1.5 hover:bg-[#064D40]/5 disabled:opacity-50 transition-colors"
            >
              {locating
                ? <Loader2 size={12} className="animate-spin" />
                : <LocateFixed size={12} />}
              {locating ? 'Localisation…' : 'Utiliser ma position'}
            </button>
          </div>
          {locError && (
            <p className="text-xs text-[#E05C5C] flex items-center gap-1.5">
              <span>⚠</span> {locError}
            </p>
          )}
          <select
            className="w-full border border-[#D4E5E1] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#064D40]"
            value={commune}
            onChange={e => setCommune(e.target.value)}
          >
            {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <AddressAutocomplete
            value={adresse}
            onChange={setAdresse}
            onSelect={(a, c) => { setAdresse(a); if (c) setCommune(c) }}
            communes={COMMUNES}
            selectedCommune={commune}
          />
        </div>

        {/* Créneaux */}
        <div className="bg-white rounded-2xl border border-[#D4E5E1] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-[#064D40]" />
            <span className="text-sm font-bold text-[#1A2B26]">Choisissez un créneau</span>
          </div>
          <div className="space-y-4">
            {Object.entries(grouped).slice(0, 4).map(([dateStr, slots]) => (
              <div key={dateStr}>
                <p className="text-xs font-bold text-[#5C7A74] uppercase mb-2">{dateStr}</p>
                <div className="flex flex-wrap gap-2">
                  {slots.map(s => {
                    const isSelected = creneau?.date === s.date && creneau?.heure === s.heure
                    return (
                      <button
                        key={`${s.date}-${s.heure}`}
                        onClick={() => setCreneau({ date: s.date, heure: s.heure })}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                          ${isSelected ? 'bg-[#064D40] text-white border-[#064D40]' : 'bg-white text-[#1A2B26] border-[#D4E5E1] hover:border-[#064D40]/40'}
                        `}
                      >
                        <Clock size={11} />
                        {s.heure}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pb-8">
        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!creneau || !adresse.trim()}
          onClick={handleSubmit}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Création…</> : 'Confirmer et envoyer'}
        </Button>
      </div>
    </AppLayout>
  )
}
