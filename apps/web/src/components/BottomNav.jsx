import { NavLink, useLocation } from 'react-router-dom'
import { Home, Plus, Search, Landmark, Settings } from 'lucide-react'

export default function BottomNav() {
  const location = useLocation()

  // Clean 5-item navigation - no more menu needed
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/pledge', icon: Search, label: 'Search' },
    { to: '/new', icon: Plus, label: 'New', isCenter: true },
    { to: '/financers', icon: Landmark, label: 'Financers' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, isCenter }) => {
          const isActive = location.pathname === to
          
          if (isCenter) {
            return (
              <NavLink
                key={to}
                to={to}
                className="relative flex items-center justify-center -mt-4"
              >
                <div className={`
                  w-14 h-14 rounded-full flex items-center justify-center shadow-lg
                  transition-all duration-200 active:scale-95
                  ${isActive 
                    ? 'bg-blue-700 shadow-blue-700/30' 
                    : 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-600/25'
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
              className="flex flex-col items-center justify-center py-2 px-4 min-w-[64px] group"
            >
              <div className={`
                p-2 rounded-xl transition-all duration-200
                ${isActive ? 'bg-blue-50' : 'group-active:bg-gray-100'}
              `}>
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}