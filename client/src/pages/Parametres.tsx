import { useEffect, useState } from 'react'
import {
  getParametres, updateParametre, recalculerTarifs,
  getLaboratoire, updateLaboratoire,
  getTemplatesSMS, updateTemplateSMS,
  getZones,
  getCatalogue, createExamen, updateExamen,
  getPanels, createPanel, updatePanel, updatePanelExamens,
} from '../services/parametres'

// ── Design tokens ────────────────────────────────────────────
const P  = '#0A6E5C'
const PD = '#064D40'
const AC = '#F4A726'
const BD = '#D4E5E1'
const TX = '#1A2B26'
const TL = '#5C7A74'
const BG = '#F5F7F6'

// ── Generic helpers ──────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: TX }}>{label}</label>
      {children}
    </div>
  )
}
function Input({ value, onChange, type = 'text', placeholder = '' }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
      style={{ borderColor: BD, color: TX, background: '#fff' }}
    />
  )
}
function Textarea({ value, onChange, rows = 3, placeholder = '' }: any) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-y"
      style={{ borderColor: BD, color: TX, background: '#fff' }}
    />
  )
}
function Btn({ onClick, disabled, variant = 'primary', children, small }: any) {
  const bg: Record<string, string> = {
    primary: P, accent: AC, danger: '#E05C5C', ghost: 'transparent',
  }
  const tc: Record<string, string> = {
    primary: '#fff', accent: '#fff', danger: '#fff', ghost: TL,
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-semibold rounded-lg transition-opacity disabled:opacity-50 ${small ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}`}
      style={{ background: bg[variant], color: tc[variant], border: variant === 'ghost' ? `1px solid ${BD}` : 'none' }}
    >
      {children}
    </button>
  )
}
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
      style={{ background: ok ? '#2CB67D' : '#E05C5C', color: '#fff' }}
    >
      {msg}
    </div>
  )
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.45)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]" style={{ border: `1px solid ${BD}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BD }}>
          <h3 className="font-bold text-base" style={{ color: TX }}>{title}</h3>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: TL }}>&times;</button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">{children}</div>
      </div>
    </div>
  )
}
function Badge({ actif }: { actif: boolean }) {
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: actif ? '#d1fae5' : '#fee2e2', color: actif ? '#065f46' : '#991b1b' }}>
      {actif ? 'Actif' : 'Inactif'}
    </span>
  )
}

// ── Types ────────────────────────────────────────────────────
interface Param    { id: string; cle: string; valeur: string; type: string; description: string | null }
interface Labo     { id: string; nom: string; adresse: string | null; telephone: string | null; email: string | null; valeurB: number }
interface Template { id: string; code: string; sujet: string; contenu: string; actif: boolean }
interface Zone     { id: string; nom: string; actif: boolean; fraisDeplacement: number }
interface Examen   { id: string; code: string; nom: string; categorie: string; valeurB: number; tarifMin: number; tarifMax: number; typesTube: string | null; description: string | null; actif: boolean }
interface PanelEx  { id: string; ordre: number; catalogue: Examen }
interface Panel    { id: string; code: string; nom: string; categorie: string; actif: boolean; examens: PanelEx[] }

const CATEGORIES_EXAM = [
  'Biochimie', 'Hématologie', 'Hémostase', 'Hormonologie',
  'Marqueurs Tumoraux', 'Bactériologie', 'Parasitologie', 'Immunologie / Sérologie',
]
const CATEGORIES_PANEL = ['Bilan courant', 'Bilan spécialisé', 'Campagne']

