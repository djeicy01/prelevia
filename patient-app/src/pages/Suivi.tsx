import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { dossiersApi } from '../services/api'
import type { Dossier } from '../types'
import {
  CheckCircle, Circle, Clock, Navigation, Syringe,
  CreditCard, FlaskConical, FileText, Loader2,
} from 'lucide-react'

const STEPS = [
  { key: 'RDV',         label: 'RDV créé',              icon: FileText    },
  { key: 'DOCS',        label: 'Documents envoyés',     icon: FileText    },
  { key: 'OCR',         label: 'Examens analysés',      icon: FlaskConical },
  { key: 'ASSURANCE',   label: 'Assurance soumise',     icon: CheckCircle },
  { key: 'EN_ROUTE',    label: 'Agent en route',        icon: Navigation  },
  { key: 'PRELEVEMENT', label: 'Prélèvement effectué', icon: Syringe     },
  { key: 'PAIEMENT',    label: 'Paiement confirmé',     icon: CreditCard  },
  { key: 'RESULTATS',   label: 'Résultats disponibles', icon: CheckCircle },
]

function getCompletedSteps(dossier: Dossier): number {
  const s = dossier.statut
  if (s === 'ARCHIVE') return 8
  if (s === 'PAYE') return 7
  if (s === 'PRELEVEMENT_FAIT') return 6
  if (s === 'PRET_PRELEVEMENT') {
    if (dossier.missionId) return 5
    return 4
  }
  return dossier.bulletinUrl ? 3 : 2
}

export default function Suivi() {
  const { id }  = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [eta, setEta]         = useState(18) // minutes

  useEffect(() => {
    if (!id) return
    dossiersApi.getDossier(id)
      .then(data => setDossier(data.dossier ?? data))
      .catch(() => navigate('/home'))
      .finally(() => setLoading(false))

    // Polling toutes les 30s
    const poll = setInterval(() => {
      dossiersApi.getDossier(id!)
        .then(data => setDossier(data.dossier ?? data))
        .catch(() => {})
    }, 30_000)
    return () => clearInterval(poll)
  }, [id])

  // ETA countdown when agent en route
  useEffect(() => {
    if (!dossier || dossier.statut !== 'PRET_PRELEVEMENT') return
    const t = setInterval(() => setEta(p => (p > 1 ? p - 1 : 1)), 60_000)
    return () => clearInterval(t)
  }, [dossier?.statut])

  if (loading) return (
    <AppLayout noNav>
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="text-[#064D40] animate-spin" />
      </div>
    </AppLayout>
  )

  if (!dossier) return null
  const completed = getCompletedSteps(dossier)
  const agentEnRoute = dossier.statut === 'PRET_PRELEVEMENT' && !!dossier.missionId

  return (
    <AppLayout noNav>
      <PageHeader title={`Suivi — ${dossier.ref}`} subtitle="Avancement de votre dossier" back="/home" />

      <div className="px-5 py-5 space-y-5">
        {/* Agent en route card */}
        {agentEnRoute && (
          <div className="bg-[#064D40] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Navigation size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold">Agent en route</p>
                <p className="text-white/70 text-sm">
                  {dossier.mission?.agent
                    ? `${dossier.mission.agent.prenom} ${dossier.mission.agent.nom}`
                    : 'Agent Prelevia'}
                </p>
              </div>
              <div className="ml-auto text-center">
                <p className="text-3xl font-extrabold">{eta}</p>
                <p className="text-white/70 text-xs">min</p>
              </div>
            </div>
            {dossier.mission?.agent && (
              <a
                href={`tel:${dossier.mission.agent.telephone}`}
                className="block w-full text-center py-2.5 rounded-xl bg-white/20 text-sm font-bold hover:bg-white/30 transition-colors"
              >
                📞 Appeler l'agent
              </a>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-[#D4E5E1] p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#1A2B26] mb-5">Timeline</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-[#D4E5E1]" />
            <div
              className="absolute left-[18px] top-0 w-0.5 bg-[#064D40] transition-all duration-700"
              style={{ height: `${Math.min((completed / STEPS.length) * 100, 95)}%` }}
            />

            <div className="space-y-5">
              {STEPS.map((step, i) => {
                const done    = i < completed
                const current = i === completed
                const Icon    = step.icon
                return (
                  <div key={step.key} className="flex items-center gap-4 relative z-10">
                    <div
                      className={`
                        w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                        ${done    ? 'bg-[#064D40] border-[#064D40]' : ''}
                        ${current ? 'bg-white border-[#064D40] shadow-[0_0_0_4px_rgba(6,77,64,0.15)]' : ''}
                        ${!done && !current ? 'bg-white border-[#D4E5E1]' : ''}
                      `}
                    >
                      {done ? (
                        <CheckCircle size={16} className="text-white" />
                      ) : current ? (
                        <Icon size={16} className="text-[#064D40]" />
                      ) : (
                        <Circle size={16} className="text-[#D4E5E1]" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${done || current ? 'text-[#1A2B26]' : 'text-[#5C7A74]'}`}>
                        {step.label}
                      </p>
                      {current && (
                        <p className="text-xs text-[#064D40] font-medium flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          En cours…
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Examens */}
        <div className="bg-white rounded-2xl border border-[#D4E5E1] overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#D4E5E1]">
            <p className="text-sm font-bold text-[#1A2B26]">{dossier.examens?.length ?? 0} examen(s) demandé(s)</p>
          </div>
          {dossier.examens?.slice(0, 4).map(e => (
            <div key={e.id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#D4E5E1] last:border-0">
              <span className="text-sm text-[#1A2B26]">{e.catalogue?.nom ?? '—'}</span>
              <span className="text-xs font-bold text-[#5C7A74]">{e.tarif?.toLocaleString()} XOF</span>
            </div>
          ))}
        </div>

        {/* CTA Paiement */}
        {dossier.statut === 'PRELEVEMENT_FAIT' && (
          <Button
            variant="accent"
            size="lg"
            fullWidth
            onClick={() => navigate('/paiement', {
              state: {
                dossierId: dossier.id,
                montant: dossier.examens?.reduce((s, e) => s + (e.quotePart ?? e.tarif), 0) ?? 0,
              }
            })}
          >
            Régler mon dossier
          </Button>
        )}

        {/* CTA Résultats */}
        {dossier.statut === 'PAYE' && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate(`/resultats/${dossier.id}`)}
          >
            Voir mes résultats
          </Button>
        )}
      </div>
    </AppLayout>
  )
}
