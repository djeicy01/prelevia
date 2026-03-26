import { useEffect, useState, useCallback } from 'react'
import Topbar from '../components/layout/Topbar'
import Spinner from '../components/ui/Spinner'
import { BadgeDossier, BadgeAssurance, BadgeOcr } from '../components/ui/Badge'
import { dossiersService } from '../services/dossiers'
import type { Dossier } from '../types'

export default function Patients() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    dossiersService.list({ page, limit: 20, search: search || undefined } as any)
      .then(res => { setDossiers(res.data); setTotal(res.total) })
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="Dossiers patients"
        subtitle={`${total} dossiers`}
        actions={
          <div className="flex items-center gap-2">
            <input
              className="text-[13px] px-3 py-1.5 rounded-lg border outline-none"
              style={{ borderColor: '#D4E5E1', background: '#F5F7F6' }}
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        }
      />

      <div className="p-7 flex-1">
        <div className="bg-white rounded-[13px] border overflow-hidden" style={{ borderColor: '#D4E5E1' }}>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : dossiers.length === 0 ? (
            <div className="text-center py-16 text-sm" style={{ color: '#5C7A74' }}>
              Aucun dossier trouvé
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
                    <tr key={d.id} className="border-t hover:bg-[#F5F7F6]/50 transition-colors"
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
