import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLaboStore } from '../../store/laboStore'

// ── Design tokens ─────────────────────────────────────────────
const P   = '#0A6E5C'
const PD  = '#064D40'
const AC  = '#F4A726'
const BD  = '#D4E5E1'
const TX  = '#1A2B26'
const TL  = '#5C7A74'
const BG  = '#F5F7F6'
const SUC = '#2CB67D'
const ERR = '#E05C5C'

// ── Types ─────────────────────────────────────────────────────
interface Resultat {
  id:             string
  valeur:         string | null
  unite:          string | null
  normaleMin:     string | null
  normaleMax:     string | null
  estCritique:    boolean
  interpretation: string
  commentaire:    string | null
  saisiPar:       string
}
interface Examen {
  id:        string
  tarif:     number
  catalogue: { code: string; nom: string; categorie: string; typesTube: string | null }
  resultat:  Resultat | null
}
interface Dossier {
  id:          string
  ref:         string
  statut:      string
  nbExamens:   number
  nbResultats: number
  patient:     { nom: string; prenom: string; ref: string; commune: string }
  examens:     Examen[]
  mission:     { date: string; ref: string } | null
  createdAt:   string
}

// ── Formulaire par examen ─────────────────────────────────────
interface ExamenForm {
  valeur:         string
  unite:          string
  normaleMin:     string
  normaleMax:     string
  interpretation: string
  commentaire:    string
  estCritique:    boolean
}

const INTERPRETATIONS = ['EN_ATTENTE', 'NORMAL', 'ELEVE', 'BAS', 'CRITIQUE', 'POSITIF', 'NEGATIF']
const INTERP_LABELS: Record<string, string> = {
  EN_ATTENTE: '—', NORMAL: 'Normal', ELEVE: 'Élevé', BAS: 'Bas',
  CRITIQUE: 'Critique', POSITIF: 'Positif', NEGATIF: 'Négatif',
}
const INTERP_COLORS: Record<string, string> = {
  EN_ATTENTE: TL, NORMAL: SUC, ELEVE: '#F97316', BAS: '#3B82F6',
  CRITIQUE: ERR, POSITIF: SUC, NEGATIF: ERR,
}

function emptyForm(e: Examen): ExamenForm {
  return {
    valeur:         e.resultat?.valeur         ?? '',
    unite:          e.resultat?.unite          ?? '',
    normaleMin:     e.resultat?.normaleMin     ?? '',
    normaleMax:     e.resultat?.normaleMax     ?? '',
    interpretation: e.resultat?.interpretation ?? 'EN_ATTENTE',
    commentaire:    e.resultat?.commentaire    ?? '',
    estCritique:    e.resultat?.estCritique    ?? false,
  }
}

