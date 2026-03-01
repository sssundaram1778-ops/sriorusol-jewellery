import { useState, useEffect, useCallback } from 'react'
import { 
  getConnectionStatus, 
  subscribeToConnectionStatus, 
  checkConnection,
  isNeonConfigured 
} from '../lib/neonClient'

export const useNeonConnection = () => {
  const [status, setStatus] = useState(getConnectionStatus())
  const [isChecking, setIsChecking] = useState(false)
  const [lastError, setLastError] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((newStatus) => {
      setStatus(newStatus)
    })
    return unsubscribe
  }, [])

  const retry = useCallback(async () => {
    if (!isNeonConfigured) {
      setLastError('Database not configured')
      return false
    }

    setIsChecking(true)
    setLastError(null)
    
    try {
      const result = await checkConnection()
      if (!result.connected) {
        setLastError(result.error)
      }
      return result.connected
    } catch (error) {
      setLastError(error.message)
      return false
    } finally {
      setIsChecking(false)
    }
  }, [])

  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting' || isChecking,
    isDisconnected: status === 'disconnected',
    isConfigured: isNeonConfigured,
    lastError,
    retry
  }
}

export default useNeonConnection
