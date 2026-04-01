import { NavLink } from 'react-router-dom'

// SVG inline — pas de dépendance lucide-react requise
const IconUsers = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconFlask = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6"/><path d="M10 9 4.5 19.5A1 1 0 0 0 5.4 21h13.2a1 1 0 0 0 .9-1.5L14 9"/>
    <path d="M8.5 9h7"/>
  </svg>
)

const NAV: { to: string; icon: React.ReactNode; label: string }[] = [
  { to: '/',           icon: '📊',           label: 'Tableau de bord' },
  { to: '/patients',   icon: <IconUsers />,  label: 'Dossiers patients' },
  { to: '/assurances', icon: '🛡️',          label: 'Assurances' },
  { to: '/paiements',  icon: '💳',           label: 'Paiements' },
  { to: '/agents',     icon: '🏍️',          label: 'Agents' },
  { to: '/missions',   icon: '📍',           label: 'Missions' },
  { to: '/stock',      icon: <IconFlask />,  label: 'Stock matériel' },
  { to: '/rapports',   icon: '📈',           label: 'Rapports' },
]

const NAV_BOTTOM = [
  { to: '/parametres', icon: '⚙️', label: 'Paramètres' },
]

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[255px] flex flex-col z-40"
           style={{ background: '#064D40' }}>

      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="font-serif text-[22px] font-semibold text-white leading-tight">
          Prele<span style={{ color: '#F4A726' }}>via</span>
        </div>
        <div className="text-[10px] text-white/40 uppercase tracking-[1.5px] mt-1">
          Back-office
        </div>
      </div>

      {/* Badge couverture Phase 1 */}
      <div className="mx-3.5 mt-3 rounded-lg px-3 py-2 text-[11px] leading-relaxed"
           style={{ background: 'rgba(244,167,38,0.12)', border: '1px solid rgba(244,167,38,0.25)', color: '#FFC94D' }}>
        <strong className="block text-[9px] uppercase tracking-[1px] mb-0.5 opacity-65">
          Couverture Phase 1
        </strong>
        Labo Maison Blanche · Yopougon
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-2.5 py-2 overflow-y-auto space-y-0.5">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] text-[13px] font-medium transition-all duration-150 ` +
              (isActive
                ? 'text-white bg-[#0A6E5C]'
                : 'text-white/55 hover:text-white hover:bg-white/7')
            }
          >
            <span className="text-[17px] w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Navigation bas — Paramètres */}
      <div className="px-2.5 pb-2 border-t border-white/10 pt-2">
        {NAV_BOTTOM.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] text-[13px] font-medium transition-all duration-150 ` +
              (isActive
                ? 'text-white bg-[#0A6E5C]'
                : 'text-white/55 hover:text-white hover:bg-white/7')
            }
          >
            <span className="text-[17px] w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Footer utilisateur */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 p-2.5 rounded-[9px]"
             style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
               style={{ background: '#0A6E5C' }}>
            AD
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Administrateur</div>
            <div className="text-[10px] text-white/35">Super Admin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
