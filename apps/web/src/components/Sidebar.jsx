import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Home, 
  PlusCircle, 
  Search, 
  Settings,
  Gem,
  Landmark
} from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/new', icon: PlusCircle, labelKey: 'nav.newPledge' },
  { path: '/pledge', icon: Search, labelKey: 'nav.pledge' },
  { path: '/financers', icon: Landmark, labelKey: 'nav.financers' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-blue-50 border-r border-blue-200 flex flex-col z-50">
      {/* Logo Section */}
      <div className="p-5 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Gem className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Sri Orusol</h1>
            <p className="text-[11px] text-gray-500 font-medium">{t('app.tagline')}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location.pathname === path
          return (
            <NavLink
              key={path}
              to={path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border-2
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20 border-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-blue-300 hover:border-blue-500'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
              <span className="font-semibold text-sm tracking-wide truncate">{t(labelKey)}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-blue-200">
        <div className="bg-blue-100 rounded-xl p-4">
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">{t('app.version')}</p>
          <p className="text-sm font-bold text-gray-700">v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}


