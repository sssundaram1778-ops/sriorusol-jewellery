import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Plus, CheckCircle, Search, Menu, X, Landmark, Settings, History, List } from 'lucide-react'
import { useState } from 'react'

export default function BottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)

  // Main navigation items (always visible in bottom bar) - 4 items + More
  const mainNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/active', icon: CheckCircle, label: 'Active' },
    { to: '/new', icon: Plus, label: 'New', isCenter: true },
    { to: '/pledge', icon: Search, label: 'Search' },
  ]

  // More menu items - All remaining features
  const moreMenuItems = [
    { to: '/history', icon: History, label: 'History' },
    { to: '/all', icon: List, label: 'All Pledges' },
    { to: '/financers', icon: Landmark, label: 'Financers' },
    { to: '/settings', icon: Settings, label: 'Settings' }
  ]

  // Check if current path is in more menu (for highlighting More button)
  const isMoreActive = moreMenuItems.some(item => location.pathname === item.to)

  return (
    <>
      {/* More Menu Overlay */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowMenu(false)}
        >
          <div 
            className="absolute bottom-20 left-3 right-3 bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm">More Options</h3>
              <button 
                onClick={() => setShowMenu(false)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            {/* Menu Items - Grid 2x2 */}
            <div className="p-3 grid grid-cols-2 gap-2">
              {moreMenuItems.map(({ to, icon: Icon, label }) => {
                const isActive = location.pathname === to
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setShowMenu(false)}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all active:scale-95 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="text-sm font-semibold">{label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {/* Main Nav Items */}
          {mainNavItems.map(({ to, icon: Icon, label, isCenter }) => {
            const isActive = location.pathname === to
            
            if (isCenter) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="relative flex flex-col items-center justify-center -mt-5"
                >
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg
                    transition-all duration-200 active:scale-95
                    ${isActive 
                      ? 'bg-blue-700 shadow-blue-600/40' 
                      : 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-600/30'
                    }
                  `}>
                    <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center justify-center py-1.5 px-3 min-w-[60px]"
              >
                <div className={`
                  relative p-2 rounded-xl transition-all duration-200
                  ${isActive ? 'bg-blue-50' : ''}
                `}>
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <span className={`text-[10px] mt-0.5 font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </NavLink>
            )
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex flex-col items-center justify-center py-1.5 px-3 min-w-[60px]"
          >
            <div className={`
              relative p-2 rounded-xl transition-all duration-200
              ${showMenu || isMoreActive ? 'bg-blue-50' : ''}
            `}>
              <Menu className={`w-5 h-5 transition-colors ${showMenu || isMoreActive ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <span className={`text-[10px] mt-0.5 font-medium transition-colors ${showMenu || isMoreActive ? 'text-blue-600' : 'text-gray-400'}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}