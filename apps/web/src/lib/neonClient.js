import { neon } from '@neondatabase/serverless'

// Get database URL from environment
const databaseUrl = import.meta.env.VITE_DATABASE_URL

// Check if Neon is configured
export const isNeonConfigured = databaseUrl && 
  databaseUrl !== 'your_database_url' &&
  databaseUrl.includes('neon.tech')

// Detect mobile browser
const isMobile = () => {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Check if running on Vercel (production) or localhost
const isProduction = () => {
  if (typeof window === 'undefined') return false
  return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
}

// API URL for serverless functions
const getApiUrl = () => {
  if (typeof window === 'undefined') return '/api/db'
  return `${window.location.origin}/api/db`
}

// Use API on mobile/production, direct connection on localhost desktop
const shouldUseApi = () => isMobile() || isProduction()

// Create Neon SQL client - only for desktop localhost
const directSql = isNeonConfigured && !shouldUseApi() ? neon(databaseUrl, {
  fetchOptions: {
    cache: 'no-store',
  }
}) : null

// Log connection info for debugging
if (typeof console !== 'undefined') {
  console.log('Neon configured:', isNeonConfigured)
  console.log('Mobile device:', isMobile())
  console.log('Production:', isProduction())
  console.log('Using API:', shouldUseApi())
}

// Connection state management
let connectionStatus = 'unknown'
let lastConnectionCheck = null
let connectionListeners = []
let useApiMode = shouldUseApi()

export const getConnectionStatus = () => connectionStatus
export const getLastConnectionCheck = () => lastConnectionCheck

// Subscribe to connection status changes
export const subscribeToConnectionStatus = (callback) => {
  connectionListeners.push(callback)
  return () => {
    connectionListeners = connectionListeners.filter(cb => cb !== callback)
  }
}

const notifyConnectionListeners = (status) => {
  connectionStatus = status
  lastConnectionCheck = new Date()
  connectionListeners.forEach(cb => cb(status))
}

// API call helper
const apiCall = async (action, data = {}) => {
  const response = await fetch(getApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, data }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API request failed: ${response.status}`)
  }
  
  return response.json()
}

// Proxy SQL function that uses API when needed
const createSqlProxy = () => {
  // Return a function that mimics neon's tagged template literal
  const sqlProxy = async (strings, ...values) => {
    if (!useApiMode && directSql) {
      // Use direct connection
      return directSql(strings, ...values)
    }
    
    // Convert tagged template to SQL query string
    let query = strings[0]
    const params = []
    for (let i = 0; i < values.length; i++) {
      params.push(values[i])
      query += `$${i + 1}` + strings[i + 1]
    }
    
    // Use API endpoint for raw SQL
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'rawSql', 
        data: { query, params } 
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `SQL request failed: ${response.status}`)
    }
    
    const result = await response.json()
    return result.data || []
  }
  
  return sqlProxy
}

// Export sql - uses proxy that can switch between direct and API
export const sql = isNeonConfigured ? createSqlProxy() : null

// Health check function with API fallback
export const checkConnection = async (retries = 2) => {
  if (!isNeonConfigured) {
    return { connected: false, error: 'Neon not configured' }
  }

  // Try API first for mobile/production
  if (useApiMode) {
    try {
      notifyConnectionListeners('connecting')
      const result = await apiCall('check')
      if (result.connected) {
        notifyConnectionListeners('connected')
        return { connected: true, error: null }
      }
    } catch (error) {
      console.error('API connection check failed:', error.message)
    }
  }

  // Try direct connection for desktop
  if (directSql && !useApiMode) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        notifyConnectionListeners('connecting')
        await directSql`SELECT 1`
        notifyConnectionListeners('connected')
        return { connected: true, error: null }
      } catch (error) {
        console.error(`Direct connection attempt ${attempt + 1} failed:`, error.message)
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }
    
    // Fallback to API if direct fails
    console.log('Direct connection failed, trying API...')
    useApiMode = true
    try {
      notifyConnectionListeners('connecting')
      const result = await apiCall('check')
      if (result.connected) {
        notifyConnectionListeners('connected')
        return { connected: true, error: null }
      }
    } catch (error) {
      console.error('API fallback failed:', error.message)
    }
  }

  notifyConnectionListeners('disconnected')
  return { connected: false, error: 'Connection failed' }
}

// Keep-alive ping
export const keepAlive = async () => {
  if (!isNeonConfigured) return false
  
  try {
    if (useApiMode) {
      const result = await apiCall('check')
      return result.connected
    }
    if (directSql) {
      await directSql`SELECT 1`
      return true
    }
    return false
  } catch {
    return false
  }
}

// Initialize connection check on load
if (isNeonConfigured) {
  setTimeout(() => {
    checkConnection().then(result => {
      console.log('Initial connection:', result.connected ? 'Connected' : 'Disconnected')
    })
  }, 100)
}
