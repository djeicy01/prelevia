import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { useDossierStore } from '../../store/dossierStore'
import type { ParcourType } from '../../store/dossierStore'
import { Camera, Layout, Building2, BookOpen, ChevronRight } from 'lucide-react'

const OPTIONS: { code: ParcourType; icon: JSX.Element; title: string; desc: string; badge: string; badgeColor: string; bg: string; next: string }[] = [
  {
    code: 'A',
    icon: <Camera size={28} strokeWidth={1.5} className="text-[#064D40]" />,
    title: 'Ordonnance (A)',
    desc: "Photographiez votre bulletin d'analyses. Notre IA extrait automatiquement vos examens.",
    badge: 'Recommandé',
    badgeColor: 'bg-[#064D40] text-white',
    bg: 'bg-[#064D40]/5 border-[#064D40]/20',
    next: '/nouveau-dossier/ocr',
  },
  {
    code: 'B',
    icon: <Layout size={28} strokeWidth={1.5} className="text-[#F4A726]" />,
    title: 'Panels (B)',
    desc: 'Choisissez parmi nos panels prédéfinis : bilan diabète, bilan rénal, thyroïdien…',
    badge: 'Rapide',
    badgeColor: 'bg-[#F4A726] text-[#1A2B26]',
    bg: 'bg-[#F4A726]/5 border-[#F4A726]/20',
    next: '/nouveau-dossier/panels',
  },
  {
    code: 'C',
    icon: <Building2 size={28} strokeWidth={1.5} className="text-[#3B82F6]" />,
    title: 'Code campagne (C)',
    desc: 'Votre employeur ou votre mutuelle vous a fourni un code campagne de prélèvement.',
    badge: 'Entreprise',
    badgeColor: 'bg-[#3B82F6] text-white',
    bg: 'bg-blue-50 border-blue-100',
    next: '/nouveau-dossier/campagne',
  },
  {
    code: 'D',
    icon: <BookOpen size={28} strokeWidth={1.5} className="text-[#7C3AED]" />,
    title: 'Catalogue (D)',
    desc: 'Choisissez vos examens un par un dans notre catalogue complet.',
    badge: 'Libre',
    badgeColor: 'bg-[#7C3AED] text-white',
    bg: 'bg-purple-50 border-purple-100',
    next: '/nouveau-dossier/catalogue',
  },
]

export default function Parcours() {
  const navigate    = useNavigate()
  const setParcours = useDossierStore(s => s.setParcours)
  const reset       = useDossierStore(s => s.reset)

  const handleSelect = (code: ParcourType, next: string) => {
    reset()
    setParcours(code)
    navigate(next)
  }

  return (
    <AppLayout noNav>
      <PageHeader title="Nouveau dossier" subtitle="Choisissez votre parcours" back="/home" />

      <div className="px-5 py-6 space-y-4">
        <p className="text-sm text-[#5C7A74]">
          Comment souhaitez-vous nous transmettre vos examens ?
        </p>

        {OPTIONS.map(({ code, icon, title, desc, badge, badgeColor, bg, next }) => (
          <button
            key={code}
            onClick={() => handleSelect(code, next)}
            className={`w-full rounded-2xl p-5 border-2 text-left flex items-start gap-4 transition-all active:scale-[0.98] ${bg}`}
          >
            <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[16px] text-[#1A2B26]">{title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
              </div>
              <p className="text-[13px] text-[#5C7A74] leading-relaxed">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-[#5C7A74] mt-1 shrink-0" />
          </button>
        ))}
      </div>
    </AppLayout>
  )
}
