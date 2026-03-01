import { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react'
import useSupabaseConnection from '../hooks/useSupabaseConnection'

export default function ConnectionStatus({ showWhenConnected = false }) {
  const { status, isConnected, isConnecting, isDisconnected, isConfigured, lastError, retry } = useSupabaseConnection()
  const [isRetrying, setIsRetrying] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Show banner when disconnected or not configured
    if (isDisconnected || !isConfigured) {
      setShowBanner(true)
    } else if (isConnected && !showWhenConnected) {
      // Hide after successful connection
      const timer = setTimeout(() => setShowBanner(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [status, isConnected, isDisconnected, isConfigured, showWhenConnected])

  const handleRetry = async () => {
    setIsRetrying(true)
    await retry()
    setIsRetrying(false)
  }

  if (!showBanner && isConnected && !showWhenConnected) {
    return null
  }

  // Not configured warning
  if (!isConfigured) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Supabase not configured
            </p>
            <p className="text-xs text-amber-600">
              Data is stored locally. Configure Supabase for cloud sync.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Connected state
  if (isConnected) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-800">Connected to cloud</span>
        </div>
      </div>
    )
  }

  // Connecting state
  if (isConnecting || isRetrying) {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <span className="text-sm font-medium text-blue-800">Connecting to database...</span>
        </div>
      </div>
    )
  }

  // Disconnected state
  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Connection failed</p>
            {lastError && (
              <p className="text-xs text-red-600 mt-0.5">{lastError}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          Retry
        </button>
      </div>
    </div>
  )
}
