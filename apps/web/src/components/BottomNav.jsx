import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Plus, CheckCircle, History, Search, Menu, X, Landmark, Settings, List } from 'lucide-react'
import { useState } from 'react'

export default function BottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)

  const navItems = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/active', icon: CheckCircle, label: t('nav.active') },
    { to: '/new', icon: Plus, label: t('nav.newPledge'), isCenter: true },
    { to: '/pledge', icon: Search, label: 'Search' },
    { to: null, icon: Menu, label: 'More', isMenu: true }
  ]

  const menuItems = [
    { to: '/history', icon: History, label: t('nav.history') },
    { to: '/all', icon: List, label: 'All Pledges' },
    { to: '/financers', icon: Landmark, label: t('nav.financers') },
    { to: '/settings', icon: Settings, label: t('nav.settings') }
  ]

  return (
    <>
      {/* More Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={() => setShowMenu(false)}>
          <div 
            className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">More Options</h3>
              <button 
                onClick={() => setShowMenu(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setShowMenu(false)}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                    location.pathname === to 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-lg border-t border-gray-200 z-40 safe-bottom shadow-lg shadow-gray-200/50">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
          {navItems.map(({ to, icon: Icon, label, isCenter, isMenu }) => {
            if (isMenu) {
              return (
                <button
                  key="menu"
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex flex-col items-center justify-center py-2 px-2 min-w-[56px]"
                >
                  <div className={`
                    relative p-2 rounded-xl transition-all duration-200
                    ${showMenu ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  `}>
                    <Icon className={`w-5 h-5 transition-colors ${showMenu ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[10px] mt-0.5 transition-colors ${showMenu ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
                    {label}
                  </span>
                </button>
              )
            }
            
            const isActive = location.pathname === to || 
              (to === '/' && location.pathname === '/') ||
              (to !== '/' && to !== null && location.pathname.startsWith(to))
            
            if (isCenter) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="relative flex flex-col items-center justify-center -mt-4"
                >
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg
                    transition-all duration-200 active:scale-95
                    ${isActive 
                      ? 'bg-blue-700 shadow-blue-600/30' 
                      : 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-600/25 hover:shadow-blue-600/40'
                    }
                  `}>
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center justify-center py-2 px-2 min-w-[56px]"
              >
                <div className={`
                  relative p-2 rounded-xl transition-all duration-200
                  ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                `}>
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
                  {label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}


