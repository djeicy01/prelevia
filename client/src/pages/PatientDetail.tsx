import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { dossiersService } from '../services/dossiers'
import { agentsService } from '../services/agents'
import api from '../services/api'
import type { Dossier, Agent, DossierStatut, AssuranceStatut } from '../types'

// ── Design tokens ─────────────────────────────────────────────
const P  = '#0A6E5C'
const PD = '#064D40'
const AC = '#F4A726'
const BD = '#D4E5E1'
const TX = '#1A2B26'
const TL = '#5C7A74'
const BG = '#F5F7F6'

// ── Labels / couleurs statuts ─────────────────────────────────
const STATUT_DOSSIER: Record<DossierStatut, { label: string; bg: string; color: string }> = {
  EN_ATTENTE:            { label: 'En attente',          bg: '#FEF3C7', color: '#92400E' },
  PRET_PRELEVEMENT:      { label: 'Prêt prélèvement',    bg: '#DBEAFE', color: '#1E40AF' },
  PRELEVEMENT_FAIT:      { label: 'Prélevé',              bg: '#E0E7FF', color: '#3730A3' },
  PAYE:                  { label: 'Payé',                 bg: '#D1FAE5', color: '#065F46' },
  RESULTATS_EN_COURS:    { label: 'Résultats en cours',   bg: '#FEF9C3', color: '#713F12' },
  RESULTATS_DISPONIBLES: { label: 'Résultats disponibles',bg: '#D1FAE5', color: '#065F46' },
  ARCHIVE:               { label: 'Archivé',              bg: '#F3F4F6', color: '#6B7280' },
}

const STATUT_ASSURANCE: Record<string, { label: string; bg: string; color: string }> = {
  DOCS_COLLECTES:  { label: 'Docs collectés',    bg: '#FEF3C7', color: '#92400E' },
  SOUMIS_LABO:     { label: 'Soumis au labo',    bg: '#DBEAFE', color: '#1E40AF' },
  EN_VALIDATION:   { label: 'En validation',     bg: '#FDE68A', color: '#92400E' },
  VALIDE_TOTAL:    { label: 'Validé total',       bg: '#D1FAE5', color: '#065F46' },
  VALIDE_PARTIEL:  { label: 'Validé partiel',     bg: '#E0E7FF', color: '#3730A3' },
  REFUSE:          { label: 'Refusé',             bg: '#FEE2E2', color: '#991B1B' },
}

const ASSURANCE_STEPS: AssuranceStatut[] = [
  'DOCS_COLLECTES', 'SOUMIS_LABO', 'EN_VALIDATION', 'VALIDE_TOTAL',
]

// ── Composants utilitaires ────────────────────────────────────
function StatutBadge({ statut }: { statut: DossierStatut }) {
  const s = STATUT_DOSSIER[statut] ?? { label: statut, bg: BG, color: TL }
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function AssuranceBadge({ statut }: { statut: string }) {
  const s = STATUT_ASSURANCE[statut] ?? { label: statut, bg: BG, color: TL }
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

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
      <span className="text-sm font-medium text-right" style={{ color: TX }}>{value}</span>
    </div>
  )
}

