import { NavLink } from 'react-router-dom'
import { Home, FolderOpen, Activity, User } from 'lucide-react'

const TABS = [
  { to: '/home',      icon: Home,       label: 'Accueil'   },
  { to: '/resultats', icon: Activity,   label: 'Résultats' },
  { to: '/profil',    icon: User,       label: 'Profil'    },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D4E5E1] safe-bottom z-40">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors
               ${isActive ? 'text-[#064D40]' : 'text-[#5C7A74]'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[#064D40]/10' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
