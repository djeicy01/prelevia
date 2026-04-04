import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { dossiersApi } from '../services/api'
import type { Dossier } from '../types'
import {
  Plus, ChevronRight, Clock, CheckCircle, AlertCircle,
  FileText, Activity, Loader2,
} from 'lucide-react'

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  EN_ATTENTE:       { label: 'En attente',         color: 'bg-amber-100 text-amber-700',   icon: <Clock size={14} /> },
  PRET_PRELEVEMENT: { label: 'Prêt pour visite',   color: 'bg-blue-100 text-blue-700',     icon: <CheckCircle size={14} /> },
  PRELEVEMENT_FAIT: { label: 'Prélèvement fait',   color: 'bg-purple-100 text-purple-700', icon: <Activity size={14} /> },
  PAYE:             { label: 'Payé',               color: 'bg-green-100 text-green-700',   icon: <CheckCircle size={14} /> },
  ARCHIVE:          { label: 'Archivé',            color: 'bg-gray-100 text-gray-500',     icon: <FileText size={14} /> },
}

function DossierCard({ dossier }: { dossier: Dossier }) {
  const navigate = useNavigate()
  const cfg = STATUT_CONFIG[dossier.statut] ?? STATUT_CONFIG.EN_ATTENTE
  const date = new Date(dossier.createdAt).toLocaleDateString('fr-CI', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <button
      onClick={() => navigate(`/suivi/${dossier.id}`)}
      className="w-full bg-white rounded-2xl p-4 border border-[#D4E5E1] shadow-sm text-left flex items-center gap-4 hover:border-[#064D40]/30 transition-all active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-xl bg-[#064D40]/8 flex items-center justify-center shrink-0">
        <FileText size={18} className="text-[#064D40]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-[#1A2B26] truncate">{dossier.ref}</span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.icon}{cfg.label}
          </span>
        </div>
        <p className="text-xs text-[#5C7A74]">
          {dossier.examens?.length ?? 0} examen(s) · {date}
        </p>
      </div>
      <ChevronRight size={16} className="text-[#5C7A74] shrink-0" />
    </button>
  )
}

export default function Home() {
  const navigate   = useNavigate()
  const patient    = useAuthStore(s => s.patient)
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    dossiersApi.getMesDossiers()
      .then(data => setDossiers(data.dossiers ?? data ?? []))
      .catch(() => setDossiers([]))
      .finally(() => setLoading(false))
  }, [])

  const actifs = dossiers.filter(d => !['PAYE', 'ARCHIVE'].includes(d.statut))
  const histo  = dossiers.filter(d =>  ['PAYE', 'ARCHIVE'].includes(d.statut)).slice(0, 3)

  const heure = new Date().getHours()
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-[#064D40] px-5 pt-14 pb-8 safe-top text-white">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/70 text-sm">{salut} 👋</p>
            <h1 className="text-xl font-extrabold mt-0.5">
              {patient?.prenom} {patient?.nom}
            </h1>
          </div>
          <button
            onClick={() => navigate('/profil')}
            className="w-10 h-10 rounded-full bg-[#F4A726] flex items-center justify-center font-bold text-[#1A2B26] text-sm"
          >
            {patient?.prenom?.[0]}{patient?.nom?.[0]}
          </button>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Dossiers',  val: dossiers.length,  color: 'bg-white/15' },
            { label: 'En cours',  val: actifs.length,    color: 'bg-white/15' },
            { label: 'Résultats', val: histo.length,     color: 'bg-white/15' },
          ].map(({ label, val, color }) => (
            <div key={label} className={`${color} rounded-xl p-3 text-center`}>
              <div className="text-xl font-extrabold">{val}</div>
              <div className="text-white/70 text-[11px] mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Nouveau dossier CTA */}
        <button
          onClick={() => navigate('/nouveau-dossier/parcours')}
          className="w-full bg-[#F4A726] rounded-2xl p-5 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center shrink-0">
            <Plus size={22} className="text-[#1A2B26]" strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="font-extrabold text-[#1A2B26] text-[15px]">Nouveau dossier</p>
            <p className="text-[#1A2B26]/60 text-xs mt-0.5">Ordonnance · Panels · Campagne</p>
          </div>
          <ChevronRight size={18} className="text-[#1A2B26]/50 ml-auto shrink-0" />
        </button>

        {/* Dossiers en cours */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="text-[#064D40] animate-spin" />
          </div>
        ) : actifs.length > 0 ? (
          <section>
            <h2 className="text-sm font-bold text-[#1A2B26] mb-3 flex items-center gap-2">
              <AlertCircle size={14} className="text-[#F4A726]" />
              Dossiers en cours ({actifs.length})
            </h2>
            <div className="space-y-2">
              {actifs.map(d => <DossierCard key={d.id} dossier={d} />)}
            </div>
          </section>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-[#D4E5E1] text-center">
            <FileText size={32} className="text-[#D4E5E1] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#1A2B26]">Aucun dossier en cours</p>
            <p className="text-xs text-[#5C7A74] mt-1">Créez votre premier dossier pour démarrer</p>
          </div>
        )}

        {/* Historique */}
        {histo.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#1A2B26]">Historique</h2>
              <button onClick={() => navigate('/resultats')} className="text-xs font-semibold text-[#064D40]">
                Voir tout
              </button>
            </div>
            <div className="space-y-2">
              {histo.map(d => <DossierCard key={d.id} dossier={d} />)}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  )
}
