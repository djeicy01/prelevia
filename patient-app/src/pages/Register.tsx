import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from '../components/ui/Toast'
import { authApi } from '../services/api'
import { ChevronLeft, User, Phone, MapPin } from 'lucide-react'

const COMMUNES = [
  'Yopougon', 'Cocody', 'Abobo', 'Attécoubé', 'Plateau',
  'Marcory', 'Treichville', 'Adjamé', 'Koumassi', 'Port-Bouët',
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', commune: 'Yopougon' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nom.trim())       e.nom       = 'Nom requis'
    if (!form.prenom.trim())    e.prenom    = 'Prénom requis'
    if (!form.telephone.trim()) e.telephone = 'Téléphone requis'
    else if (!/^\+?[\d\s\-]{8,15}$/.test(form.telephone))
      e.telephone = 'Numéro invalide (ex: +225 07 12 34 56)'
    if (!form.commune)          e.commune   = 'Commune requise'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await authApi.register({
        ...form,
        nom:     form.nom.toUpperCase().trim(),
        prenom:  form.prenom.toUpperCase().trim(),
        commune: form.commune.toUpperCase().trim(),
      })
      toast('Compte créé ! Un code vous sera envoyé par SMS.', 'success')
      navigate('/login', { state: { telephone: form.telephone } })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur lors de l\'inscription'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="min-h-screen bg-[#f0f5f4] flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-[#064D40] px-4 pt-14 pb-8 safe-top text-white">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-white/10 mb-4">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-2xl font-extrabold">Créer un compte</h1>
        <p className="text-white/70 text-sm mt-1">Inscrivez-vous pour bénéficier du service à domicile</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-[#064D40]" />
            <span className="text-sm font-bold text-[#1A2B26]">Informations personnelles</span>
          </div>

          <Input
            label="Prénom"
            placeholder="ex : Kouamé"
            value={form.prenom}
            onChange={e => set('prenom', e.target.value.toUpperCase())}
            className="uppercase"
            error={errors.prenom}
          />
          <Input
            label="Nom de famille"
            placeholder="ex : Brou"
            value={form.nom}
            onChange={e => set('nom', e.target.value.toUpperCase())}
            className="uppercase"
            error={errors.nom}
          />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone size={16} className="text-[#064D40]" />
            <span className="text-sm font-bold text-[#1A2B26]">Contact</span>
          </div>

          <Input
            label="Téléphone"
            type="tel"
            placeholder="+225 07 12 34 56"
            value={form.telephone}
            onChange={e => set('telephone', e.target.value)}
            error={errors.telephone}
          />
          <p className="text-xs text-[#5C7A74]">
            Un code de vérification sera envoyé à ce numéro.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-[#064D40]" />
            <span className="text-sm font-bold text-[#1A2B26]">Commune</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1A2B26]">Votre commune</label>
            <select
              className="w-full border border-[#D4E5E1] rounded-xl bg-white px-4 py-3 text-[15px] text-[#1A2B26] focus:outline-none focus:border-[#064D40]"
              value={form.commune}
              onChange={e => set('commune', e.target.value)}
            >
              {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.commune && <p className="text-xs text-[#E05C5C]">{errors.commune}</p>}
          </div>
        </div>
      </div>

      <div className="px-5 pb-10 space-y-3 safe-bottom">
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleSubmit}>
          Créer mon compte
        </Button>
        <p className="text-center text-sm text-[#5C7A74]">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-[#064D40] font-semibold">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
