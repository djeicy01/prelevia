import { useEffect, useState, useCallback } from 'react'
import Topbar from '../components/layout/Topbar'
import Spinner from '../components/ui/Spinner'
import { BadgePaiement } from '../components/ui/Badge'
import { paiementsService } from '../services/paiements'
import type { Paiement } from '../types'

const MODES_LABELS: Record<string, string> = {
  CASH:         '💵 Espèces',
  ORANGE_MONEY: '🟠 Orange Money',
  MTN_MONEY:    '🟡 MTN Money',
  WAVE:         '🔵 Wave',
  VIREMENT:     '🏦 Virement',
}

export default function Paiements() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [stats, setStats]         = useState<any>(null)
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      paiementsService.list({ page, limit: 20 }),
      paiementsService.stats(),
    ])
      .then(([list, s]) => {
        setPaiements(list.data)
        setTotal(list.total)
        setStats(s)
      })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const confirmer = async (id: string) => {
    setConfirming(id)
    try { await paiementsService.confirmer(id); load() }
    finally { setConfirming(null) }
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Paiements" subtitle={`${total} paiements`} />

      <div className="p-7 flex-1">
        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-4 gap-3.5 mb-5">
            {[
              { label: 'Total encaissé', value: `${stats.totalEncaisse.toLocaleString('fr-FR')} XOF`, icon: '💰' },
              { label: 'Aujourd\'hui',   value: `${stats.jour.montant.toLocaleString('fr-FR')} XOF`,  icon: '📅' },
              { label: 'Ce mois',        value: `${stats.mois.montant.toLocaleString('fr-FR')} XOF`,  icon: '📆' },
              { label: 'En attente',     value: stats.nbEnAttente,                                      icon: '⏳' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white rounded-[13px] border p-4 flex items-center gap-3"
                   style={{ borderColor: '#D4E5E1' }}>
                <div className="text-2xl">{icon}</div>
                <div>
                  <div className="text-[18px] font-extrabold" style={{ color: '#1A2B26' }}>{value}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: '#5C7A74' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Répartition par mode */}
        {stats?.parMode?.length > 0 && (
          <div className="bg-white rounded-[13px] border p-4 mb-5 flex flex-wrap gap-4"
               style={{ borderColor: '#D4E5E1' }}>
            {stats.parMode.map((m: any) => (
              <div key={m.mode} className="flex items-center gap-2 text-sm">
                <span>{MODES_LABELS[m.mode] ?? m.mode}</span>
                <span className="font-bold" style={{ color: '#0A6E5C' }}>
                  {m.montant.toLocaleString('fr-FR')} XOF
                </span>
                <span className="text-xs" style={{ color: '#5C7A74' }}>({m.count})</span>
              </div>
            ))}
          </div>
        )}

        {/* Tableau */}
        <div className="bg-white rounded-[13px] border overflow-hidden" style={{ borderColor: '#D4E5E1' }}>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: '#F5F7F6' }}>
                  {['Dossier', 'Patient', 'Mode', 'Montant', 'Part assurance', 'Statut', 'Date', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] uppercase tracking-[0.7px] font-semibold"
                        style={{ color: '#5C7A74' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id} className="border-t hover:bg-[#F5F7F6]/50"
                      style={{ borderColor: '#D4E5E1' }}>
                    <td className="px-4 py-3 text-[12px] font-mono font-semibold" style={{ color: '#0A6E5C' }}>
                      {p.dossier?.ref ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: '#1A2B26' }}>
                      {p.dossier?.patient
                        ? `${p.dossier.patient.prenom} ${p.dossier.patient.nom}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#5C7A74' }}>
                      {MODES_LABELS[p.mode] ?? p.mode}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold" style={{ color: '#1A2B26' }}>
                      {p.montant.toLocaleString('fr-FR')} XOF
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: '#5C7A74' }}>
                      {p.finances
                        ? `${p.finances.partAssurance.toLocaleString('fr-FR')} XOF`
                        : '—'}
                    </td>
                    <td className="px-4 py-3"><BadgePaiement statut={p.statut} /></td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: '#5C7A74' }}>
                      {p.encaisseA
                        ? new Date(p.encaisseA).toLocaleDateString('fr-FR')
                        : new Date(p.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      {p.statut === 'EN_ATTENTE' && (
                        <button
                          onClick={() => confirmer(p.id)}
                          disabled={confirming === p.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
                          style={{ background: '#2CB67D' }}
                        >
                          {confirming === p.id ? <Spinner size={12} /> : '✓'}
                          Confirmer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-[13px]"
                 style={{ borderColor: '#D4E5E1', color: '#5C7A74' }}>
              <span>{total} paiements</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 rounded border text-xs disabled:opacity-40"
                        style={{ borderColor: '#D4E5E1' }}>← Précédent</button>
                <span className="px-2 py-1 text-xs font-semibold">Page {page}</span>
                <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 rounded border text-xs disabled:opacity-40"
                        style={{ borderColor: '#D4E5E1' }}>Suivant →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
