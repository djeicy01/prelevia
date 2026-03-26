import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',           icon: '📊', label: 'Tableau de bord' },
  { to: '/patients',   icon: '🧬', label: 'Dossiers patients' },
  { to: '/assurances', icon: '🛡️', label: 'Assurances' },
  { to: '/paiements',  icon: '💳', label: 'Paiements' },
  { to: '/agents',     icon: '🏍️', label: 'Agents' },
  { to: '/missions',   icon: '📍', label: 'Missions' },
  { to: '/stock',      icon: '🧪', label: 'Stock matériel' },
  { to: '/rapports',   icon: '📈', label: 'Rapports' },
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

      {/* Navigation */}
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
