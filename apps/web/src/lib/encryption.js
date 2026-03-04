/**
 * AES-256-GCM Encryption Utility for Sensitive Data
 * 
 * This module provides client-side encryption for sensitive fields before
 * storing in the database. Uses Web Crypto API for AES-256-GCM encryption.
 * 
 * Security Features:
 * - AES-256-GCM encryption (authenticated encryption)
 * - Random IV for each encryption
 * - PBKDF2 key derivation from master password
 * - Secure key storage in browser
 */

// Storage key for the encryption key
const ENCRYPTION_KEY_STORAGE = 'sriorusol_encryption_key'
const ENCRYPTION_SALT_STORAGE = 'sriorusol_encryption_salt'

// Generate a random salt
const generateSalt = () => {
  return crypto.getRandomValues(new Uint8Array(16))
}

// Convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Convert string to ArrayBuffer
const stringToArrayBuffer = (str) => {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

// Convert ArrayBuffer to string
const arrayBufferToString = (buffer) => {
  const decoder = new TextDecoder()
  return decoder.decode(buffer)
}

// Derive encryption key from password using PBKDF2
const deriveKey = async (password, salt) => {
  const passwordBuffer = stringToArrayBuffer(password)
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  // Derive AES-256-GCM key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Initialize encryption with a master password
export const initializeEncryption = async (masterPassword) => {
  try {
    let saltBase64 = localStorage.getItem(ENCRYPTION_SALT_STORAGE)
    let salt
    
    if (!saltBase64) {
      // Generate new salt for first time setup
      salt = generateSalt()
      saltBase64 = arrayBufferToBase64(salt)
      localStorage.setItem(ENCRYPTION_SALT_STORAGE, saltBase64)
    } else {
      salt = new Uint8Array(base64ToArrayBuffer(saltBase64))
    }
    
    // Derive key and store reference
    const key = await deriveKey(masterPassword, salt)
    
    // Store encrypted marker to verify password later
    const testData = 'sriorusol_encryption_test'
    const encrypted = await encryptWithKey(testData, key)
    localStorage.setItem(ENCRYPTION_KEY_STORAGE, encrypted)
    
    // Store key in session (memory only, not persistent)
    window.__encryptionKey = key
    
    return { success: true }
  } catch (error) {
    console.error('Encryption initialization error:', error)
    return { success: false, error: error.message }
  }
}

// Verify master password
export const verifyMasterPassword = async (masterPassword) => {
  try {
    const saltBase64 = localStorage.getItem(ENCRYPTION_SALT_STORAGE)
    const encryptedMarker = localStorage.getItem(ENCRYPTION_KEY_STORAGE)
    
    if (!saltBase64 || !encryptedMarker) {
      return { valid: false, needsSetup: true }
    }
    
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64))
    const key = await deriveKey(masterPassword, salt)
    
    // Try to decrypt the marker
    const decrypted = await decryptWithKey(encryptedMarker, key)
    
    if (decrypted === 'sriorusol_encryption_test') {
      window.__encryptionKey = key
      return { valid: true }
    }
    
    return { valid: false }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

// Check if encryption is initialized
export const isEncryptionInitialized = () => {
  return !!window.__encryptionKey
}

// Check if encryption setup exists
export const hasEncryptionSetup = () => {
  return !!localStorage.getItem(ENCRYPTION_KEY_STORAGE)
}

// Get current encryption key
const getEncryptionKey = () => {
  if (!window.__encryptionKey) {
    throw new Error('Encryption not initialized. Please login first.')
  }
  return window.__encryptionKey
}

// Encrypt with specific key
const encryptWithKey = async (plaintext, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintextBuffer = stringToArrayBuffer(plaintext)
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    plaintextBuffer
  )
  
  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  
  return 'ENC:' + arrayBufferToBase64(combined.buffer)
}

// Decrypt with specific key
const decryptWithKey = async (encryptedData, key) => {
  // Remove prefix
  const data = encryptedData.replace('ENC:', '')
  const combined = new Uint8Array(base64ToArrayBuffer(data))
  
  // Extract IV and ciphertext
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  )
  
  return arrayBufferToString(plaintextBuffer)
}

// Encrypt a string value
export const encrypt = async (plaintext) => {
  if (!plaintext || typeof plaintext !== 'string') {
    return plaintext
  }
  
  try {
    const key = getEncryptionKey()
    return encryptWithKey(plaintext, key)
  } catch (error) {
    console.error('Encryption error:', error)
    // Return original if encryption fails (for backward compatibility)
    return plaintext
  }
}

// Decrypt a string value
export const decrypt = async (encryptedData) => {
  if (!encryptedData || typeof encryptedData !== 'string') {
    return encryptedData
  }
  
  // Check if data is encrypted (has our prefix)
  if (!encryptedData.startsWith('ENC:')) {
    return encryptedData // Return as-is if not encrypted
  }
  
  try {
    const key = getEncryptionKey()
    return decryptWithKey(encryptedData, key)
  } catch (error) {
    console.error('Decryption error:', error)
    // Return encrypted data if decryption fails
    return '[Encrypted Data]'
  }
}

// Encrypt sensitive fields in an object
export const encryptSensitiveFields = async (data, sensitiveFields) => {
  if (!data || typeof data !== 'object') {
    return data
  }
  
  const encrypted = { ...data }
  
  for (const field of sensitiveFields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = await encrypt(encrypted[field])
    }
  }
  
  return encrypted
}

// Decrypt sensitive fields in an object
export const decryptSensitiveFields = async (data, sensitiveFields) => {
  if (!data || typeof data !== 'object') {
    return data
  }
  
  const decrypted = { ...data }
  
  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = await decrypt(decrypted[field])
    }
  }
  
  return decrypted
}

// Batch decrypt an array of objects
export const decryptBatch = async (dataArray, sensitiveFields) => {
  if (!Array.isArray(dataArray)) {
    return dataArray
  }
  
  return Promise.all(
    dataArray.map(item => decryptSensitiveFields(item, sensitiveFields))
  )
}

// Batch encrypt an array of objects
export const encryptBatch = async (dataArray, sensitiveFields) => {
  if (!Array.isArray(dataArray)) {
    return dataArray
  }
  
  return Promise.all(
    dataArray.map(item => encryptSensitiveFields(item, sensitiveFields))
  )
}

// Sensitive fields configuration for pledges
export const PLEDGE_SENSITIVE_FIELDS = [
  'customer_name',
  'phone_number',
  'place',
  'jewels_details',
  'notes'
]

// Sensitive fields for owner repledges
export const OWNER_REPLEDGE_SENSITIVE_FIELDS = [
  'financer_name',
  'financer_place',
  'notes'
]

// Clear encryption session (logout)
export const clearEncryptionSession = () => {
  delete window.__encryptionKey
}

// Reset encryption (delete all encryption data - use with caution!)
export const resetEncryption = () => {
  localStorage.removeItem(ENCRYPTION_KEY_STORAGE)
  localStorage.removeItem(ENCRYPTION_SALT_STORAGE)
  delete window.__encryptionKey
}

// Export utilities for testing
export const utils = {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  stringToArrayBuffer,
  arrayBufferToString
}
