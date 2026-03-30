import { useEffect, useState, useCallback } from 'react'
import Topbar from '../components/layout/Topbar'
import Spinner from '../components/ui/Spinner'
import { BadgeMission } from '../components/ui/Badge'
import { missionsService } from '../services/missions'
import type { Mission, MissionStatut } from '../types'

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [total, setTotal]       = useState(0)
  const [filter, setFilter]     = useState<MissionStatut | ''>('')
  const [loading, setLoading]   = useState(true)
  const [advancing, setAdvancing] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    missionsService.list({ statut: filter || undefined, limit: 30 } as any)
      .then(res => { setMissions(res.data); setTotal(res.total) })
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const avancer = async (mission: Mission) => {
    if (!mission.transitionsAutorisees?.length) return
    const next = mission.transitionsAutorisees[0]
    setAdvancing(mission.id)
    try { await missionsService.updateStatut(mission.id, next); load() }
    finally { setAdvancing(null) }
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="Missions"
        subtitle={`${total} missions`}
        actions={
          <select
            className="text-[13px] px-3 py-1.5 rounded-lg border outline-none"
            style={{ borderColor: '#D4E5E1', background: '#F5F7F6' }}
            value={filter}
            onChange={e => setFilter(e.target.value as MissionStatut | '')}
          >
            <option value="">Toutes</option>
            {(['PLANIFIEE','EN_ROUTE','ARRIVEE','PRELEVEMENT_FAIT','TERMINEE'] as MissionStatut[]).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        }
      />

      <div className="p-7 flex-1">
        {loading ? (
          <div className="flex justify-center mt-20"><Spinner size={28} /></div>
        ) : (
          <div className="bg-white rounded-[13px] border overflow-hidden" style={{ borderColor: '#D4E5E1' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: '#F5F7F6' }}>
                  {['Réf.', 'Agent', 'Dossiers', 'Date', 'Statut', 'Total facturé', 'À encaisser', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] uppercase tracking-[0.7px] font-semibold"
                        style={{ color: '#5C7A74' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {missions.map(m => (
                  <tr key={m.id} className="border-t hover:bg-[#F5F7F6]/50"
                      style={{ borderColor: '#D4E5E1' }}>
                    <td className="px-4 py-3 text-[12px] font-mono font-semibold" style={{ color: '#0A6E5C' }}>
                      {m.ref}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: '#1A2B26' }}>
                      {m.agent ? `${m.agent.prenom} ${m.agent.nom}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#5C7A74' }}>
                      {m.dossiers?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: '#5C7A74' }}>
                      {new Date(m.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td className="px-4 py-3"><BadgeMission statut={m.statut} /></td>
                    <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: '#1A2B26' }}>
                      {m.finances ? `${m.finances.totalFacture.toLocaleString('fr-FR')} XOF` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold" style={{ color: '#0A6E5C' }}>
                      {m.finances ? `${m.finances.totalPatient.toLocaleString('fr-FR')} XOF` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {m.transitionsAutorisees && m.transitionsAutorisees.length > 0 && (
                        <button
                          onClick={() => avancer(m)}
                          disabled={advancing === m.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
                          style={{ background: '#0A6E5C' }}
                        >
                          {advancing === m.id ? <Spinner size={12} /> : '→'}
                          {m.transitionsAutorisees[0].replace(/_/g, ' ')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {missions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-sm" style={{ color: '#5C7A74' }}>
                      Aucune mission trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
