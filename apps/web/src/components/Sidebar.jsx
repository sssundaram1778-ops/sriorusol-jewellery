import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Home, 
  PlusCircle, 
  Search, 
  Settings,
  Gem,
  Landmark,
  CheckCircle,
  History,
  List
} from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/new', icon: PlusCircle, labelKey: 'nav.newPledge' },
  { path: '/active', icon: CheckCircle, labelKey: 'nav.active' },
  { path: '/pledge', icon: Search, labelKey: 'nav.pledge' },
  { path: '/history', icon: History, labelKey: 'nav.history' },
  { path: '/all', icon: List, labelKey: 'All Pledges', isStatic: true },
  { path: '/financers', icon: Landmark, labelKey: 'nav.financers' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 shadow-sm">
      {/* Logo Section */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Gem className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Sri Orusol</h1>
            <p className="text-xs text-gray-500 font-medium">{t('app.tagline')}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, labelKey, isStatic }) => {
          const isActive = location.pathname === path
          return (
            <NavLink
              key={path}
              to={path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              <span className="font-medium text-sm">{isStatic ? labelKey : t(labelKey)}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider font-semibold">{t('app.version')}</p>
          <p className="text-sm font-bold text-blue-700">v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}


