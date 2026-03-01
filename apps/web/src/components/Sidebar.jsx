import { NavLink, useLocation } from 'react-router-dom'
import { 
  Home, 
  PlusCircle, 
  Search, 
  Settings,
  Gem,
  Landmark
} from 'lucide-react'

// Clean 5-item navigation - same as mobile
const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/new', icon: PlusCircle, label: 'New Pledge' },
  { path: '/pledge', icon: Search, label: 'Search Pledges' },
  { path: '/financers', icon: Landmark, label: 'Financers' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Gem className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Sri Orusol</h1>
            <p className="text-xs text-slate-400 font-medium">Jewellery Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        <p className="px-4 py-2 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Menu</p>
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
          return (
            <NavLink
              key={path}
              to={path}
              className={`
                flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0`} />
              <span className="font-medium text-sm">{label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Version</p>
              <p className="text-sm font-bold text-white">v1.0.0</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>
    </aside>
  )
}


