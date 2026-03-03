import { useState, useEffect, useCallback, useRef } from 'react'
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
  const timeoutRef = useRef(null)

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((newStatus) => {
      setStatus(newStatus)
      // Clear timeout when status changes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    })
    return () => {
      unsubscribe()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Auto-timeout for stuck "connecting" state
  useEffect(() => {
    if (status === 'connecting') {
      timeoutRef.current = setTimeout(() => {
        if (getConnectionStatus() === 'connecting') {
          setStatus('disconnected')
          setLastError('Connection timeout - please retry')
        }
      }, 45000) // 45 second timeout
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [status])

  const retry = useCallback(async () => {
    if (!isNeonConfigured) {
      setLastError('Database not configured')
      return false
    }

    setIsChecking(true)
    setLastError(null)
    setStatus('connecting')
    
    try {
      const result = await checkConnection()
      if (!result.connected) {
        setLastError(result.error || 'Connection failed')
        setStatus('disconnected')
      }
      return result.connected
    } catch (error) {
      setLastError(error.message)
      setStatus('disconnected')
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