// ── Modal assignation agent ───────────────────────────────────
function ModalAssignerAgent({
  dossierId,
  onClose,
  onDone,
}: { dossierId: string; onClose: () => void; onDone: () => void }) {
  const [agents, setAgents]   = useState<Agent[]>([])
  const [chosen, setChosen]   = useState('')
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    agentsService.list({ statut: 'ACTIF', limit: 50 } as any)
      .then(r => setAgents(r.data))
      .catch(() => {})
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!chosen) { setError('Choisissez un agent.'); return }
    setSaving(true)
    try {
      // Crée une mission pour cet agent avec ce dossier
      await api.post('/missions', {
        agentId:    chosen,
        dossierIds: [dossierId],
        date,
      })
      // Passe le dossier en PRET_PRELEVEMENT (déjà fait côté API missions)
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
          <h2 className="font-bold text-base" style={{ color: TX }}>Assigner un agent</h2>
          <button onClick={onClose} className="text-xl" style={{ color: TL }}>×</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Agent</label>
            <select value={chosen} onChange={e => { setChosen(e.target.value); setError(null) }}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: BD, color: TX }}>
              <option value="">-- Choisir un agent --</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.prenom} {a.nom} — {a.commune}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Date de mission</label>
            <input type="date" value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: BD, color: TX }} />
          </div>
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
              {saving ? 'Assignation…' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function PatientDetail() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [toast, setToast]     = useState<string | null>(null)
  // id → nom pour résoudre assuranceId dans noteAdmin
  const [assurancesMap, setAssurancesMap] = useState<Record<string, string>>({})

  // Charger la liste des assurances une fois pour la résolution noteAdmin
  useEffect(() => {
    api.get('/assurances')
      .then(r => {
        const list: Array<{ id: string; nom: string }> = r.data.assurances ?? r.data ?? []
        const map: Record<string, string> = {}
        list.forEach(a => { map[a.id] = a.nom })
        setAssurancesMap(map)
      })
      .catch(() => {})
  }, [])

  function load() {
    if (!id) return
    setLoading(true)
    dossiersService.get(id)
      .then(setDossier)
      .catch(() => setDossier(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  function showMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: BD, borderTopColor: P }} />
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-sm" style={{ color: TL }}>Dossier introuvable.</p>
        <button onClick={() => navigate('/patients')}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
          style={{ background: P }}>
          ← Retour à la liste
        </button>
      </div>
    )
  }

  const { patient, examens = [], paiements = [], mission, finances } = dossier

  // Calcul local si finances absent (fallback)
  const totalFacture  = finances?.totalFacture  ?? examens.reduce((s, e) => s + e.tarif, 0)
  const partAssurance = finances?.partAssurance ?? 0
  const partPatient   = finances?.partPatient   ?? totalFacture

  const assuranceStepIdx = dossier.statutAssurance
    ? ASSURANCE_STEPS.indexOf(dossier.statutAssurance as AssuranceStatut)
    : -1

  // ── Parse noteAdmin une seule fois pour tout le composant ──────
  const noteAdminData: Record<string, unknown> = (() => {
    try { return dossier.noteAdmin ? JSON.parse(dossier.noteAdmin) : {} }
    catch { return {} }
  })()

  // Assurance réellement liée : patient.assurance OU assuranceId résolu dans la map
  // OU assureur non-partenaire déclaré dans noteAdmin
  const resolvedAssuranceNom = noteAdminData.assuranceId
    ? assurancesMap[noteAdminData.assuranceId as string] ?? null
    : null
  const hasAssurance =
    !!patient?.assurance ||
    !!resolvedAssuranceNom ||
    !!(noteAdminData.assuranceNonPartenaireNom as string | undefined)

  // ── Rendu note admin (utilise noteAdminData pré-parsé) ─────────
  function renderNoteAdmin() {
    if (!dossier.noteAdmin) return null

    // Si JSON invalide → afficher tel quel
    if (typeof noteAdminData !== 'object' || Array.isArray(noteAdminData)) {
      return <p className="text-sm whitespace-pre-wrap" style={{ color: TX }}>{dossier.noteAdmin}</p>
    }

    const rows: { label: string; value: string }[] = []

    if (noteAdminData.creneauDate) {
      const dateStr = new Date(noteAdminData.creneauDate as string).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      rows.push({ label: 'Créneau', value: `${dateStr}${noteAdminData.creneauHeure ? ` à ${noteAdminData.creneauHeure}` : ''}` })
    }

    // Assurance partenaire : affichée seulement si l'ID est résolu dans la map
    if (resolvedAssuranceNom) {
      rows.push({ label: 'Assurance', value: resolvedAssuranceNom })
    }

    if (noteAdminData.assuranceNonPartenaireNom) {
      rows.push({ label: 'Assurance (non partenaire)', value: noteAdminData.assuranceNonPartenaireNom as string })
    }

    // Autres champs inconnus → liste clé/valeur
    const knownKeys = new Set(['creneauDate', 'creneauHeure', 'assuranceId', 'assuranceNonPartenaireNom'])
    for (const [key, val] of Object.entries(noteAdminData)) {
      if (!knownKeys.has(key) && val !== null && val !== undefined && val !== '') {
        rows.push({ label: key, value: String(val) })
      }
    }

    if (rows.length === 0) return <p className="text-sm" style={{ color: TL }}>—</p>
    return (
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.label} className="flex items-start gap-3">
            <span className="text-xs font-semibold shrink-0 w-36" style={{ color: TL }}>{r.label}</span>
            <span className="text-sm" style={{ color: TX }}>{r.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: BG }}>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: '#2CB67D' }}>
          {toast}
        </div>
      )}

      {/* Modal assignation */}
      {showAssign && (
        <ModalAssignerAgent
          dossierId={dossier.id}
          onClose={() => setShowAssign(false)}
          onDone={() => { setShowAssign(false); load(); showMsg('Agent assigné avec succès') }}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b flex items-center justify-between px-7 h-[58px]"
        style={{ borderColor: BD }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/patients')}
            className="text-sm font-medium flex items-center gap-1"
            style={{ color: TL }}>
            ← Dossiers
          </button>
          <span style={{ color: BD }}>|</span>
          <span className="text-sm font-mono font-bold" style={{ color: P }}>{dossier.ref}</span>
          <StatutBadge statut={dossier.statut} />
        </div>
        <div className="flex items-center gap-2">
          {dossier.statut === 'EN_ATTENTE' && (
            <button
              disabled={examens.length === 0}
              title={examens.length === 0 ? 'Ajoutez des examens avant de marquer le dossier comme prêt' : undefined}
              onClick={async () => {
                await dossiersService.update(dossier.id, { statut: 'PRET_PRELEVEMENT' as DossierStatut })
                load()
                showMsg('Dossier marqué prêt pour prélèvement')
              }}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: examens.length === 0 ? '#9CA3AF' : P }}>
              Marquer prêt
            </button>
          )}
          {dossier.statut === 'PRET_PRELEVEMENT' && !mission && (
            <button
              onClick={() => setShowAssign(true)}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
              style={{ background: AC }}>
              Assigner un agent
            </button>
          )}
        </div>
      </header>

      <div className="p-6 grid grid-cols-1 gap-5 max-w-5xl mx-auto w-full lg:grid-cols-3">

        {/* Colonne gauche — Patient + Finances */}
        <div className="space-y-5 lg:col-span-1">

          {/* Infos patient */}
          <Card title="Patient">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: PD }}>
                {patient?.prenom?.[0]}{patient?.nom?.[0]}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: TX }}>
                  {patient?.prenom} {patient?.nom}
                </p>
                <p className="text-xs" style={{ color: TL }}>{patient?.ref}</p>
              </div>
            </div>
            <Row label="Téléphone"  value={patient?.telephone ?? '—'} />
            <Row label="Commune"    value={patient?.commune   ?? '—'} />
            <Row label="Assurance"  value={
              patient?.assurance
                ? <span className="font-semibold" style={{ color: P }}>{patient.assurance.nom}</span>
                : <span style={{ color: TL }}>Aucune</span>
            } />
            {patient?.assurance && (
              <Row label="Taux couverture" value={`${patient.assurance.tauxCouverture}%`} />
            )}
          </Card>

          {/* Finances */}
          <Card title="Finances">
            <Row label="Total facturé"
              value={<span className="font-bold">{totalFacture.toLocaleString()} XOF</span>} />
            <Row label="Total à payer"
              value={
                <span className="font-bold text-base" style={{ color: TX }}>
                  {partPatient.toLocaleString()} XOF
                </span>
              } />
            {!!dossier.statutAssurance && hasAssurance && (
              <p className="text-xs mt-2 pt-2 border-t" style={{ borderColor: BD, color: TL }}>
                Remboursement possible après validation assurance.
              </p>
            )}
            {paiements.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: BD }}>
                {paiements.map(p => (
                  <div key={p.id} className="flex justify-between text-xs py-1">
                    <span style={{ color: TL }}>{p.mode.replace('_', ' ')} — {p.statut}</span>
                    <span style={{ color: TX }}>{p.montant.toLocaleString()} XOF</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Mission assignée */}
          {mission && (
            <Card title="Agent assigné">
              <Row label="Agent"   value={`${mission.agent?.prenom} ${mission.agent?.nom}`} />
              <Row label="Mission" value={<span className="font-mono text-xs">{mission.ref}</span>} />
              <Row label="Date"    value={new Date(mission.date).toLocaleDateString('fr-FR')} />
              <Row label="Statut"  value={mission.statut.replace('_', ' ')} />
            </Card>
          )}
        </div>

        {/* Colonne droite — Examens + Workflow */}
        <div className="space-y-5 lg:col-span-2">

          {/* Examens */}
          <Card title={`Examens (${examens.length})`}>
            {examens.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: TL }}>Aucun examen</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: BG }}>
                    {['Code', 'Examen', 'Tarif', ...(dossier.statutAssurance ? ['Couverture', 'Part patient'] : [])].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: TL }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {examens.map((e, i) => {
                    // La part patient n'est calculable qu'après validation assurance
                    const assuranceValidee =
                      dossier.statutAssurance === 'VALIDE_TOTAL' ||
                      dossier.statutAssurance === 'VALIDE_PARTIEL'
                    const couvert = e.couvert === true
                    const partPat = couvert ? Math.round(e.tarif * 0.2) : e.tarif
                    // Afficher la part seulement si assurance validée et couverture connue
                    const showPartPat = assuranceValidee && e.couvert !== null && e.couvert !== undefined
                    return (
                      <tr key={e.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${BD}` }}>
                        <td className="px-3 py-2.5 font-mono text-xs font-bold" style={{ color: P }}>
                          {e.catalogue?.code ?? '—'}
                        </td>
                        <td className="px-3 py-2.5 font-medium" style={{ color: TX }}>
                          {e.catalogue?.nom ?? '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs">
                          {e.tarif.toLocaleString()}
                        </td>
                        {dossier.statutAssurance && (
                          <td className="px-3 py-2.5">
                            {e.couvert === null || e.couvert === undefined ? (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#FEF3C7', color: '#92400E' }}>En attente</span>
                            ) : couvert ? (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#D1FAE5', color: '#065F46' }}>Couvert 80%</span>
                            ) : (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#FEE2E2', color: '#991B1B' }}>Non couvert</span>
                            )}
                          </td>
                        )}
                        {dossier.statutAssurance && (
                          <td className="px-3 py-2.5 text-right font-mono text-xs font-bold" style={{ color: showPartPat ? TX : TL }}>
                            {showPartPat ? partPat.toLocaleString() : '—'}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>

          {/* Workflow assurance */}
          {dossier.statutAssurance && (
            <Card title="Workflow assurance">
              <div className="flex items-center gap-0 mb-6">
                {ASSURANCE_STEPS.map((step, i) => {
                  const done    = i < assuranceStepIdx
                  const current = i === assuranceStepIdx
                  const s       = STATUT_ASSURANCE[step]
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1"
                          style={{
                            background: done ? P : current ? AC : BD,
                            color: done || current ? '#fff' : TL,
                          }}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className="text-[10px] text-center leading-tight" style={{ color: current ? TX : TL }}>
                          {s.label}
                        </span>
                      </div>
                      {i < ASSURANCE_STEPS.length - 1 && (
                        <div className="h-0.5 flex-1 mx-1 mb-5" style={{ background: i < assuranceStepIdx ? P : BD }} />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <AssuranceBadge statut={dossier.statutAssurance} />
                {dossier.statutAssurance !== 'VALIDE_TOTAL' && dossier.statutAssurance !== 'REFUSE' && (
                  <button
                    onClick={async () => {
                      const next: Record<string, AssuranceStatut> = {
                        DOCS_COLLECTES: 'SOUMIS_LABO',
                        SOUMIS_LABO:    'EN_VALIDATION',
                        EN_VALIDATION:  'VALIDE_TOTAL',
                      }
                      const n = next[dossier.statutAssurance!]
                      if (!n) return
                      await dossiersService.updateAssurance(dossier.id, n)
                      load()
                      showMsg(`Assurance → ${STATUT_ASSURANCE[n].label}`)
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                    style={{ background: P }}>
                    Avancer →
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Historique */}
          <Card title="Historique">
            <div className="space-y-2">
              {[
                { date: dossier.createdAt,   label: 'Dossier créé',             icon: '📋', color: TL },
                ...(dossier.statutAssurance ? [{ date: dossier.createdAt, label: `Assurance : ${STATUT_ASSURANCE[dossier.statutAssurance]?.label ?? dossier.statutAssurance}`, icon: '🛡️', color: P }] : []),
                ...(mission ? [{ date: mission.createdAt, label: `Agent assigné : ${mission.agent?.prenom} ${mission.agent?.nom}`, icon: '🏍️', color: AC }] : []),
                ...(paiements.filter(p => p.statut === 'CONFIRME').map(p => ({
                  date: p.encaisseA ?? p.createdAt,
                  label: `Paiement encaissé — ${p.montant.toLocaleString()} XOF (${p.mode.replace('_', ' ')})`,
                  icon: '💳',
                  color: '#2CB67D',
                }))),
              ]
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((e, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0"
                  style={{ borderColor: BD }}>
                  <span className="text-base mt-0.5">{e.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: TX }}>{e.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: TL }}>
                      {new Date(e.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Note admin */}
          {dossier.noteAdmin && (
            <Card title="Note administrative">
              {renderNoteAdmin()}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
