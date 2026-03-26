import { useEffect, useState } from 'react'
import Topbar from '../components/layout/Topbar'
import Spinner from '../components/ui/Spinner'
import { agentsService } from '../services/agents'
import type { Agent, StockAgent } from '../types'

function StockBar({ quantite, max }: { quantite: number; max: number }) {
  const pct   = Math.min(100, Math.round((quantite / max) * 100))
  const color = pct > 50 ? '#2CB67D' : pct > 25 ? '#F4A726' : '#E05C5C'
  return (
    <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: '#D4E5E1' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function Stock() {
  const [agents, setAgents]   = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [stocks, setStocks]   = useState<Record<string, { stocks: StockAgent[]; alertes: StockAgent[] }>>({})

  useEffect(() => {
    agentsService.list({ statut: 'ACTIF', limit: 20 }).then(async res => {
      setAgents(res.data)
      // Charger les stocks de chaque agent en parallèle
      const stocksMap: typeof stocks = {}
      await Promise.all(
        res.data.map(async a => {
          try {
            stocksMap[a.id] = await agentsService.getStock(a.id)
          } catch {
            stocksMap[a.id] = { stocks: [], alertes: [] }
          }
        })
      )
      setStocks(stocksMap)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const totalAlertes = Object.values(stocks).reduce((acc, s) => acc + s.alertes.length, 0)

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="Stock matériel"
        subtitle={totalAlertes > 0 ? `⚠️ ${totalAlertes} alerte(s) de stock` : 'Tous les stocks OK'}
      />

      <div className="p-7 flex-1">
        {loading ? (
          <div className="flex justify-center mt-20"><Spinner size={28} /></div>
        ) : (
          <div className="space-y-5">
            {agents.map(agent => {
              const agentStock = stocks[agent.id]
              if (!agentStock) return null

              return (
                <div key={agent.id} className="bg-white rounded-[13px] border" style={{ borderColor: '#D4E5E1' }}>
                  {/* Header agent */}
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#D4E5E1' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                           style={{ background: '#0A6E5C' }}>
                        {agent.prenom[0]}{agent.nom[0]}
                      </div>
                      <div>
                        <div className="font-bold text-[14px]" style={{ color: '#1A2B26' }}>
                          {agent.prenom} {agent.nom}
                        </div>
                        <div className="text-[11px]" style={{ color: '#5C7A74' }}>📍 {agent.commune}</div>
                      </div>
                    </div>
                    {agentStock.alertes.length > 0 && (
                      <span className="text-[12px] font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(224,92,92,0.1)', color: '#E05C5C' }}>
                        ⚠️ {agentStock.alertes.length} article(s) en alerte
                      </span>
                    )}
                  </div>

                  {/* Grille stocks */}
                  <div className="grid grid-cols-4 gap-4 p-5">
                    {agentStock.stocks.map(s => {
                      const isAlerte = s.quantite <= s.seuilAlerte
                      return (
                        <div key={s.id}
                             className="rounded-xl p-3.5 border"
                             style={{
                               borderColor: isAlerte ? 'rgba(224,92,92,0.3)' : '#D4E5E1',
                               background: isAlerte ? 'rgba(224,92,92,0.04)' : '#F5F7F6',
                             }}>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.4px] mb-1"
                               style={{ color: '#5C7A74' }}>
                            {s.materiau}
                          </div>
                          <div className="text-[22px] font-extrabold"
                               style={{ color: isAlerte ? '#E05C5C' : '#1A2B26' }}>
                            {s.quantite}
                          </div>
                          <StockBar quantite={s.quantite} max={s.seuilAlerte * 3} />
                          {isAlerte && (
                            <div className="text-[10px] mt-1.5 font-semibold" style={{ color: '#E05C5C' }}>
                              ⚠️ Seuil : {s.seuilAlerte}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {agentStock.stocks.length === 0 && (
                      <div className="col-span-4 text-center py-6 text-sm" style={{ color: '#5C7A74' }}>
                        Aucun stock enregistré
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {agents.length === 0 && (
              <div className="text-center py-16 text-sm" style={{ color: '#5C7A74' }}>
                Aucun agent actif
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
