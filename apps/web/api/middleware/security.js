// Security Middleware for API Routes
// Phase 1: Basic Security Implementation

// Rate limiting store (in-memory for serverless, consider Redis for production)
const rateLimitStore = new Map()

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // Max requests per window
const BLOCKED_IPS_TTL = 15 * 60 * 1000 // 15 minutes block

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://sriorusol-jeweller.vercel.app',
  'https://sriorusol-jeweller-*.vercel.app'
]

// SQL injection patterns to block
const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|create|alter|truncate|exec|execute)\b.*\b(from|into|table|database|schema)\b)/i,
  /(-{2}|\/\*|\*\/|;--)/,
  /(\bor\b|\band\b).*[=<>]/i,
  /['"].*(\bor\b|\band\b).*['"]/i,
  /\b(sleep|benchmark|waitfor|delay)\s*\(/i,
  /\b(load_file|outfile|dumpfile)\b/i
]

// XSS patterns to sanitize
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi
]

/**
 * Get client IP from request
 */
export const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         'unknown'
}

/**
 * Check if origin is allowed
 */
export const isOriginAllowed = (origin) => {
  if (!origin) return true // Allow requests without origin (server-side)
  
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$')
      return regex.test(origin)
    }
    return allowed === origin
  })
}

/**
 * Rate limiting check
 */
export const checkRateLimit = (ip) => {
  const now = Date.now()
  const key = `rate_${ip}`
  
  // Clean old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (now - v.timestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(k)
    }
  }
  
  const record = rateLimitStore.get(key)
  
  if (!record) {
    rateLimitStore.set(key, { count: 1, timestamp: now })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }
  
  if (now - record.timestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, timestamp: now })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }
  
  record.count++
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - record.count)
  
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }
  
  return { allowed: true, remaining }
}

/**
 * Check for SQL injection attempts
 */
export const detectSqlInjection = (value) => {
  if (typeof value !== 'string') return false
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value))
}

/**
 * Sanitize input value
 */
export const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value
  
  let sanitized = value
  
  // Remove XSS patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 10000)
  
  return sanitized
}

/**
 * Recursively sanitize object
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (typeof obj === 'object') {
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key too
      const safeKey = sanitizeInput(key)
      sanitized[safeKey] = sanitizeObject(value)
    }
    return sanitized
  }
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }
  
  return obj
}

/**
 * Validate request data for SQL injection
 */
export const validateRequestData = (data) => {
  if (!data) return { valid: true }
  
  const checkValue = (value, path = '') => {
    if (typeof value === 'string') {
      if (detectSqlInjection(value)) {
        return { valid: false, field: path, reason: 'Potential SQL injection detected' }
      }
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const result = checkValue(value[i], `${path}[${i}]`)
        if (!result.valid) return result
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        const result = checkValue(val, path ? `${path}.${key}` : key)
        if (!result.valid) return result
      }
    }
    return { valid: true }
  }
  
  return checkValue(data)
}

/**
 * Sanitize error message for client
 */
export const sanitizeErrorMessage = (error) => {
  const message = error?.message || 'An error occurred'
  
  // Remove sensitive information
  const sanitized = message
    .replace(/postgresql:\/\/[^@]+@[^\s]+/gi, '[DATABASE_URL]')
    .replace(/password[=:]\s*['"][^'"]+['"]/gi, '[PASSWORD_HIDDEN]')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_HIDDEN]')
    .replace(/at\s+[\w/.]+:\d+:\d+/g, '[STACK_HIDDEN]')
  
  return sanitized.substring(0, 500)
}

/**
 * Set security headers
 */
export const setSecurityHeaders = (res, origin) => {
  // CORS headers - only allow specific origins
  const allowedOrigin = isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Content-Security-Policy', "default-src 'self'")
}

/**
 * Main security middleware
 */
export const securityMiddleware = (req, res) => {
  const ip = getClientIP(req)
  const origin = req.headers.origin
  
  // Set security headers
  setSecurityHeaders(res, origin)
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return { passed: false, preflight: true }
  }
  
  // Check origin
  if (origin && !isOriginAllowed(origin)) {
    return { 
      passed: false, 
      error: { status: 403, message: 'Origin not allowed' }
    }
  }
  
  // Rate limiting
  const rateLimit = checkRateLimit(ip)
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS)
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining)
  
  if (!rateLimit.allowed) {
    return { 
      passed: false, 
      error: { status: 429, message: 'Too many requests. Please try again later.' }
    }
  }
  
  // Validate request body
  if (req.body) {
    const validation = validateRequestData(req.body)
    if (!validation.valid) {
      console.warn(`SQL injection attempt from ${ip}: ${validation.field}`)
      return { 
        passed: false, 
        error: { status: 400, message: 'Invalid request data' }
      }
    }
    
    // Sanitize the request body
    req.body = sanitizeObject(req.body)
  }
  
  return { passed: true }
}

export default securityMiddleware
