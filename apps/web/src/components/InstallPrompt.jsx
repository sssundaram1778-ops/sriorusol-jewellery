import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'
import { useTranslation } from 'react-i18next'

export default function InstallPrompt() {
  const { t } = useTranslation()
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed, 10)
      // Show again after 7 days
      if (Date.now() - dismissedTime > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('pwa-install-dismissed')
      } else {
        setDismissed(true)
      }
    }
  }, [])

  useEffect(() => {
    // Show prompt after 30 seconds if installable
    if (isInstallable && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 30000)
      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled, dismissed])

  const handleInstall = async () => {
    const success = await installApp()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showPrompt || isInstalled) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Smartphone className="w-5 h-5" />
            <span className="font-semibold text-sm">{t('pwa.installTitle', 'Install App')}</span>
          </div>
          <button 
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-4">
            {t('pwa.installDescription', 'Install SUSS for quick access and offline use')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              {t('pwa.later', 'Later')}
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('pwa.install', 'Install')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
