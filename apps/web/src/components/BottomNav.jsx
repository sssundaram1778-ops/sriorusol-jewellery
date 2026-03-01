import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Plus, CheckCircle, History } from 'lucide-react'

export default function BottomNav() {
  const { t } = useTranslation()
  const location = useLocation()

  const navItems = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/active', icon: CheckCircle, label: t('nav.active') },
    { to: '/new', icon: Plus, label: t('nav.newPledge'), isCenter: true },
    { to: '/history', icon: History, label: t('nav.history') }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-blue-50/98 backdrop-blur-lg border-t border-blue-200 z-50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label, isCenter }) => {
          const isActive = location.pathname === to || 
            (to === '/' && location.pathname === '/') ||
            (to !== '/' && location.pathname.startsWith(to))
          
          if (isCenter) {
            return (
              <NavLink
                key={to}
                to={to}
                className="relative flex flex-col items-center justify-center -mt-3"
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
              className="flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
            >
              <div className={`
                relative p-2.5 rounded-xl transition-all duration-200 border-2
                ${isActive ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-blue-300 hover:border-blue-500'}
              `}>
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </div>
              <span className={`text-[10px] mt-1 transition-colors tracking-wide ${isActive ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}


