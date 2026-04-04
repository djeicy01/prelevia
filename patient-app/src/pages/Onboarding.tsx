import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ChevronRight, Home, Shield, FileText } from 'lucide-react'

const SLIDES = [
  {
    icon: <Home size={52} strokeWidth={1.5} className="text-[#064D40]" />,
    title: 'Prélèvement à domicile',
    desc: 'Un agent qualifié se déplace chez vous à Yopougon et dans toute Abidjan. Plus besoin de vous déplacer au laboratoire.',
    bg: 'from-[#064D40]/8 to-[#064D40]/3',
  },
  {
    icon: <FileText size={52} strokeWidth={1.5} className="text-[#F4A726]" />,
    title: 'Résultats sur votre téléphone',
    desc: 'Photographiez votre ordonnance. Notre IA extrait automatiquement vos examens. Résultats disponibles en 24h.',
    bg: 'from-[#F4A726]/15 to-[#F4A726]/5',
  },
  {
    icon: <Shield size={52} strokeWidth={1.5} className="text-[#2CB67D]" />,
    title: 'Assurance prise en charge',
    desc: 'MUGEFCI, CNPS, NSIA Santé, Sanlam CI et plus. Vos examens couverts à 80%, seulement 20% à votre charge.',
    bg: 'from-[#2CB67D]/12 to-[#2CB67D]/3',
  },
]

export default function Onboarding() {
  const [slide, setSlide] = useState(0)
  const navigate = useNavigate()

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(slide + 1)
    else navigate('/register')
  }

  const skip = () => navigate('/login')

  const current = SLIDES[slide]

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
      {/* Skip */}
      <div className="flex justify-end px-5 pt-14 safe-top">
        <button onClick={skip} className="text-sm font-semibold text-[#5C7A74] hover:text-[#064D40]">
          Déjà un compte
        </button>
      </div>

      {/* Illustration */}
      <div className={`flex-1 flex flex-col items-center justify-center px-8 gap-8`}>
        <div className={`w-40 h-40 rounded-3xl bg-gradient-to-br ${current.bg} flex items-center justify-center`}>
          {current.icon}
        </div>

        {/* Slide content */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-extrabold text-[#1A2B26] leading-snug">{current.title}</h2>
          <p className="text-[#5C7A74] text-[15px] leading-relaxed max-w-xs mx-auto">{current.desc}</p>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`rounded-full transition-all ${i === slide ? 'w-6 h-2.5 bg-[#064D40]' : 'w-2.5 h-2.5 bg-[#D4E5E1]'}`}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 space-y-3 safe-bottom">
        <Button variant="primary" size="lg" fullWidth onClick={next}>
          {slide < SLIDES.length - 1 ? 'Continuer' : 'Commencer'}
          <ChevronRight size={18} />
        </Button>
        {slide < SLIDES.length - 1 && (
          <Button variant="ghost" size="md" fullWidth onClick={skip}>
            Se connecter
          </Button>
        )}
      </div>

      {/* Logo bottom */}
      <div className="pb-6 text-center safe-bottom">
        <p className="text-xs text-[#5C7A74]">
          Couvert par <span className="font-semibold text-[#064D40]">Labo Maison Blanche</span>
        </p>
      </div>
    </div>
  )
}