// ─────────────────────────────────────────────────────────────
// TAB: GÉNÉRAL
// ─────────────────────────────────────────────────────────────
function TabGeneral({ params, labo, zones, onRefresh }: {
  params: Param[]
  labo: Labo | null
  zones: Zone[]
  onRefresh: () => void
}) {
  const vbParam = params.find(p => p.cle === 'VALEUR_B')
  const [vb, setVb] = useState(vbParam?.valeur ?? '200')
  const [laboForm, setLaboForm] = useState({ nom: labo?.nom ?? '', adresse: labo?.adresse ?? '', telephone: labo?.telephone ?? '', email: labo?.email ?? '' })
  const [saving, setSaving] = useState(false)
  const [recalc, setRecalc] = useState(false)
  const [toast, setToast]   = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => { setVb(vbParam?.valeur ?? '200') }, [vbParam?.valeur])
  useEffect(() => { setLaboForm({ nom: labo?.nom ?? '', adresse: labo?.adresse ?? '', telephone: labo?.telephone ?? '', email: labo?.email ?? '' }) }, [labo])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function saveVB() {
    setSaving(true)
    try {
      await updateParametre('VALEUR_B', vb)
      showToast('Valeur B mise à jour')
      onRefresh()
    } catch { showToast('Erreur', false) }
    finally { setSaving(false) }
  }

  async function doRecalc() {
    setRecalc(true)
    try {
      const r = await recalculerTarifs()
      showToast(`${r.count} examens recalculés (${r.valeurB} XOF/pt)`)
    } catch { showToast('Erreur', false) }
    finally { setRecalc(false) }
  }

  async function saveLabo() {
    setSaving(true)
    try {
      await updateLaboratoire(laboForm)
      showToast('Laboratoire mis à jour')
      onRefresh()
    } catch { showToast('Erreur', false) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-8">
      {toast && <Toast {...toast} />}

      {/* Valeur B */}
      <section className="bg-white rounded-xl p-6 border" style={{ borderColor: BD }}>
        <h3 className="font-bold text-sm mb-4" style={{ color: TX }}>Cotation B — Valeur du point</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Field label="Valeur B (XOF / point)">
              <Input type="number" value={vb} onChange={setVb} placeholder="200" />
            </Field>
            <p className="text-xs mt-1" style={{ color: TL }}>Tarif examen = coefficient B × valeur B. Actuelle : {labo?.valeurB ?? '—'} XOF</p>
          </div>
          <Btn onClick={saveVB} disabled={saving}>Enregistrer</Btn>
          <Btn onClick={doRecalc} disabled={recalc} variant="accent">
            {recalc ? 'Calcul…' : 'Recalculer tous les tarifs'}
          </Btn>
        </div>
      </section>

      {/* Laboratoire */}
      <section className="bg-white rounded-xl p-6 border" style={{ borderColor: BD }}>
        <h3 className="font-bold text-sm mb-4" style={{ color: TX }}>Laboratoire partenaire</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom"><Input value={laboForm.nom} onChange={(v: string) => setLaboForm(f => ({ ...f, nom: v }))} /></Field>
          <Field label="Téléphone"><Input value={laboForm.telephone} onChange={(v: string) => setLaboForm(f => ({ ...f, telephone: v }))} /></Field>
          <Field label="E-mail"><Input type="email" value={laboForm.email} onChange={(v: string) => setLaboForm(f => ({ ...f, email: v }))} /></Field>
          <Field label="Adresse"><Input value={laboForm.adresse} onChange={(v: string) => setLaboForm(f => ({ ...f, adresse: v }))} /></Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Btn onClick={saveLabo} disabled={saving}>Enregistrer</Btn>
        </div>
      </section>

      {/* Zones */}
      <section className="bg-white rounded-xl p-6 border" style={{ borderColor: BD }}>
        <h3 className="font-bold text-sm mb-4" style={{ color: TX }}>Zones de couverture</h3>
        <div className="divide-y" style={{ borderColor: BD }}>
          {zones.map(z => (
            <div key={z.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <Badge actif={z.actif} />
                <span className="text-sm font-medium" style={{ color: TX }}>{z.nom}</span>
              </div>
              <span className="text-sm" style={{ color: TL }}>{z.fraisDeplacement.toLocaleString()} XOF / déplacement</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB: TEMPLATES SMS
// ─────────────────────────────────────────────────────────────
function TabSMS({ templates, onRefresh }: { templates: Template[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm]       = useState({ sujet: '', contenu: '' })
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  function openEdit(t: Template) {
    setEditing(t)
    setForm({ sujet: t.sujet, contenu: t.contenu })
  }

  async function saveTemplate() {
    if (!editing) return
    setSaving(true)
    try {
      await updateTemplateSMS(editing.code, form)
      showToast('Template mis à jour')
      setEditing(null)
      onRefresh()
    } catch { showToast('Erreur', false) }
    finally { setSaving(false) }
  }

  async function toggleActif(t: Template) {
    try {
      await updateTemplateSMS(t.code, { actif: !t.actif })
      onRefresh()
    } catch { showToast('Erreur', false) }
  }

  return (
    <div className="space-y-4">
      {toast && <Toast {...toast} />}
      {editing && (
        <Modal title={`Modifier — ${editing.code}`} onClose={() => setEditing(null)}>
          <Field label="Sujet"><Input value={form.sujet} onChange={(v: string) => setForm(f => ({ ...f, sujet: v }))} /></Field>
          <Field label="Contenu SMS">
            <Textarea rows={5} value={form.contenu} onChange={(v: string) => setForm(f => ({ ...f, contenu: v }))} />
          </Field>
          <p className="text-xs" style={{ color: TL }}>Variables disponibles : <code>{'{{nom}}'}</code>, <code>{'{{heure}}'}</code>, <code>{'{{montant}}'}</code>…</p>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setEditing(null)}>Annuler</Btn>
            <Btn onClick={saveTemplate} disabled={saving}>Enregistrer</Btn>
          </div>
        </Modal>
      )}

      {templates.map(t => (
        <div key={t.id} className="bg-white rounded-xl border p-5" style={{ borderColor: BD }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded font-mono" style={{ background: `${P}15`, color: P }}>{t.code}</span>
                <Badge actif={t.actif} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: TX }}>{t.sujet}</p>
              <p className="text-xs whitespace-pre-wrap" style={{ color: TL }}>{t.contenu}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Btn small variant="ghost" onClick={() => toggleActif(t)}>{t.actif ? 'Désactiver' : 'Activer'}</Btn>
              <Btn small onClick={() => openEdit(t)}>Modifier</Btn>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB: CATALOGUE EXAMENS
// ─────────────────────────────────────────────────────────────
const EMPTY_EXAM = { code: '', nom: '', categorie: CATEGORIES_EXAM[0], valeurB: '', typesTube: '', description: '' }

function TabCatalogue({ catalogue, onRefresh }: { catalogue: Examen[]; onRefresh: () => void }) {
  const [filterCat, setFilterCat]     = useState('Toutes')
  const [modal, setModal]             = useState<'add' | Examen | null>(null)
  const [form, setForm]               = useState({ ...EMPTY_EXAM })
  const [saving, setSaving]           = useState(false)
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }
  function openAdd()          { setForm({ ...EMPTY_EXAM }); setModal('add') }
  function openEdit(e: Examen){ setForm({ code: e.code, nom: e.nom, categorie: e.categorie, valeurB: String(e.valeurB), typesTube: e.typesTube ?? '', description: e.description ?? '' }); setModal(e) }

  async function save() {
    setSaving(true)
    try {
      const payload = { ...form, valeurB: Number(form.valeurB) }
      if (modal === 'add') await createExamen(payload)
      else                 await updateExamen((modal as Examen).id, payload)
      showToast(modal === 'add' ? 'Examen ajouté' : 'Examen modifié')
      setModal(null)
      onRefresh()
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Erreur', false)
    } finally { setSaving(false) }
  }

  async function toggleActif(e: Examen) {
    try { await updateExamen(e.id, { actif: !e.actif }); onRefresh() }
    catch { showToast('Erreur', false) }
  }

  const cats    = ['Toutes', ...CATEGORIES_EXAM]
  const visible = filterCat === 'Toutes' ? catalogue : catalogue.filter(e => e.categorie === filterCat)

  return (
    <div>
      {toast && <Toast {...toast} />}
      {modal && (
        <Modal title={modal === 'add' ? 'Nouvel examen' : `Modifier — ${(modal as Examen).code}`} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code"><Input value={form.code} onChange={(v: string) => setForm(f => ({ ...f, code: v }))} placeholder="NFS" /></Field>
            <Field label="Coefficient B"><Input type="number" value={form.valeurB} onChange={(v: string) => setForm(f => ({ ...f, valeurB: v }))} placeholder="30" /></Field>
          </div>
          <Field label="Nom complet"><Input value={form.nom} onChange={(v: string) => setForm(f => ({ ...f, nom: v }))} placeholder="Numération Formule Sanguine" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: BD, color: TX }}>
                {CATEGORIES_EXAM.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Type(s) de tube"><Input value={form.typesTube} onChange={(v: string) => setForm(f => ({ ...f, typesTube: v }))} placeholder="EDTA" /></Field>
          </div>
          <Field label="Description (optionnel)"><Textarea rows={2} value={form.description} onChange={(v: string) => setForm(f => ({ ...f, description: v }))} /></Field>
          {form.valeurB && (
            <p className="text-xs" style={{ color: TL }}>
              Tarif estimé : {Math.round(Number(form.valeurB) * 200).toLocaleString()} XOF (base 200 XOF/pt)
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setModal(null)}>Annuler</Btn>
            <Btn onClick={save} disabled={saving}>Enregistrer</Btn>
          </div>
        </Modal>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm outline-none flex-1 max-w-xs" style={{ borderColor: BD, color: TX }}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="text-xs ml-auto" style={{ color: TL }}>{visible.length} examen(s)</span>
        <Btn onClick={openAdd}>+ Ajouter</Btn>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: BD }}>
        <table className="w-full text-sm">
          <thead style={{ background: BG }}>
            <tr>
              {['Code', 'Nom', 'Catégorie', 'Coeff B', 'Tarif max', 'Tube', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: TL }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((e, i) => (
              <tr key={e.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${BD}` }}>
                <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: P }}>{e.code}</td>
                <td className="px-4 py-3 font-medium" style={{ color: TX }}>{e.nom}</td>
                <td className="px-4 py-3 text-xs" style={{ color: TL }}>{e.categorie}</td>
                <td className="px-4 py-3 text-center font-mono">{e.valeurB}</td>
                <td className="px-4 py-3 text-right font-mono">{e.tarifMax.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs" style={{ color: TL }}>{e.typesTube ?? '—'}</td>
                <td className="px-4 py-3"><Badge actif={e.actif} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Btn small variant="ghost" onClick={() => toggleActif(e)}>{e.actif ? 'Désactiver' : 'Activer'}</Btn>
                    <Btn small onClick={() => openEdit(e)}>Modifier</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: TL }}>Aucun examen</div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB: PANELS
// ─────────────────────────────────────────────────────────────
const EMPTY_PANEL = { code: '', nom: '', categorie: CATEGORIES_PANEL[0], description: '' }

function TabPanels({ panels, catalogue, onRefresh }: { panels: Panel[]; catalogue: Examen[]; onRefresh: () => void }) {
  const [metaModal, setMetaModal]   = useState<'add' | Panel | null>(null)
  const [compModal, setCompModal]   = useState<Panel | null>(null)
  const [form, setForm]             = useState({ ...EMPTY_PANEL })
  const [selectedIds, setSelected]  = useState<string[]>([])
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null)
  const [catFilter, setCatFilter]   = useState('Toutes')

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  function openAdd()           { setForm({ ...EMPTY_PANEL }); setMetaModal('add') }
  function openEdit(p: Panel)  { setForm({ code: p.code, nom: p.nom, categorie: p.categorie, description: '' }); setMetaModal(p) }
  function openComp(p: Panel)  { setCompModal(p); setSelected(p.examens.map(e => e.catalogue.id)) }

  async function saveMeta() {
    setSaving(true)
    try {
      if (metaModal === 'add') await createPanel({ ...form, catalogueIds: [] })
      else                     await updatePanel((metaModal as Panel).id, { nom: form.nom, categorie: form.categorie })
      showToast(metaModal === 'add' ? 'Panel créé' : 'Panel modifié')
      setMetaModal(null)
      onRefresh()
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Erreur', false)
    } finally { setSaving(false) }
  }

  async function saveCompo() {
    if (!compModal) return
    setSaving(true)
    try {
      await updatePanelExamens(compModal.id, selectedIds)
      showToast('Composition mise à jour')
      setCompModal(null)
      onRefresh()
    } catch { showToast('Erreur', false) }
    finally { setSaving(false) }
  }

  async function toggleActif(p: Panel) {
    try { await updatePanel(p.id, { actif: !p.actif }); onRefresh() }
    catch { showToast('Erreur', false) }
  }

  function toggleId(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const catOptions  = ['Toutes', ...CATEGORIES_PANEL]
  const visibleCats = catFilter === 'Toutes' ? panels : panels.filter(p => p.categorie === catFilter)

  // For exam picker: group catalogue by category
  const grouped = CATEGORIES_EXAM.reduce<Record<string, Examen[]>>((acc, cat) => {
    const list = catalogue.filter(e => e.categorie === cat && e.actif)
    if (list.length) acc[cat] = list
    return acc
  }, {})

  return (
    <div>
      {toast && <Toast {...toast} />}

      {/* Meta modal (add / edit name) */}
      {metaModal && (
        <Modal title={metaModal === 'add' ? 'Nouveau panel' : `Modifier — ${(metaModal as Panel).code}`} onClose={() => setMetaModal(null)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code (ex: BIL-DIA)"><Input value={form.code} onChange={(v: string) => setForm(f => ({ ...f, code: v }))} placeholder="BIL-XXX" /></Field>
            <Field label="Catégorie">
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: BD, color: TX }}>
                {CATEGORIES_PANEL.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Nom"><Input value={form.nom} onChange={(v: string) => setForm(f => ({ ...f, nom: v }))} placeholder="Bilan Diabète Complet" /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setMetaModal(null)}>Annuler</Btn>
            <Btn onClick={saveMeta} disabled={saving}>Enregistrer</Btn>
          </div>
        </Modal>
      )}

      {/* Composition modal */}
      {compModal && (
        <Modal title={`Composition — ${compModal.nom}`} onClose={() => setCompModal(null)}>
          <p className="text-xs mb-3" style={{ color: TL }}>{selectedIds.length} examen(s) sélectionné(s)</p>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {Object.entries(grouped).map(([cat, list]) => (
              <div key={cat}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: TL }}>{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {list.map(e => {
                    const sel = selectedIds.includes(e.id)
                    return (
                      <button
                        key={e.id}
                        onClick={() => toggleId(e.id)}
                        className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
                        style={{
                          background: sel ? P : '#fff',
                          color: sel ? '#fff' : TL,
                          borderColor: sel ? P : BD,
                        }}
                      >
                        {e.code}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t mt-2" style={{ borderColor: BD }}>
            <Btn variant="ghost" onClick={() => setCompModal(null)}>Annuler</Btn>
            <Btn onClick={saveCompo} disabled={saving}>Enregistrer la composition</Btn>
          </div>
        </Modal>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm outline-none flex-1 max-w-xs" style={{ borderColor: BD, color: TX }}>
          {catOptions.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="text-xs ml-auto" style={{ color: TL }}>{visibleCats.length} panel(s)</span>
        <Btn onClick={openAdd}>+ Créer</Btn>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleCats.map(p => (
          <div key={p.id} className="bg-white rounded-xl border p-5" style={{ borderColor: BD }}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded" style={{ background: `${P}15`, color: P }}>{p.code}</span>
                  <Badge actif={p.actif} />
                </div>
                <p className="text-sm font-semibold" style={{ color: TX }}>{p.nom}</p>
                <p className="text-xs" style={{ color: TL }}>{p.categorie} · {p.examens.length} examen(s)</p>
              </div>
            </div>
            {/* Exam chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {p.examens.map(pe => (
                <span key={pe.id} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${P}12`, color: P }}>
                  {pe.catalogue.code}
                </span>
              ))}
              {p.examens.length === 0 && <span className="text-xs" style={{ color: TL }}>Aucun examen</span>}
            </div>
            <div className="flex items-center gap-2">
              <Btn small variant="ghost" onClick={() => toggleActif(p)}>{p.actif ? 'Désactiver' : 'Activer'}</Btn>
              <Btn small variant="ghost" onClick={() => openEdit(p)}>Renommer</Btn>
              <Btn small onClick={() => openComp(p)}>Composition</Btn>
            </div>
          </div>
        ))}
      </div>
      {visibleCats.length === 0 && (
        <div className="text-center py-16 text-sm" style={{ color: TL }}>Aucun panel</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
type Tab = 'general' | 'sms' | 'catalogue' | 'panels'

const TABS: { id: Tab; label: string }[] = [
  { id: 'general',   label: 'Général' },
  { id: 'sms',       label: 'Templates SMS' },
  { id: 'catalogue', label: 'Catalogue examens' },
  { id: 'panels',    label: 'Panels d\'analyses' },
]

export default function Parametres() {
  const [tab, setTab]           = useState<Tab>('general')
  const [params, setParams]     = useState<Param[]>([])
  const [labo, setLabo]         = useState<Labo | null>(null)
  const [zones, setZones]       = useState<Zone[]>([])
  const [templates, setTpl]     = useState<Template[]>([])
  const [catalogue, setCatalogue] = useState<Examen[]>([])
  const [panels, setPanels]     = useState<Panel[]>([])
  const [loading, setLoading]   = useState(true)

  async function loadAll() {
    try {
      const [p, l, z, t, c, pn] = await Promise.all([
        getParametres(), getLaboratoire(), getZones(),
        getTemplatesSMS(), getCatalogue(), getPanels(),
      ])
      setParams(p); setLabo(l); setZones(z)
      setTpl(t); setCatalogue(c); setPanels(pn)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: TX }}>Paramètres</h1>
        <p className="text-sm mt-0.5" style={{ color: TL }}>Configuration du back-office — aucune modification de code requise</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border" style={{ borderColor: BD }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === t.id ? PD : 'transparent',
              color: tab === t.id ? '#fff' : TL,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: BD, borderTopColor: P }} />
        </div>
      ) : (
        <>
          {tab === 'general'   && <TabGeneral params={params} labo={labo} zones={zones} onRefresh={loadAll} />}
          {tab === 'sms'       && <TabSMS templates={templates} onRefresh={() => getTemplatesSMS().then(setTpl)} />}
          {tab === 'catalogue' && <TabCatalogue catalogue={catalogue} onRefresh={() => getCatalogue().then(setCatalogue)} />}
          {tab === 'panels'    && <TabPanels panels={panels} catalogue={catalogue} onRefresh={() => getPanels().then(setPanels)} />}
        </>
      )}
    </div>
  )
}
