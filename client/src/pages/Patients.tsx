import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import Spinner from '../components/ui/Spinner'
import { BadgeDossier, BadgeAssurance, BadgeOcr } from '../components/ui/Badge'
import { dossiersService } from '../services/dossiers'
import { patientsService } from '../services/patients'
import api from '../services/api'
import type { Dossier, Assurance } from '../types'

// ── Constantes ────────────────────────────────────────────────
const COMMUNES = [
  'Yopougon', 'Cocody', 'Abobo', 'Attécoubé',
  'Plateau', 'Marcory', 'Koumassi', 'Adjamé',
]
const EMPTY_FORM = {
  nom: '', prenom: '', telephone: '', commune: 'Yopougon',
  assuranceId: '', rdvDate: '',
}

// ── Modale création dossier ───────────────────────────────────
function ModalNouveauDossier({
  assurances,
  onClose,
  onCreated,
}: {
  assurances: Assurance[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm]     = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  function set(key: keyof typeof EMPTY_FORM, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.prenom.trim() || !form.telephone.trim()) {
      setError('Nom, prénom et téléphone sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      // 1. Créer le patient
      const patient = await patientsService.create({
        nom:        form.nom.trim(),
        prenom:     form.prenom.trim(),
        telephone:  form.telephone.trim(),
        commune:    form.commune,
        ...(form.assuranceId ? { assuranceId: form.assuranceId } : {}),
      })
      // 2. Créer le dossier lié
      const note = form.rdvDate
        ? `RDV souhaité le ${new Date(form.rdvDate).toLocaleDateString('fr-FR')}`
        : undefined
      await dossiersService.create({
        patientId: patient.id,
        ...(note ? { noteAdmin: note } : {}),
      })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 flex flex-col"
        style={{ border: '1px solid #D4E5E1' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#D4E5E1' }}>
          <h2 className="font-bold text-base" style={{ color: '#1A2B26' }}>Nouveau dossier patient</h2>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: '#5C7A74' }}>×</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nom / Prénom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#1A2B26' }}>
                Nom <span style={{ color: '#E05C5C' }}>*</span>
              </label>
              <input
                value={form.nom}
                onChange={e => set('nom', e.target.value)}
                placeholder="KONÉ"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: '#D4E5E1', color: '#1A2B26' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#1A2B26' }}>
                Prénom <span style={{ color: '#E05C5C' }}>*</span>
              </label>
              <input
                value={form.prenom}
                onChange={e => set('prenom', e.target.value)}
                placeholder="Aminata"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: '#D4E5E1', color: '#1A2B26' }}
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#1A2B26' }}>
              Téléphone <span style={{ color: '#E05C5C' }}>*</span>
            </label>
            <input
              value={form.telephone}
              onChange={e => set('telephone', e.target.value)}
              placeholder="+225 07 00 00 00"
              type="tel"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: '#D4E5E1', color: '#1A2B26' }}
            />
          </div>

          {/* Commune */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#1A2B26' }}>Commune</label>
            <select
              value={form.commune}
              onChange={e => set('commune', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: '#D4E5E1', color: '#1A2B26' }}
            >
              {COMMUNES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Assurance */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#1A2B26' }}>
              Assurance <span className="font-normal" style={{ color: '#5C7A74' }}>(optionnel)</span>
            </label>
            <select
              value={form.assuranceId}
              onChange={e => set('assuranceId', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: '#D4E5E1', color: '#1A2B26' }}
            >
              <option value="">Aucune assurance</option>
              {assurances.map(a => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </select>
          </div>

          {/* Date RDV souhaitée */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#1A2B26' }}>
              Date de RDV souhaitée <span className="font-normal" style={{ color: '#5C7A74' }}>(optionnel)</span>
            </label>
            <input
              value={form.rdvDate}
              onChange={e => set('rdvDate', e.target.value)}
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: '#D4E5E1', color: '#1A2B26' }}
            />
          </div>

          {/* Erreur */}
          {error && (
            <p className="text-xs font-medium" style={{ color: '#E05C5C' }}>{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: '#D4E5E1' }}>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold px-4 py-2 rounded-lg border"
            style={{ borderColor: '#D4E5E1', color: '#5C7A74' }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={handleSubmit as any}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60 transition-opacity"
            style={{ background: '#F4A726' }}
          >
            {saving ? 'Création…' : 'Créer le dossier'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function Patients() {
  const [dossiers, setDossiers]     = useState<Dossier[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [assurances, setAssurances] = useState<Assurance[]>([])
  const navigate = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    dossiersService.list({ page, limit: 20, search: search || undefined } as any)
      .then(res => { setDossiers(res.data); setTotal(res.total) })
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  // Charger les assurances une seule fois pour le modal
  useEffect(() => {
    api.get<Assurance[]>('/assurances').then(r => setAssurances(r.data)).catch(() => {})
  }, [])

  function handleCreated() {
    setShowModal(false)
    setPage(1)
    load()
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="Dossiers patients"
        subtitle={`${total} dossiers`}
        actions={
          <div className="flex items-center gap-3">
            <input
              className="text-[13px] px-3 py-1.5 rounded-lg border outline-none"
              style={{ borderColor: '#D4E5E1', background: '#F5F7F6' }}
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            <button
              onClick={() => setShowModal(true)}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white whitespace-nowrap"
              style={{ background: '#F4A726' }}
            >
              + Nouveau dossier
            </button>
          </div>
        }
      />

      {showModal && (
        <ModalNouveauDossier
          assurances={assurances}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      <div className="p-7 flex-1">
        <div className="bg-white rounded-[13px] border overflow-hidden" style={{ borderColor: '#D4E5E1' }}>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : dossiers.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4" style={{ color: '#5C7A74' }}>
              <p className="text-sm">Aucun dossier trouvé</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white"
                style={{ background: '#F4A726' }}
              >
                + Créer le premier dossier
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: '#F5F7F6' }}>
                    {['Réf.', 'Patient', 'Commune', 'Source OCR', 'Statut dossier', 'Assurance', 'Examens', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] uppercase tracking-[0.7px] font-semibold"
                          style={{ color: '#5C7A74' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map(d => (
                    <tr key={d.id}
                        onClick={() => navigate(`/patients/${d.id}`)}
                        className="border-t hover:bg-[#F5F7F6]/50 transition-colors cursor-pointer"
                        style={{ borderColor: '#D4E5E1' }}>
                      <td className="px-4 py-3 text-[12px] font-mono font-semibold" style={{ color: '#0A6E5C' }}>
                        {d.ref}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: '#1A2B26' }}>
                        {d.patient ? `${d.patient.prenom} ${d.patient.nom}` : '—'}
                        {d.patient && (
                          <div className="text-[11px] font-normal mt-0.5" style={{ color: '#5C7A74' }}>
                            {d.patient.telephone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(10,110,92,0.08)', color: '#0A6E5C' }}>
                          📍 {d.patient?.commune ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3"><BadgeOcr source={d.ocrSource} /></td>
                      <td className="px-4 py-3"><BadgeDossier statut={d.statut} /></td>
                      <td className="px-4 py-3"><BadgeAssurance statut={d.statutAssurance} /></td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: '#5C7A74' }}>
                        {d.examens?.length ?? 0} examen(s)
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: '#5C7A74' }}>
                        {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-[13px]"
                 style={{ borderColor: '#D4E5E1', color: '#5C7A74' }}>
              <span>{total} dossiers au total</span>
              <div className="flex gap-2">
                <button disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 rounded border text-xs disabled:opacity-40"
                        style={{ borderColor: '#D4E5E1' }}>
                  ← Précédent
                </button>
                <span className="px-2 py-1 text-xs font-semibold">Page {page}</span>
                <button disabled={page * 20 >= total}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 rounded border text-xs disabled:opacity-40"
                        style={{ borderColor: '#D4E5E1' }}>
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
