import { useEffect, useState, useCallback } from 'react'
import Topbar from '../components/layout/Topbar'
import Spinner from '../components/ui/Spinner'
import { BadgePaiement } from '../components/ui/Badge'
import { paiementsService } from '../services/paiements'
import { dossiersService } from '../services/dossiers'
import type { Paiement, Dossier, ModePaiement } from '../types'

// ── Design tokens ─────────────────────────────────────────────
const P  = '#0A6E5C'
const AC = '#F4A726'
const BD = '#D4E5E1'
const TX = '#1A2B26'
const TL = '#5C7A74'
const BG = '#F5F7F6'

const MODES: { value: ModePaiement; label: string }[] = [
  { value: 'CASH',         label: 'Espèces' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'MTN_MONEY',    label: 'MTN Money' },
  { value: 'WAVE',         label: 'Wave' },
  { value: 'VIREMENT',     label: 'Virement' },
]

const MODES_LABELS: Record<string, string> = {
  CASH:         '💵 Espèces',
  ORANGE_MONEY: '🟠 Orange Money',
  MTN_MONEY:    '🟡 MTN Money',
  WAVE:         '🔵 Wave',
  VIREMENT:     '🏦 Virement',
}

// ── Modal enregistrement paiement ─────────────────────────────
function ModalPaiement({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [dossiers, setDossiers]   = useState<Dossier[]>([])
  const [loadingD, setLoadingD]   = useState(true)
  const [dossierId, setDossierId] = useState('')
  const [mode, setMode]           = useState<ModePaiement>('CASH')
  const [montant, setMontant]     = useState('')
  const [reference, setReference] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    dossiersService.list({ statut: 'PRELEVEMENT_FAIT', limit: 100 } as any)
      .then(res => {
        setDossiers(res.data)
        if (res.data.length > 0) {
          setDossierId(res.data[0].id)
          const fp = res.data[0].finances?.partPatient
          if (fp) setMontant(String(fp))
        }
      })
      .finally(() => setLoadingD(false))
  }, [])

  function handleDossierChange(id: string) {
    setDossierId(id)
    const d = dossiers.find(x => x.id === id)
    setMontant(d?.finances?.partPatient ? String(d.finances.partPatient) : '')
  }

  const dossierChoisi = dossiers.find(d => d.id === dossierId)

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!dossierId)  { setError('Sélectionnez un dossier'); return }
    if (!montant || Number(montant) <= 0) { setError('Montant invalide'); return }
    setSaving(true); setError(null)
    try {
      await paiementsService.create({
        dossierId, montant: Number(montant), mode,
        reference: reference.trim() || undefined,
      })
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4"
        style={{ border: `1px solid ${BD}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BD }}>
          <h2 className="font-bold text-base" style={{ color: TX }}>Enregistrer un paiement</h2>
          <button onClick={onClose} className="text-xl" style={{ color: TL }}>×</button>
        </div>

        {loadingD ? (
          <div className="flex justify-center py-10"><Spinner size={28} /></div>
        ) : dossiers.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-semibold mb-1" style={{ color: TX }}>Aucun dossier en attente</p>
            <p className="text-xs" style={{ color: TL }}>Les dossiers au statut "Prélèvement fait" apparaissent ici.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5 space-y-4">

            {/* Sélection dossier */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Dossier *</label>
              <select value={dossierId} onChange={e => handleDossierChange(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: BD, color: TX }}>
                {dossiers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.ref} — {d.patient?.prenom} {d.patient?.nom}
                  </option>
                ))}
              </select>
              {dossierChoisi?.finances && (
                <div className="mt-1.5 flex gap-4 text-[11px]" style={{ color: TL }}>
                  <span>Total : <strong>{dossierChoisi.finances.totalFacture.toLocaleString('fr-FR')} XOF</strong></span>
                  <span>Assurance : <strong>{dossierChoisi.finances.partAssurance.toLocaleString('fr-FR')} XOF</strong></span>
                  <span style={{ color: AC }}>À encaisser : <strong>{dossierChoisi.finances.partPatient.toLocaleString('fr-FR')} XOF</strong></span>
                </div>
              )}
            </div>

            {/* Montant */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>
                Montant * <span className="font-normal" style={{ color: TL }}>(XOF)</span>
              </label>
              <input type="number" min="1" value={montant}
                onChange={e => setMontant(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none font-mono"
                style={{ borderColor: BD, color: TX }} placeholder="ex. : 9000" />
            </div>

            {/* Mode de paiement */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: TX }}>Mode de paiement *</label>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map(m => (
                  <button key={m.value} type="button" onClick={() => setMode(m.value)}
                    className="py-2 px-3 rounded-lg text-xs font-semibold border transition-all"
                    style={{
                      background:  mode === m.value ? P : '#fff',
                      color:       mode === m.value ? '#fff' : TL,
                      borderColor: mode === m.value ? P : BD,
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Référence */}
            {mode !== 'CASH' && (
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>
                  Référence <span className="font-normal" style={{ color: TL }}>(optionnel)</span>
                </label>
                <input value={reference} onChange={e => setReference(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BD, color: TX }} placeholder="Numéro de transaction" />
              </div>
            )}

            {/* Récap */}
            {montant && Number(montant) > 0 && (
              <div className="rounded-xl p-3 text-center" style={{ background: `${AC}15` }}>
                <p className="text-xs mb-0.5" style={{ color: TL }}>Montant enregistré</p>
                <p className="text-xl font-bold" style={{ color: AC }}>
                  {Number(montant).toLocaleString('fr-FR')} XOF
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: TL }}>
                  {MODES.find(m => m.value === mode)?.label}
                </p>
              </div>
            )}

            {error && <p className="text-xs" style={{ color: '#E05C5C' }}>{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="text-sm font-semibold px-4 py-2 rounded-lg border"
                style={{ borderColor: BD, color: TL }}>
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
                style={{ background: P }}>
                {saving ? 'Enregistrement…' : 'Enregistrer le paiement'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function Paiements() {
  const [paiements, setPaiements]   = useState<Paiement[]>([])
  const [stats, setStats]           = useState<any>(null)
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [toast, setToast]           = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([paiementsService.list({ page, limit: 20 }), paiementsService.stats()])
      .then(([list, s]) => { setPaiements(list.data); setTotal(list.total); setStats(s) })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const confirmer = async (id: string) => {
    setConfirming(id)
    try { await paiementsService.confirmer(id); load() }
    finally { setConfirming(null) }
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: BG }}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: '#2CB67D' }}>{toast}</div>
      )}

      {showModal && (
        <ModalPaiement
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); showMsg('Paiement enregistré') }}
        />
      )}

      <Topbar
        title="Paiements"
        subtitle={`${total} paiements`}
        actions={
          <button onClick={() => setShowModal(true)}
            className="text-[13px] font-semibold px-4 py-1.5 rounded-lg text-white"
            style={{ background: P }}>
            + Enregistrer un paiement
          </button>
        }
      />

      <div className="p-7 flex-1">
        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-4 gap-3.5 mb-5">
            {[
              { label: 'Total encaissé', value: `${stats.totalEncaisse.toLocaleString('fr-FR')} XOF`, icon: '💰' },
              { label: 'Aujourd\'hui',   value: `${stats.jour.montant.toLocaleString('fr-FR')} XOF`,  icon: '📅' },
              { label: 'Ce mois',        value: `${stats.mois.montant.toLocaleString('fr-FR')} XOF`,  icon: '📆' },
              { label: 'En attente',     value: stats.nbEnAttente,                                     icon: '⏳' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white rounded-[13px] border p-4 flex items-center gap-3"
                style={{ borderColor: BD }}>
                <div className="text-2xl">{icon}</div>
                <div>
                  <div className="text-[18px] font-extrabold" style={{ color: TX }}>{value}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: TL }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Répartition par mode */}
        {stats?.parMode?.length > 0 && (
          <div className="bg-white rounded-[13px] border p-4 mb-5 flex flex-wrap gap-4"
            style={{ borderColor: BD }}>
            {stats.parMode.map((m: any) => (
              <div key={m.mode} className="flex items-center gap-2 text-sm">
                <span>{MODES_LABELS[m.mode] ?? m.mode}</span>
                <span className="font-bold" style={{ color: P }}>{m.montant.toLocaleString('fr-FR')} XOF</span>
                <span className="text-xs" style={{ color: TL }}>({m.count})</span>
              </div>
            ))}
          </div>
        )}

        {/* Tableau */}
        <div className="bg-white rounded-[13px] border overflow-hidden" style={{ borderColor: BD }}>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: BG }}>
                  {['Dossier', 'Patient', 'Mode', 'Montant', 'Part assurance', 'Statut', 'Date', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] uppercase tracking-[0.7px] font-semibold"
                      style={{ color: TL }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id} className="border-t hover:bg-[#F5F7F6]/50" style={{ borderColor: BD }}>
                    <td className="px-4 py-3 text-[12px] font-mono font-semibold" style={{ color: P }}>
                      {p.dossier?.ref ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: TX }}>
                      {p.dossier?.patient ? `${p.dossier.patient.prenom} ${p.dossier.patient.nom}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: TL }}>
                      {MODES_LABELS[p.mode] ?? p.mode}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold" style={{ color: TX }}>
                      {p.montant.toLocaleString('fr-FR')} XOF
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: TL }}>
                      {p.finances ? `${p.finances.partAssurance.toLocaleString('fr-FR')} XOF` : '—'}
                    </td>
                    <td className="px-4 py-3"><BadgePaiement statut={p.statut} /></td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: TL }}>
                      {p.encaisseA
                        ? new Date(p.encaisseA).toLocaleDateString('fr-FR')
                        : new Date(p.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      {p.statut === 'EN_ATTENTE' && (
                        <button onClick={() => confirmer(p.id)} disabled={confirming === p.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
                          style={{ background: '#2CB67D' }}>
                          {confirming === p.id ? <Spinner size={12} /> : '✓'} Confirmer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {paiements.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-sm" style={{ color: TL }}>
                      Aucun paiement trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-[13px]"
              style={{ borderColor: BD, color: TL }}>
              <span>{total} paiements</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded border text-xs disabled:opacity-40"
                  style={{ borderColor: BD }}>← Précédent</button>
                <span className="px-2 py-1 text-xs font-semibold">Page {page}</span>
                <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded border text-xs disabled:opacity-40"
                  style={{ borderColor: BD }}>Suivant →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
