import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = supabaseUrl && supabaseKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseKey !== 'your_supabase_anon_key'

// Create Supabase client with retry configuration
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-client-info': 'sriorusol-jeweller'
        }
      }
    })
  : null

// Connection state management
let connectionStatus = 'unknown' // 'connected', 'disconnected', 'connecting', 'unknown'
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

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
}

// Calculate delay with exponential backoff
const getRetryDelay = (attempt) => {
  const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt)
  return Math.min(delay, RETRY_CONFIG.maxDelay)
}

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Execute with retry logic
export const executeWithRetry = async (operation, operationName = 'operation') => {
  if (!supabase) {
    console.warn(`Supabase not configured. Falling back to localStorage for ${operationName}`)
    return { data: null, error: { message: 'Supabase not configured', code: 'NOT_CONFIGURED' } }
  }

  let lastError = null
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1)
        console.log(`Retrying ${operationName} (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}) after ${delay}ms...`)
        await sleep(delay)
      }

      notifyConnectionListeners('connecting')
      const result = await operation()
      
      if (result.error) {
        lastError = result.error
        
        // Don't retry on certain errors
        if (result.error.code === 'PGRST116' || // Row not found
            result.error.code === '23505' ||    // Unique violation
            result.error.code === '42501') {    // Permission denied
          notifyConnectionListeners('connected')
          return result
        }
        
        // Retry on network/timeout errors
        if (attempt < RETRY_CONFIG.maxRetries) {
          console.warn(`${operationName} failed:`, result.error.message)
          continue
        }
      } else {
        notifyConnectionListeners('connected')
        return result
      }
    } catch (error) {
      lastError = error
      console.error(`${operationName} exception:`, error.message)
      
      if (attempt === RETRY_CONFIG.maxRetries) {
        notifyConnectionListeners('disconnected')
        throw error
      }
    }
  }

  notifyConnectionListeners('disconnected')
  return { data: null, error: lastError }
}

// Health check function
export const checkConnection = async () => {
  if (!supabase) {
    return { connected: false, error: 'Supabase not configured' }
  }

  try {
    notifyConnectionListeners('connecting')
    const { error } = await supabase.from('pledges').select('id').limit(1)
    
    if (error) {
      notifyConnectionListeners('disconnected')
      return { connected: false, error: error.message }
    }
    
    notifyConnectionListeners('connected')
    return { connected: true, error: null }
  } catch (error) {
    notifyConnectionListeners('disconnected')
    return { connected: false, error: error.message }
  }
}

// Keep-alive ping (prevents Supabase free tier from pausing)
export const keepAlive = async () => {
  if (!supabase) return false
  
  try {
    const { error } = await supabase.from('pledges').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

// Initialize connection check on load
if (supabase) {
  checkConnection().then(result => {
    console.log('Initial Supabase connection:', result.connected ? 'Connected' : 'Disconnected')
  })
}
