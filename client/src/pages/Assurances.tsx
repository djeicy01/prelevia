import { useEffect, useState, useCallback } from 'react'
import Topbar from '../components/layout/Topbar'
import Spinner from '../components/ui/Spinner'
import { BadgeAssurance } from '../components/ui/Badge'
import { dossiersService } from '../services/dossiers'
import type { Dossier, AssuranceStatut } from '../types'

const STATUTS: AssuranceStatut[] = ['DOCS_COLLECTES', 'SOUMIS_LABO', 'EN_VALIDATION', 'VALIDE_TOTAL', 'VALIDE_PARTIEL', 'REFUSE']

const TRANSITIONS: Partial<Record<AssuranceStatut, AssuranceStatut>> = {
  DOCS_COLLECTES: 'SOUMIS_LABO',
  SOUMIS_LABO:    'EN_VALIDATION',
  EN_VALIDATION:  'VALIDE_TOTAL',
}

export default function Assurances() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [total, setTotal]       = useState(0)
  const [filter, setFilter]     = useState<AssuranceStatut | ''>('')
  const [loading, setLoading]   = useState(true)
  const [advancing, setAdvancing] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params: any = { hasAssurance: '1', limit: 50 }
    if (filter) params.statutAssurance = filter
    dossiersService.list(params)
      .then(res => { setDossiers(res.data); setTotal(res.total) })
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const avancer = async (dossier: Dossier) => {
    const next = TRANSITIONS[dossier.statutAssurance!]
    if (!next) return
    setAdvancing(dossier.id)
    try {
      await dossiersService.updateAssurance(dossier.id, next)
      load()
    } finally {
      setAdvancing(null)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="Assurances"
        subtitle={`${total} dossiers avec assurance`}
        actions={
          <select
            className="text-[13px] px-3 py-1.5 rounded-lg border outline-none"
            style={{ borderColor: '#D4E5E1', background: '#F5F7F6' }}
            value={filter}
            onChange={e => setFilter(e.target.value as AssuranceStatut | '')}
          >
            <option value="">Tous les statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        }
      />

      <div className="p-7 flex-1">
        {/* Kanban léger — 5 colonnes statut */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {(['DOCS_COLLECTES', 'SOUMIS_LABO', 'EN_VALIDATION', 'VALIDE_TOTAL', 'VALIDE_PARTIEL'] as AssuranceStatut[]).map(s => {
            const count = dossiers.filter(d => d.statutAssurance === s).length
            return (
              <div key={s} className="bg-white rounded-xl border p-3 text-center"
                   style={{ borderColor: '#D4E5E1' }}>
                <BadgeAssurance statut={s} />
                <div className="text-2xl font-extrabold mt-2" style={{ color: '#1A2B26' }}>{count}</div>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-[13px] border overflow-hidden" style={{ borderColor: '#D4E5E1' }}>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: '#F5F7F6' }}>
                  {['Dossier', 'Patient', 'Assureur', 'N° carte', 'Statut', 'Examens', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] uppercase tracking-[0.7px] font-semibold"
                        style={{ color: '#5C7A74' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dossiers.map(d => {
                  const nextStatut = TRANSITIONS[d.statutAssurance!]
                  return (
                    <tr key={d.id} className="border-t hover:bg-[#F5F7F6]/50"
                        style={{ borderColor: '#D4E5E1' }}>
                      <td className="px-4 py-3 text-[12px] font-mono font-semibold"
                          style={{ color: '#0A6E5C' }}>{d.ref}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: '#1A2B26' }}>
                        {d.patient ? `${d.patient.prenom} ${d.patient.nom}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-[13px]" style={{ color: '#5C7A74' }}>
                        {d.patient?.assurance?.nom ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-mono" style={{ color: '#5C7A74' }}>
                        {d.patient?.numCarte ?? '—'}
                      </td>
                      <td className="px-4 py-3"><BadgeAssurance statut={d.statutAssurance} /></td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: '#5C7A74' }}>
                        {d.examens?.length ?? 0} examen(s)
                      </td>
                      <td className="px-4 py-3">
                        {nextStatut && (
                          <button
                            onClick={() => avancer(d)}
                            disabled={advancing === d.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all"
                            style={{ background: '#0A6E5C', opacity: advancing === d.id ? 0.6 : 1 }}
                          >
                            {advancing === d.id ? <Spinner size={12} /> : '→'}
                            {nextStatut.replace(/_/g, ' ')}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
