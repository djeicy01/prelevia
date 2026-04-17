import { useEffect, useState, useCallback } from 'react'
import Topbar from '../components/layout/Topbar'
import Spinner from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { agentsService } from '../services/agents'
import type { Agent, AgentStatut } from '../types'

// ── Design tokens ─────────────────────────────────────────────
const P  = '#0A6E5C'
const AC = '#F4A726'
const BD = '#D4E5E1'
const TX = '#1A2B26'
const TL = '#5C7A74'
const BG = '#F5F7F6'
const DR = '#E05C5C'

const COMMUNES = ['Yopougon','Cocody','Abobo','Attécoubé','Adjamé','Plateau','Marcory','Koumassi','Port-Bouët','Treichville']

const STATUT_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIF:        'success',
  INACTIF:      'neutral',
  SUSPENDU:     'danger',
  EN_FORMATION: 'warning',
}

// ── Types formulaire ──────────────────────────────────────────
interface AgentForm {
  prenom:         string
  nom:            string
  telephone:      string
  commune:        string
  email:          string
  tauxCommission: string
}

const FORM_VIDE: AgentForm = { prenom: '', nom: '', telephone: '', commune: 'Yopougon', email: '', tauxCommission: '15' }

// ── Modal création / modification ─────────────────────────────
function ModalAgent({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Agent
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm]   = useState<AgentForm>(
    initial
      ? {
          prenom:         initial.prenom,
          nom:            initial.nom,
          telephone:      initial.telephone,
          commune:        initial.commune,
          email:          initial.email ?? '',
          tauxCommission: String(Math.round(initial.tauxCommission * 100)),
        }
      : FORM_VIDE
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const set = (k: keyof AgentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.prenom || !form.nom || !form.telephone) {
      setError('Prénom, nom et téléphone sont obligatoires')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      prenom:         form.prenom.toUpperCase().trim(),
      nom:            form.nom.toUpperCase().trim(),
      telephone:      form.telephone.trim(),
      commune:        form.commune,
      email:          form.email.trim() || undefined,
      tauxCommission: Number(form.tauxCommission) / 100,
    }
    try {
      if (initial) {
        await agentsService.update(initial.id, payload)
      } else {
        await agentsService.create(payload)
      }
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4"
        style={{ border: `1px solid ${BD}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BD }}>
          <h2 className="font-bold text-base" style={{ color: TX }}>
            {initial ? 'Modifier l\'agent' : 'Nouvel agent'}
          </h2>
          <button onClick={onClose} className="text-xl" style={{ color: TL }}>×</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Prénom *</label>
              <input value={form.prenom}
                onChange={e => setForm(f => ({ ...f, prenom: e.target.value.toUpperCase() }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none uppercase"
                style={{ borderColor: BD, color: TX }} placeholder="KOUASSI" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Nom *</label>
              <input value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value.toUpperCase() }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none uppercase"
                style={{ borderColor: BD, color: TX }} placeholder="BERNARD" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Téléphone *</label>
            <input value={form.telephone} onChange={set('telephone')}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: BD, color: TX }} placeholder="+225 07 00 00 00" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Commune</label>
              <select value={form.commune} onChange={set('commune')}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: BD, color: TX }}>
                {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Commission (%)</label>
              <input type="number" min="0" max="100" value={form.tauxCommission} onChange={set('tauxCommission')}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: BD, color: TX }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>
              Email <span className="font-normal" style={{ color: TL }}>(optionnel)</span>
            </label>
            <input value={form.email} onChange={set('email')} type="email"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: BD, color: TX }} placeholder="agent@prelevia.ci" />
          </div>

          {error && <p className="text-xs" style={{ color: DR }}>{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="text-sm font-semibold px-4 py-2 rounded-lg border"
              style={{ borderColor: BD, color: TL }}>
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ background: P }}>
              {saving ? 'Enregistrement…' : (initial ? 'Enregistrer' : 'Créer l\'agent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal confirmation suppression ────────────────────────────
function ModalSupprimer({
  agent,
  onClose,
  onConfirm,
}: {
  agent: Agent
  onClose: () => void
  onConfirm: (message: string) => Promise<void>
}) {
  const [message, setMessage] = useState('')
  const [saving, setSaving]   = useState(false)

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    try { await onConfirm(message) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4"
        style={{ border: `1px solid ${BD}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BD }}>
          <h2 className="font-bold text-base" style={{ color: TX }}>Désactiver l'agent</h2>
          <button onClick={onClose} className="text-xl" style={{ color: TL }}>×</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <p className="text-sm" style={{ color: TL }}>
            L'agent <strong style={{ color: TX }}>{agent.prenom} {agent.nom}</strong> sera
            désactivé (statut → <strong>INACTIF</strong>). Il ne recevra plus de missions.
          </p>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>
              Motif / message <span className="font-normal" style={{ color: TL }}>(optionnel)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Ex. : Fin de contrat, indisponibilité prolongée…"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ borderColor: BD, color: TX }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="text-sm font-semibold px-4 py-2 rounded-lg border"
              style={{ borderColor: BD, color: TL }}>
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ background: DR }}>
              {saving ? 'Désactivation…' : 'Confirmer la désactivation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function Agents() {
  const [agents, setAgents]   = useState<Agent[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [modalCreate, setModalCreate]   = useState(false)
  const [modalEdit, setModalEdit]       = useState<Agent | null>(null)
  const [modalDelete, setModalDelete]   = useState<Agent | null>(null)
  const [toast, setToast]               = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    agentsService.list({ search: search || undefined, limit: 50 } as any)
      .then(res => { setAgents(res.data); setTotal(res.total) })
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  async function handleDelete(agent: Agent, _message: string) {
    await agentsService.update(agent.id, { statut: 'INACTIF' as AgentStatut })
    setModalDelete(null)
    load()
    showToast(`${agent.prenom} ${agent.nom} désactivé`)
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: BG }}>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: '#2CB67D' }}>{toast}</div>
      )}

      {/* Modals */}
      {modalCreate && (
        <ModalAgent
          onClose={() => setModalCreate(false)}
          onSaved={() => { setModalCreate(false); load(); showToast('Agent créé avec succès') }}
        />
      )}
      {modalEdit && (
        <ModalAgent
          initial={modalEdit}
          onClose={() => setModalEdit(null)}
          onSaved={() => { setModalEdit(null); load(); showToast('Agent mis à jour') }}
        />
      )}
      {modalDelete && (
        <ModalSupprimer
          agent={modalDelete}
          onClose={() => setModalDelete(null)}
          onConfirm={(msg) => handleDelete(modalDelete, msg)}
        />
      )}

      <Topbar
        title="Agents"
        subtitle={`${total} agents`}
        actions={
          <div className="flex items-center gap-2">
            <input
              className="text-[13px] px-3 py-1.5 rounded-lg border outline-none"
              style={{ borderColor: BD, background: '#fff' }}
              placeholder="Rechercher un agent..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              onClick={() => setModalCreate(true)}
              className="text-[13px] font-semibold px-4 py-1.5 rounded-lg text-white"
              style={{ background: P }}>
              + Ajouter un agent
            </button>
          </div>
        }
      />

      <div className="p-7 flex-1">
        {loading ? (
          <div className="flex justify-center mt-20"><Spinner size={28} /></div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {agents.map(agent => (
              <div key={agent.id}
                className="bg-white rounded-[13px] border p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
                style={{ borderColor: BD }}>

                {/* Avatar */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: agent.statut === 'INACTIF' ? '#9CA3AF' : P }}>
                  {agent.prenom[0]}{agent.nom[0]}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px]" style={{ color: TX }}>
                    {agent.prenom} {agent.nom}
                  </div>
                  <div className="text-[12px] mt-0.5 flex items-center gap-3" style={{ color: TL }}>
                    <span>📞 {agent.telephone}</span>
                    <span>📍 {agent.commune}</span>
                    <span>Commission : {(agent.tauxCommission * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* KPIs du jour */}
                <div className="flex items-center gap-5 text-center">
                  <div>
                    <div className="text-[18px] font-extrabold" style={{ color: P }}>
                      {(agent.revenuJour ?? 0).toLocaleString('fr-FR')}
                    </div>
                    <div className="text-[10px]" style={{ color: TL }}>XOF aujourd'hui</div>
                  </div>
                  <div>
                    <div className="text-[18px] font-extrabold" style={{ color: TX }}>
                      {agent.nbPrelevJour ?? 0}
                    </div>
                    <div className="text-[10px]" style={{ color: TL }}>prélèvements</div>
                  </div>
                  {(agent.stocksEnAlerte ?? 0) > 0 && (
                    <div>
                      <div className="text-[18px] font-extrabold" style={{ color: DR }}>
                        {agent.stocksEnAlerte}
                      </div>
                      <div className="text-[10px]" style={{ color: DR }}>alertes stock</div>
                    </div>
                  )}
                </div>

                {/* Statut */}
                <Badge variant={STATUT_VARIANT[agent.statut] ?? 'neutral'}>
                  {agent.statut}
                </Badge>

                {/* Missions actives */}
                {agent.missions && agent.missions.length > 0 && (
                  <div className="text-[11px] px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(10,110,92,0.08)', color: P }}>
                    {agent.missions.length} mission(s)
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setModalEdit(agent)}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ borderColor: BD, color: TL, background: '#fff' }}>
                    Modifier
                  </button>
                  {agent.statut !== 'INACTIF' && (
                    <button
                      onClick={() => setModalDelete(agent)}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: `${DR}55`, color: DR, background: `${DR}08` }}>
                      Désactiver
                    </button>
                  )}
                </div>
              </div>
            ))}

            {agents.length === 0 && (
              <div className="text-center py-16 text-sm" style={{ color: TL }}>
                Aucun agent trouvé
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
