import { WifiOff, Wifi } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'
import { useTranslation } from 'react-i18next'

export default function OfflineIndicator() {
  const { t } = useTranslation()
  const { isOnline } = usePWA()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] safe-top">
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="w-4 h-4" />
        <span>{t('pwa.offline', 'You are offline - Some features may be limited')}</span>
      </div>
    </div>
  )
}

export function OnlineIndicator() {
  const { t } = useTranslation()
  const { isOnline } = usePWA()

  // Show briefly when coming back online
  if (isOnline) {
    return null
  }

  return null
}
