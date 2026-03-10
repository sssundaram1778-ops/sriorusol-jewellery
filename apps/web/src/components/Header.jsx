import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Gem } from 'lucide-react'
import { useCategoryStore } from '../store/categoryStore'

export default function Header({ title, subtitle, showBack = false, onBack, rightAction }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { activeCategory } = useCategoryStore()
  const isFirst = activeCategory === 'FIRST'

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header className="sticky top-0 z-40 safe-top">
      {/* Background with blur - Category Theme */}
      <div className={`absolute inset-0 ${isFirst ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500/30' : 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500/30'} backdrop-blur-md border-b`} />
      
      <div className="relative flex items-center justify-between h-14 lg:h-16 px-4">
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button 
              onClick={handleBack}
              className="
                w-9 h-9 rounded-lg flex items-center justify-center
                bg-white/20 hover:bg-white/30 border border-white/20
                transition-all duration-150
                active:scale-95
                -ml-1
              "
              aria-label="Go back"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-white" />
            </button>
          ) : (
            <div className="
              w-10 h-10 rounded-xl flex items-center justify-center
              bg-white/20 lg:hidden
            ">
              <Gem className="w-5 h-5 text-white" />
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-[17px] text-white truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className={`text-xs ${isFirst ? 'text-blue-100' : 'text-purple-100'} truncate`}>{subtitle}</p>
            )}
          </div>
        </div>
        
        {rightAction && (
          <div className="flex-shrink-0 ml-2">{rightAction}</div>
        )}
      </div>
    </header>
  )
}