import { useEffect, useState } from 'react'
import Topbar from '../components/layout/Topbar'

const IcoDossiers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)
const IcoPatients = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IcoRevenus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IcoMissions = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import { rapportsService } from '../services/rapports'
import type { DashboardData } from '../types'

export default function Dashboard() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    rapportsService.dashboard()
      .then(setData)
      .catch(() => setError('Impossible de charger le tableau de bord'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Tableau de bord" subtitle="Vue d'ensemble" />

      <div className="p-7 flex-1">
        {loading && (
          <div className="flex justify-center mt-20"><Spinner size={32} /></div>
        )}

        {error && (
          <div className="text-center mt-20 text-red-500 text-sm">{error}</div>
        )}

        {data && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3.5 mb-5">
              <StatCard
                icon={<IcoPatients />}
                label="Patients total"
                value={data.patients.total.toLocaleString('fr-FR')}
                sub={`+${data.patients.aujourdhui} aujourd'hui`}
              />
              <StatCard
                icon={<IcoDossiers />}
                label="Dossiers"
                value={data.dossiers.total.toLocaleString('fr-FR')}
                sub={`${data.dossiers.assurancesEnCours} assurances en cours`}
                color="#3B82F6"
              />
              <StatCard
                icon={<IcoRevenus />}
                label="Revenus du mois"
                value={`${data.revenus.mois.montant.toLocaleString('fr-FR')} XOF`}
                sub={`${data.revenus.jour.montant.toLocaleString('fr-FR')} XOF aujourd'hui`}
                color="#F4A726"
              />
              <StatCard
                icon={<IcoMissions />}
                label="Missions actives"
                value={data.terrain.missionsActives}
                sub={`${data.terrain.agentsActifs} agents actifs`}
                color="#7C3AED"
              />
            </div>

            {/* Ligne 2 */}
            <div className="grid grid-cols-2 gap-4">
              {/* Dossiers par statut */}
              <div className="bg-white rounded-[13px] border p-5" style={{ borderColor: '#D4E5E1' }}>
                <h2 className="text-sm font-bold mb-4" style={{ color: '#1A2B26' }}>Dossiers par statut</h2>
                <div className="space-y-2.5">
                  {Object.entries(data.dossiers.parStatut).map(([statut, count]) => (
                    <div key={statut} className="flex items-center justify-between text-sm">
                      <span style={{ color: '#5C7A74' }}>{statut.replace(/_/g, ' ')}</span>
                      <span className="font-bold" style={{ color: '#1A2B26' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sources OCR */}
              <div className="bg-white rounded-[13px] border p-5" style={{ borderColor: '#D4E5E1' }}>
                <h2 className="text-sm font-bold mb-4" style={{ color: '#1A2B26' }}>Sources OCR</h2>
                <div className="space-y-3">
                  {[
                    { label: '🤖 OCR automatique', data: data.ocr.auto },
                    { label: '✋ Sélection patient', data: data.ocr.patient },
                    { label: '🏍️ Saisie agent',    data: data.ocr.agent },
                    { label: '✏️ Manuel admin',     data: data.ocr.manual },
                  ].map(({ label, data: d }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[12px] mb-1" style={{ color: '#5C7A74' }}>
                        <span>{label}</span>
                        <span className="font-semibold">{d.count} ({d.pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#D4E5E1' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${d.pct}%`, background: '#0A6E5C' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Revenus annee */}
            <div className="mt-4 bg-white rounded-[13px] border p-5" style={{ borderColor: '#D4E5E1' }}>
              <h2 className="text-sm font-bold mb-1" style={{ color: '#1A2B26' }}>Revenus annuels</h2>
              <p className="text-[26px] font-extrabold mt-1" style={{ color: '#0A6E5C' }}>
                {data.revenus.annee.montant.toLocaleString('fr-FR')} XOF
              </p>
              <p className="text-xs mt-1" style={{ color: '#5C7A74' }}>
                {data.revenus.annee.count} paiements confirmés cette année
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
