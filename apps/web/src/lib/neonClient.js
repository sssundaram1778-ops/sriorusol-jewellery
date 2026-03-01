import { neon } from '@neondatabase/serverless'

// Get database URL from environment
const databaseUrl = import.meta.env.VITE_DATABASE_URL

// Check if Neon is configured
export const isNeonConfigured = databaseUrl && 
  databaseUrl !== 'your_database_url' &&
  databaseUrl.includes('neon.tech')

// Create Neon SQL client
export const sql = isNeonConfigured ? neon(databaseUrl) : null

// Connection state management
let connectionStatus = 'unknown'
let lastConnectionCheck = null
let connectionListeners = []

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

// Execute SQL with error handling
export const executeSQL = async (query, params = []) => {
  if (!sql) {
    console.warn('Neon not configured. Falling back to localStorage')
    return { data: null, error: { message: 'Neon not configured', code: 'NOT_CONFIGURED' } }
  }

  try {
    notifyConnectionListeners('connecting')
    const result = await sql(query, params)
    notifyConnectionListeners('connected')
    return { data: result, error: null }
  } catch (error) {
    console.error('Neon query error:', error.message)
    notifyConnectionListeners('disconnected')
    return { data: null, error: { message: error.message, code: error.code || 'QUERY_ERROR' } }
  }
}

// Health check function
export const checkConnection = async () => {
  if (!sql) {
    return { connected: false, error: 'Neon not configured' }
  }

  try {
    notifyConnectionListeners('connecting')
    await sql`SELECT 1`
    notifyConnectionListeners('connected')
    return { connected: true, error: null }
  } catch (error) {
    notifyConnectionListeners('disconnected')
    return { connected: false, error: error.message }
  }
}

// Keep-alive ping
export const keepAlive = async () => {
  if (!sql) return false
  
  try {
    await sql`SELECT 1`
    return true
  } catch {
    return false
  }
}

// Initialize connection check on load
if (sql) {
  checkConnection().then(result => {
    console.log('Initial Neon connection:', result.connected ? 'Connected' : 'Disconnected')
  })
}