// ── Modale saisie résultats ───────────────────────────────────
function ModalResultats({
  dossier,
  token,
  onClose,
  onSaved,
}: {
  dossier: Dossier
  token:   string
  onClose: () => void
  onSaved: () => void
}) {
  const [forms, setForms] = useState<Record<string, ExamenForm>>(
    () => Object.fromEntries(dossier.examens.map(e => [e.id, emptyForm(e)]))
  )
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState<Set<string>>(new Set())
  const [error,  setError]    = useState<string | null>(null)

  function setField(examenId: string, field: keyof ExamenForm, value: string | boolean) {
    setForms(f => ({ ...f, [examenId]: { ...f[examenId], [field]: value } }))
  }

  async function saveAll() {
    setSaving(true)
    setError(null)
    const newSaved = new Set<string>()
    try {
      for (const examen of dossier.examens) {
        const f = forms[examen.id]
        await axios.post('/api/labo/resultats', {
          examenId:       examen.id,
          valeur:         f.valeur      || null,
          unite:          f.unite       || null,
          normaleMin:     f.normaleMin  || null,
          normaleMax:     f.normaleMax  || null,
          interpretation: f.interpretation,
          commentaire:    f.commentaire || null,
          estCritique:    f.estCritique,
        }, { headers: { Authorization: `Bearer ${token}` } })
        newSaved.add(examen.id)
      }
      setSaved(newSaved)
      setTimeout(() => { onSaved(); onClose() }, 800)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const progress = dossier.examens.filter(e => {
    const f = forms[e.id]
    return f.valeur.trim() !== '' || f.interpretation !== 'EN_ATTENTE'
  }).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[92vh]"
        style={{ border: `1px solid ${BD}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BD }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: TX }}>
              {dossier.patient.prenom} {dossier.patient.nom}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: TL }}>
              {dossier.ref} · {dossier.nbExamens} examen(s)
              {dossier.mission && ` · Prélèvement le ${new Date(dossier.mission.date).toLocaleDateString('fr-FR')}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-1 rounded-lg"
              style={{ background: `${P}15`, color: P }}>
              {progress}/{dossier.examens.length} renseigné(s)
            </span>
            <button onClick={onClose} className="text-xl leading-none" style={{ color: TL }}>×</button>
          </div>
        </div>

        {/* Body — examens */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {dossier.examens.map((examen, idx) => {
            const f    = forms[examen.id]
            const done = saved.has(examen.id)
            return (
              <div key={examen.id} className="rounded-xl border p-4"
                style={{ borderColor: done ? SUC : BD, background: done ? '#f0fdf4' : '#fff' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded mr-2"
                      style={{ background: `${P}15`, color: P }}>{examen.catalogue.code}</span>
                    <span className="text-sm font-semibold" style={{ color: TX }}>{examen.catalogue.nom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {examen.catalogue.typesTube && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${AC}20`, color: '#92400E' }}>
                        {examen.catalogue.typesTube}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${INTERP_COLORS[f.interpretation]}20`,
                        color:       INTERP_COLORS[f.interpretation],
                      }}>
                      {INTERP_LABELS[f.interpretation]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Valeur</label>
                    <input
                      value={f.valeur}
                      onChange={e => setField(examen.id, 'valeur', e.target.value)}
                      placeholder="ex : 12.5"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ borderColor: BD, color: TX }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Unité</label>
                    <input
                      value={f.unite}
                      onChange={e => setField(examen.id, 'unite', e.target.value)}
                      placeholder="ex : g/dL, mmol/L"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ borderColor: BD, color: TX }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Norme min</label>
                    <input
                      value={f.normaleMin}
                      onChange={e => setField(examen.id, 'normaleMin', e.target.value)}
                      placeholder="ex : 11.0"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ borderColor: BD, color: TX }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Norme max</label>
                    <input
                      value={f.normaleMax}
                      onChange={e => setField(examen.id, 'normaleMax', e.target.value)}
                      placeholder="ex : 17.0"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ borderColor: BD, color: TX }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Interprétation</label>
                    <select
                      value={f.interpretation}
                      onChange={e => setField(examen.id, 'interpretation', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ borderColor: BD, color: TX }}
                    >
                      {INTERPRETATIONS.map(i => <option key={i} value={i}>{INTERP_LABELS[i]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>Commentaire</label>
                    <input
                      value={f.commentaire}
                      onChange={e => setField(examen.id, 'commentaire', e.target.value)}
                      placeholder="Optionnel"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ borderColor: BD, color: TX }}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 mt-3 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={f.estCritique}
                    onChange={e => setField(examen.id, 'estCritique', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs font-semibold" style={{ color: ERR }}>Valeur critique</span>
                </label>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: BD }}>
          {error && <p className="text-xs font-medium" style={{ color: ERR }}>{error}</p>}
          {!error && <span />}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="text-sm font-semibold px-4 py-2 rounded-lg border"
              style={{ borderColor: BD, color: TL }}>
              Annuler
            </button>
            <button
              onClick={saveAll}
              disabled={saving}
              className="text-sm font-bold px-5 py-2 rounded-lg text-white disabled:opacity-60 transition-opacity"
              style={{ background: P }}
            >
              {saving ? 'Enregistrement…' : 'Valider et soumettre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function LaboDossiers() {
  const navigate      = useNavigate()
  const { token, user, logout } = useLaboStore()

  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Dossier | null>(null)
  const [filterStatut, setFilter] = useState('all')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await axios.get('/api/labo/dossiers', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDossiers(res.data.data)
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout(); navigate('/labo/login', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }, [token, logout, navigate])

  useEffect(() => { load() }, [load])

  const filtered = dossiers.filter(d =>
    filterStatut === 'all' || d.statut === filterStatut
  )

  const STATUT_LABEL: Record<string, string> = {
    PRELEVEMENT_FAIT:      'En attente de saisie',
    RESULTATS_EN_COURS:    'Saisie partielle',
    RESULTATS_DISPONIBLES: 'Terminé',
  }
  const STATUT_COLOR: Record<string, string> = {
    PRELEVEMENT_FAIT:      AC,
    RESULTATS_EN_COURS:    '#3B82F6',
    RESULTATS_DISPONIBLES: SUC,
  }

  function handleSaved() { setSelected(null); load() }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Navbar */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: BD }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-extrabold"
            style={{ background: PD }}>P</div>
          <div>
            <span className="font-bold text-sm" style={{ color: TX }}>Portail Laboratoire</span>
            <span className="text-xs ml-2 px-1.5 py-0.5 rounded font-semibold"
              style={{ background: `${P}15`, color: P }}>Prelevia</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: TL }}>
            {user?.prenom} {user?.nom}
          </span>
          <button
            onClick={() => { logout(); navigate('/labo/login', { replace: true }) }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
            style={{ borderColor: BD, color: TL }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Titre + filtres */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold" style={{ color: TX }}>Dossiers à traiter</h1>
            <p className="text-sm" style={{ color: TL }}>{filtered.length} dossier(s)</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { val: 'all',                  label: 'Tous' },
              { val: 'PRELEVEMENT_FAIT',     label: 'À saisir' },
              { val: 'RESULTATS_EN_COURS',   label: 'En cours' },
            ].map(f => (
              <button key={f.val}
                onClick={() => setFilter(f.val)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  background:   filterStatut === f.val ? PD : '#fff',
                  color:        filterStatut === f.val ? '#fff' : TL,
                  borderColor:  filterStatut === f.val ? PD : BD,
                }}>
                {f.label}
              </button>
            ))}
            <button onClick={load} className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
              style={{ borderColor: BD, color: TL }}>
              ↻ Actualiser
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'À saisir',   val: dossiers.filter(d => d.statut === 'PRELEVEMENT_FAIT').length,     color: AC  },
            { label: 'En cours',   val: dossiers.filter(d => d.statut === 'RESULTATS_EN_COURS').length,   color: '#3B82F6' },
            { label: 'Terminés',   val: dossiers.filter(d => d.statut === 'RESULTATS_DISPONIBLES').length, color: SUC },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border p-4" style={{ borderColor: BD }}>
              <p className="text-2xl font-extrabold" style={{ color: k.color }}>{k.val}</p>
              <p className="text-xs mt-0.5" style={{ color: TL }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Liste des dossiers */}
        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: TL }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: TL }}>Aucun dossier dans cette catégorie</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => {
              const pct = d.nbExamens > 0 ? Math.round((d.nbResultats / d.nbExamens) * 100) : 0
              return (
                <div key={d.id}
                  className="bg-white rounded-xl border p-5 flex items-center gap-4"
                  style={{ borderColor: BD }}>
                  {/* Infos patient */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${STATUT_COLOR[d.statut] ?? TL}20`,
                          color:       STATUT_COLOR[d.statut] ?? TL,
                        }}>
                        {STATUT_LABEL[d.statut] ?? d.statut}
                      </span>
                      <span className="text-xs font-mono" style={{ color: TL }}>{d.ref}</span>
                    </div>
                    <p className="font-bold text-sm" style={{ color: TX }}>
                      {d.patient.prenom} {d.patient.nom}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: TL }}>
                      {d.patient.commune}
                      {d.mission && ` · Prélevé le ${new Date(d.mission.date).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>

                  {/* Examens chips */}
                  <div className="hidden sm:flex flex-wrap gap-1.5 max-w-xs">
                    {d.examens.slice(0, 5).map(e => (
                      <span key={e.id}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: e.resultat ? `${SUC}20` : `${P}12`,
                          color:      e.resultat ? SUC : P,
                        }}>
                        {e.catalogue.code}
                      </span>
                    ))}
                    {d.examens.length > 5 && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${TL}15`, color: TL }}>
                        +{d.examens.length - 5}
                      </span>
                    )}
                  </div>

                  {/* Progression + bouton */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: pct === 100 ? SUC : TX }}>{pct}%</p>
                      <p className="text-xs" style={{ color: TL }}>{d.nbResultats}/{d.nbExamens}</p>
                    </div>
                    {d.statut !== 'RESULTATS_DISPONIBLES' && (
                      <button
                        onClick={() => setSelected(d)}
                        className="text-sm font-bold px-4 py-2 rounded-xl text-white"
                        style={{ background: P }}
                      >
                        Saisir
                      </button>
                    )}
                    {d.statut === 'RESULTATS_DISPONIBLES' && (
                      <span className="text-sm font-semibold px-3 py-1.5 rounded-xl"
                        style={{ background: `${SUC}15`, color: SUC }}>
                        ✓ Terminé
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modale saisie */}
      {selected && (
        <ModalResultats
          dossier={selected}
          token={token!}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
