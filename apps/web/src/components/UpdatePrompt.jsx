import { RefreshCw } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'
import { useTranslation } from 'react-i18next'
import { useCategoryStore } from '../store/categoryStore'

export default function UpdatePrompt() {
  const { t } = useTranslation()
  const { needsRefresh, updateApp } = usePWA()
  const { activeCategory } = useCategoryStore()
  const isFirst = activeCategory === 'FIRST'

  if (!needsRefresh) return null

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[100] animate-slide-up">
      <div className={`${isFirst ? 'bg-blue-600' : 'bg-purple-600'} text-white rounded-xl shadow-xl p-4 flex items-center gap-3`}>
        <RefreshCw className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {t('pwa.updateAvailable', 'A new version is available')}
          </p>
        </div>
        <button
          onClick={updateApp}
          className={`px-3 py-1.5 bg-white ${isFirst ? 'text-blue-600 hover:bg-blue-50' : 'text-purple-600 hover:bg-purple-50'} rounded-lg text-sm font-semibold transition-colors`}
        >
          {t('pwa.update', 'Update')}
        </button>
      </div>
    </div>
  )
}
