import { useEffect, useState } from 'react'
import Topbar from '../components/layout/Topbar'
import Spinner from '../components/ui/Spinner'
import { rapportsService } from '../services/rapports'

type Periode = 'semaine' | 'mois' | 'annee' | 'custom'

// Formate une Date en YYYY-MM-DD pour les inputs type="date"
function toInputDate(d: Date): string { return d.toISOString().slice(0, 10) }

export default function Rapports() {
  const [periode, setPeriode]       = useState<Periode>('mois')
  const [dateDebut, setDateDebut]   = useState(() => {
    const d = new Date(); d.setDate(1); return toInputDate(d)   // 1er du mois courant
  })
  const [dateFin, setDateFin]       = useState(() => toInputDate(new Date()))
  const [ca, setCa]                 = useState<any>(null)
  const [ocr, setOcr]               = useState<any>(null)
  const [examens, setExamens]       = useState<any>(null)
  const [communes, setCommunes]     = useState<any>(null)
  const [agentPerf, setAgentPerf]   = useState<any>(null)
  const [loading, setLoading]       = useState(true)

  function load(p: Periode, dd: string, df: string) {
    setLoading(true)
    const custom = p === 'custom' && dd && df
    const caParams     = custom ? { dateDebut: dd, dateFin: df } : { periode: p }
    const agentParams  = custom ? { dateDebut: dd, dateFin: df } : { periode: p }
    const ocrParams    = custom ? { dateDebut: dd, dateFin: df } : undefined
    const examensParams = custom
      ? { limit: 8, dateDebut: dd, dateFin: df }
      : { limit: 8 }

    Promise.all([
      rapportsService.ca(caParams),
      rapportsService.ocr(ocrParams),
      rapportsService.examens(examensParams),
      rapportsService.communes(),
      rapportsService.agents(agentParams),
    ])
      .then(([c, o, e, com, ap]) => {
        setCa(c); setOcr(o); setExamens(e); setCommunes(com); setAgentPerf(ap)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (periode !== 'custom') load(periode, dateDebut, dateFin)
  }, [periode])

  // Déclenche le rechargement custom uniquement quand les deux dates sont valides
  function handleCustomApply() {
    if (dateDebut && dateFin && dateDebut <= dateFin) load('custom', dateDebut, dateFin)
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="Rapports"
        subtitle="Analyse des performances"
        actions={
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['semaine', 'mois', 'annee'] as Periode[]).map(p => (
              <button key={p} onClick={() => setPeriode(p)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={{
                  background: periode === p ? '#0A6E5C' : '#F5F7F6',
                  color:      periode === p ? '#fff'    : '#5C7A74',
                  border:     `1.5px solid ${periode === p ? '#0A6E5C' : '#D4E5E1'}`,
                }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
            <button onClick={() => setPeriode('custom')}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
              style={{
                background: periode === 'custom' ? '#0A6E5C' : '#F5F7F6',
                color:      periode === 'custom' ? '#fff'    : '#5C7A74',
                border:     `1.5px solid ${periode === 'custom' ? '#0A6E5C' : '#D4E5E1'}`,
              }}>
              Personnalisé
            </button>

            {/* Champs date — visibles uniquement en mode custom */}
            {periode === 'custom' && (
              <div className="flex items-center gap-1.5 ml-1">
                <input type="date" value={dateDebut}
                  onChange={e => setDateDebut(e.target.value)}
                  className="text-[12px] px-2 py-1.5 rounded-lg border outline-none"
                  style={{ borderColor: '#D4E5E1', color: '#1A2B26' }} />
                <span className="text-[11px]" style={{ color: '#5C7A74' }}>→</span>
                <input type="date" value={dateFin}
                  onChange={e => setDateFin(e.target.value)}
                  className="text-[12px] px-2 py-1.5 rounded-lg border outline-none"
                  style={{ borderColor: '#D4E5E1', color: '#1A2B26' }} />
                <button onClick={handleCustomApply}
                  disabled={!dateDebut || !dateFin || dateDebut > dateFin}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-40"
                  style={{ background: '#F4A726' }}>
                  Appliquer
                </button>
              </div>
            )}
          </div>
        }
      />

      <div className="p-7 flex-1">
        {loading ? (
          <div className="flex justify-center mt-20"><Spinner size={28} /></div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {/* CA par jour */}
            {ca && (
              <div className="bg-white rounded-[13px] border p-5" style={{ borderColor: '#D4E5E1' }}>
                <h2 className="text-sm font-bold mb-1" style={{ color: '#1A2B26' }}>Chiffre d'affaires</h2>
                <p className="text-[26px] font-extrabold" style={{ color: '#0A6E5C' }}>
                  {ca.totalMontant.toLocaleString('fr-FR')} XOF
                </p>
                <p className="text-xs mt-1 mb-4" style={{ color: '#5C7A74' }}>
                  {ca.nbPaiements} paiements — {new Date(ca.debut).toLocaleDateString('fr-FR')} à aujourd'hui
                </p>
                <div className="space-y-1.5">
                  {ca.parMode?.map((m: any) => (
                    <div key={m.mode} className="flex justify-between text-[12px]">
                      <span style={{ color: '#5C7A74' }}>{m.mode.replace(/_/g,' ')}</span>
                      <span className="font-semibold" style={{ color: '#1A2B26' }}>
                        {m.montant.toLocaleString('fr-FR')} XOF
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sources OCR */}
            {ocr && (
              <div className="bg-white rounded-[13px] border p-5" style={{ borderColor: '#D4E5E1' }}>
                <h2 className="text-sm font-bold mb-4" style={{ color: '#1A2B26' }}>Sources OCR</h2>
                <div className="space-y-3">
                  {ocr.sources?.map((s: any) => (
                    <div key={s.source}>
                      <div className="flex justify-between text-[12px] mb-1" style={{ color: '#5C7A74' }}>
                        <span>{s.source}</span>
                        <span className="font-semibold">{s.count} ({s.pourcentage}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#D4E5E1' }}>
                        <div className="h-full rounded-full"
                             style={{ width: `${s.pourcentage}%`, background: '#0A6E5C' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top examens */}
            {examens && (
              <div className="bg-white rounded-[13px] border p-5" style={{ borderColor: '#D4E5E1' }}>
                <h2 className="text-sm font-bold mb-4" style={{ color: '#1A2B26' }}>Top examens demandés</h2>
                <div className="space-y-2">
                  {examens.data?.map((e: any, i: number) => (
                    <div key={e.catalogueId} className="flex items-center gap-3 text-[12px]">
                      <span className="text-[10px] font-bold w-5 text-center rounded"
                            style={{ background: '#F5F7F6', color: '#5C7A74' }}>
                        {i + 1}
                      </span>
                      <span className="flex-1 font-semibold" style={{ color: '#1A2B26' }}>
                        {e.catalogue?.nom ?? e.catalogueId}
                      </span>
                      <span style={{ color: '#5C7A74' }}>{e.nbDossiers} dossiers</span>
                      <span className="font-bold" style={{ color: '#0A6E5C' }}>
                        {e.caTotal.toLocaleString('fr-FR')} XOF
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Répartition communes */}
            {communes && (
              <div className="bg-white rounded-[13px] border p-5" style={{ borderColor: '#D4E5E1' }}>
                <h2 className="text-sm font-bold mb-4" style={{ color: '#1A2B26' }}>Répartition par commune</h2>
                <div className="space-y-2">
                  {communes.communes?.map((c: any) => (
                    <div key={c.commune} className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              style={{ background: 'rgba(10,110,92,0.08)', color: '#0A6E5C' }}>
                          📍
                        </span>
                        <span style={{ color: '#1A2B26' }}>{c.commune}</span>
                      </span>
                      <div className="flex gap-3" style={{ color: '#5C7A74' }}>
                        <span>{c.nbPatients} patients</span>
                        <span>{c.nbDossiers} dossiers</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance agents */}
            {agentPerf && (
              <div className="col-span-2 bg-white rounded-[13px] border p-5" style={{ borderColor: '#D4E5E1' }}>
                <h2 className="text-sm font-bold mb-4" style={{ color: '#1A2B26' }}>
                  Performance agents — {agentPerf.periode}
                </h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Agent', 'Missions', 'Terminées', 'Taux complétion', 'Revenus', 'Stock alertes'].map(h => (
                        <th key={h} className="text-left py-2 text-[11px] uppercase tracking-[0.5px] font-semibold"
                            style={{ color: '#5C7A74' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agentPerf.agents?.map((a: any) => (
                      <tr key={a.id} className="border-t" style={{ borderColor: '#D4E5E1' }}>
                        <td className="py-2.5 text-[13px] font-semibold" style={{ color: '#1A2B26' }}>
                          {a.prenom} {a.nom}
                        </td>
                        <td className="py-2.5 text-[13px]" style={{ color: '#5C7A74' }}>
                          {a.periode.nbMissions}
                        </td>
                        <td className="py-2.5 text-[13px]" style={{ color: '#5C7A74' }}>
                          {a.periode.nbTerminees}
                        </td>
                        <td className="py-2.5">
                          <span className="text-[12px] font-bold px-2 py-0.5 rounded"
                                style={{
                                  background: a.periode.tauxCompletion >= 80 ? 'rgba(44,182,125,0.1)' : 'rgba(244,167,38,0.1)',
                                  color:      a.periode.tauxCompletion >= 80 ? '#2CB67D' : '#B07400',
                                }}>
                            {a.periode.tauxCompletion}%
                          </span>
                        </td>
                        <td className="py-2.5 text-[13px] font-bold" style={{ color: '#0A6E5C' }}>
                          {a.periode.revenuTotal.toLocaleString('fr-FR')} XOF
                        </td>
                        <td className="py-2.5">
                          {a.stocksEnAlerte > 0
                            ? <span className="text-[12px] font-semibold" style={{ color: '#E05C5C' }}>
                                ⚠️ {a.stocksEnAlerte}
                              </span>
                            : <span className="text-[12px]" style={{ color: '#2CB67D' }}>✅ OK</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
