import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { missionsService } from '../services/missions'
import type { Mission, MissionStatut, ModePaiement } from '../types'

// ── Design tokens ─────────────────────────────────────────────
const P  = '#0A6E5C'
const AC = '#F4A726'
const BD = '#D4E5E1'
const TX = '#1A2B26'
const TL = '#5C7A74'
const BG = '#F5F7F6'

// ── Statut config ─────────────────────────────────────────────
const STATUT_CFG: Record<MissionStatut, { label: string; bg: string; color: string }> = {
  PLANIFIEE:        { label: 'Planifiée',          bg: '#DBEAFE', color: '#1E40AF' },
  EN_ROUTE:         { label: 'En route',            bg: '#FEF3C7', color: '#92400E' },
  ARRIVEE:          { label: 'Arrivée',             bg: '#E0E7FF', color: '#3730A3' },
  PRELEVEMENT_FAIT: { label: 'Prélèvement fait',   bg: '#FDE68A', color: '#92400E' },
  TERMINEE:         { label: 'Terminée',            bg: '#D1FAE5', color: '#065F46' },
}

const ACTION: Partial<Record<MissionStatut, { label: string; bg: string; next: MissionStatut }>> = {
  PLANIFIEE:        { label: '→ En route',          bg: '#3B82F6', next: 'EN_ROUTE'         },
  EN_ROUTE:         { label: '→ Arrivée',            bg: '#F97316', next: 'ARRIVEE'          },
  ARRIVEE:          { label: '→ Prélèvement fait',  bg: '#F97316', next: 'PRELEVEMENT_FAIT' },
  PRELEVEMENT_FAIT: { label: '→ Terminer',           bg: '#2CB67D', next: 'TERMINEE'         },
}

const MODES: { value: ModePaiement; label: string }[] = [
  { value: 'CASH',         label: 'Espèces' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'MTN_MONEY',    label: 'MTN Money' },
  { value: 'WAVE',         label: 'Wave' },
]

// ── Helpers ───────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-5" style={{ borderColor: BD }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: TX }}>{title}</h3>
      {children}
    </div>
  )
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: BD }}>
      <span className="text-xs" style={{ color: TL }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: TX }}>{value}</span>
    </div>
  )
}

