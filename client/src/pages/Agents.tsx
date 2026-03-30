import { useEffect, useState, useCallback } from 'react'
import Topbar from '../components/layout/Topbar'
import Spinner from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { agentsService } from '../services/agents'
import type { Agent } from '../types'

const STATUT_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIF:        'success',
  INACTIF:      'neutral',
  SUSPENDU:     'danger',
  EN_FORMATION: 'warning',
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const load = useCallback(() => {
    setLoading(true)
    agentsService.list({ search: search || undefined, limit: 50 } as any)
      .then(res => { setAgents(res.data); setTotal(res.total) })
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="Agents"
        subtitle={`${total} agents`}
        actions={
          <input
            className="text-[13px] px-3 py-1.5 rounded-lg border outline-none"
            style={{ borderColor: '#D4E5E1', background: '#F5F7F6' }}
            placeholder="Rechercher un agent..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
                   style={{ borderColor: '#D4E5E1' }}>

                {/* Avatar */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                     style={{ background: '#0A6E5C' }}>
                  {agent.prenom[0]}{agent.nom[0]}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px]" style={{ color: '#1A2B26' }}>
                    {agent.prenom} {agent.nom}
                  </div>
                  <div className="text-[12px] mt-0.5 flex items-center gap-3" style={{ color: '#5C7A74' }}>
                    <span>📞 {agent.telephone}</span>
                    <span>📍 {agent.commune}</span>
                    <span>Commission : {(agent.tauxCommission * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* KPIs du jour */}
                <div className="flex items-center gap-5 text-center">
                  <div>
                    <div className="text-[18px] font-extrabold" style={{ color: '#0A6E5C' }}>
                      {(agent.revenuJour ?? 0).toLocaleString('fr-FR')}
                    </div>
                    <div className="text-[10px]" style={{ color: '#5C7A74' }}>XOF aujourd'hui</div>
                  </div>
                  <div>
                    <div className="text-[18px] font-extrabold" style={{ color: '#1A2B26' }}>
                      {agent.nbPrelevJour ?? 0}
                    </div>
                    <div className="text-[10px]" style={{ color: '#5C7A74' }}>prélèvements</div>
                  </div>
                  {(agent.stocksEnAlerte ?? 0) > 0 && (
                    <div>
                      <div className="text-[18px] font-extrabold" style={{ color: '#E05C5C' }}>
                        {agent.stocksEnAlerte}
                      </div>
                      <div className="text-[10px]" style={{ color: '#E05C5C' }}>alertes stock</div>
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
                       style={{ background: 'rgba(10,110,92,0.08)', color: '#0A6E5C' }}>
                    {agent.missions.length} mission(s) active(s)
                  </div>
                )}
              </div>
            ))}

            {agents.length === 0 && (
              <div className="text-center py-16 text-sm" style={{ color: '#5C7A74' }}>
                Aucun agent trouvé
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