// ── Modal encaissement ────────────────────────────────────────
function ModalEncaissement({
  mission,
  onClose,
  onDone,
}: { mission: Mission; onClose: () => void; onDone: () => void }) {
  const dossiers = mission.dossiers ?? []
  const [dossierId, setDossierId] = useState(dossiers[0]?.id ?? '')
  const [mode, setMode]           = useState<ModePaiement>('CASH')
  const [reference, setReference] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const dossierChoisi = dossiers.find(d => d.id === dossierId)
  const partPatient   = dossierChoisi?.finances?.partPatient
    ?? (dossierChoisi?.examens ?? []).reduce((s, e) => s + (e.couvert ? Math.round(e.tarif * 0.2) : e.tarif), 0)

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!dossierId) { setError('Choisissez un dossier'); return }
    setSaving(true)
    try {
      await missionsService.encaissement(mission.id, {
        dossierId, montant: partPatient, mode, reference: reference || undefined,
      })
      onDone()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4"
        style={{ border: `1px solid ${BD}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BD }}>
          <h2 className="font-bold text-base" style={{ color: TX }}>Encaissement</h2>
          <button onClick={onClose} className="text-xl" style={{ color: TL }}>×</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {dossiers.length > 1 && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Dossier</label>
              <select value={dossierId} onChange={e => setDossierId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: BD, color: TX }}>
                {dossiers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.patient?.prenom} {d.patient?.nom} — {d.ref}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Montant à encaisser */}
          <div className="rounded-xl p-4 text-center" style={{ background: `${AC}18` }}>
            <p className="text-xs mb-1" style={{ color: TL }}>Montant à encaisser</p>
            <p className="text-2xl font-bold" style={{ color: AC }}>
              {partPatient.toLocaleString()} XOF
            </p>
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: TX }}>Mode de paiement</label>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(m => (
                <button key={m.value} type="button"
                  onClick={() => setMode(m.value)}
                  className="py-2 rounded-lg text-sm font-semibold border transition-all"
                  style={{
                    background: mode === m.value ? P : '#fff',
                    color:      mode === m.value ? '#fff' : TL,
                    borderColor: mode === m.value ? P : BD,
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mode !== 'CASH' && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>
                Référence transaction <span className="font-normal" style={{ color: TL }}>(optionnel)</span>
              </label>
              <input value={reference} onChange={e => setReference(e.target.value)}
                placeholder="Numéro de transaction"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: BD, color: TX }} />
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
              style={{ background: AC }}>
              {saving ? 'Enregistrement…' : 'Confirmer l\'encaissement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function MissionDetail() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [mission, setMission]     = useState<Mission | null>(null)
  const [loading, setLoading]     = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [showEncaiss, setShowEncaiss] = useState(false)
  const [toast, setToast]         = useState<string | null>(null)

  function load() {
    if (!id) return
    setLoading(true)
    missionsService.get(id)
      .then(setMission)
      .catch(() => setMission(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  function showMsg(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  async function avancer() {
    if (!mission) return
    const cfg = ACTION[mission.statut]
    if (!cfg) return
    setAdvancing(true)
    try {
      await missionsService.updateStatut(mission.id, cfg.next)
      load()
      showMsg(`Mission → ${STATUT_CFG[cfg.next].label}`)
    } finally { setAdvancing(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 rounded-full animate-spin"
        style={{ borderColor: BD, borderTopColor: P }} />
    </div>
  )
  if (!mission) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-sm" style={{ color: TL }}>Mission introuvable.</p>
      <button onClick={() => navigate('/missions')}
        className="text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: P }}>
        ← Retour
      </button>
    </div>
  )

  const cfg         = STATUT_CFG[mission.statut]
  const actionCfg   = ACTION[mission.statut]
  const dossiers    = mission.dossiers ?? []
  const totalFacture = dossiers.reduce((s, d) =>
    s + (d.finances?.totalFacture ?? (d.examens ?? []).reduce((ss, e) => ss + e.tarif, 0)), 0)
  const totalPatient = dossiers.reduce((s, d) =>
    s + (d.finances?.partPatient ?? (d.examens ?? []).reduce((ss, e) => ss + (e.couvert ? Math.round(e.tarif * 0.2) : e.tarif), 0)), 0)

  return (
    <div className="flex flex-col flex-1" style={{ background: BG }}>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: '#2CB67D' }}>{toast}</div>
      )}

      {/* Modal encaissement */}
      {showEncaiss && (
        <ModalEncaissement
          mission={mission}
          onClose={() => setShowEncaiss(false)}
          onDone={() => { setShowEncaiss(false); load(); showMsg('Encaissement enregistré') }}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b flex items-center justify-between px-7 h-[58px]"
        style={{ borderColor: BD }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/missions')}
            className="text-sm font-medium" style={{ color: TL }}>← Missions</button>
          <span style={{ color: BD }}>|</span>
          <span className="text-sm font-mono font-bold" style={{ color: P }}>{mission.ref}</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {mission.statut === 'TERMINEE' && (
            <button onClick={() => setShowEncaiss(true)}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
              style={{ background: AC }}>
              Encaisser
            </button>
          )}
          {actionCfg && (
            <button onClick={avancer} disabled={advancing}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ background: actionCfg.bg }}>
              {advancing ? '…' : actionCfg.label}
            </button>
          )}
        </div>
      </header>

      <div className="p-6 grid grid-cols-1 gap-5 max-w-5xl mx-auto w-full lg:grid-cols-3">

        {/* Colonne gauche */}
        <div className="space-y-5 lg:col-span-1">

          {/* Infos mission */}
          <Card title="Mission">
            <Row label="Référence" value={<span className="font-mono text-xs">{mission.ref}</span>} />
            <Row label="Date"      value={new Date(mission.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })} />
            <Row label="Statut"    value={
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            } />
            <Row label="Dossiers"  value={`${dossiers.length} patient(s)`} />
          </Card>

          {/* Agent */}
          {mission.agent && (
            <Card title="Agent">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: '#064D40' }}>
                  {mission.agent.prenom[0]}{mission.agent.nom[0]}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: TX }}>
                    {mission.agent.prenom} {mission.agent.nom}
                  </p>
                  <p className="text-xs" style={{ color: TL }}>{mission.agent.telephone}</p>
                </div>
              </div>
              <Row label="Commune"    value={mission.agent.commune} />
              <Row label="Commission" value={`${(mission.agent.tauxCommission * 100).toFixed(0)}%`} />
            </Card>
          )}

          {/* Finances */}
          <Card title="Finances">
            <Row label="Total facturé"
              value={<span className="font-bold">{totalFacture.toLocaleString()} XOF</span>} />
            <Row label="Part patient"
              value={<span className="font-bold text-base" style={{ color: AC }}>{totalPatient.toLocaleString()} XOF</span>} />
            <Row label="Commission agent"
              value={`${Math.round(totalPatient * (mission.agent?.tauxCommission ?? 0.15)).toLocaleString()} XOF`} />
          </Card>
        </div>

        {/* Colonne droite — dossiers + examens */}
        <div className="space-y-5 lg:col-span-2">
          {dossiers.length === 0 ? (
            <Card title="Dossiers">
              <p className="text-sm text-center py-4" style={{ color: TL }}>Aucun dossier assigné</p>
            </Card>
          ) : (
            dossiers.map(d => {
              const examens    = d.examens ?? []
              const partPat    = d.finances?.partPatient
                ?? examens.reduce((s, e) => s + (e.couvert ? Math.round(e.tarif * 0.2) : e.tarif), 0)

              return (
                <Card key={d.id} title={`${d.patient?.prenom} ${d.patient?.nom} — ${d.ref}`}>
                  {/* Patient */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4">
                    <span className="text-xs" style={{ color: TL }}>
                      📞 {d.patient?.telephone ?? '—'}
                    </span>
                    <span className="text-xs" style={{ color: TL }}>
                      📍 {d.patient?.commune ?? '—'}
                    </span>
                    {d.patient?.assurance && (
                      <span className="text-xs font-semibold" style={{ color: P }}>
                        🛡 {d.patient.assurance.nom}
                      </span>
                    )}
                  </div>

                  {/* Examens */}
                  {examens.length > 0 && (
                    <table className="w-full text-sm mb-4">
                      <thead>
                        <tr style={{ background: BG }}>
                          {['Code', 'Examen', 'Tarif', 'Couverture', 'Part patient'].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide"
                              style={{ color: TL }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {examens.map((e, i) => {
                          const couvert = e.couvert === true
                          const pp = couvert ? Math.round(e.tarif * 0.2) : e.tarif
                          return (
                            <tr key={e.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${BD}` }}>
                              <td className="px-3 py-2 font-mono text-xs font-bold" style={{ color: P }}>
                                {e.catalogue?.code ?? '—'}
                              </td>
                              <td className="px-3 py-2 font-medium" style={{ color: TX }}>
                                {e.catalogue?.nom ?? '—'}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs">
                                {e.tarif.toLocaleString()}
                              </td>
                              <td className="px-3 py-2">
                                {e.couvert === null || e.couvert === undefined ? (
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#FEF3C7', color: '#92400E' }}>En attente</span>
                                ) : couvert ? (
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#D1FAE5', color: '#065F46' }}>Couvert 80%</span>
                                ) : (
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#FEE2E2', color: '#991B1B' }}>Non couvert</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs font-bold" style={{ color: AC }}>
                                {pp.toLocaleString()}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* Récap financier dossier */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: BD }}>
                    <span className="text-xs" style={{ color: TL }}>À encaisser pour ce patient</span>
                    <span className="text-base font-bold" style={{ color: AC }}>
                      {partPat.toLocaleString()} XOF
                    </span>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
