import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Eye, EyeOff, Shield, AlertCircle, Check } from 'lucide-react'
import {
  initializeEncryption,
  verifyMasterPassword,
  hasEncryptionSetup,
  isEncryptionInitialized
} from '../lib/encryption'

const EncryptionLogin = ({ onAuthenticated }) => {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSetup, setIsSetup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSetup, setCheckingSetup] = useState(true)

  useEffect(() => {
    // Check if encryption is already set up
    const hasSetup = hasEncryptionSetup()
    setIsSetup(!hasSetup) // isSetup = true means we need to create new password
    setCheckingSetup(false)
  }, [])

  const handleSetup = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    // Check password strength
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setError('Password must contain uppercase, lowercase, and numbers')
      return
    }
    
    setLoading(true)
    
    try {
      const result = await initializeEncryption(password)
      if (result.success) {
        onAuthenticated()
      } else {
        setError(result.error || 'Failed to initialize encryption')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const result = await verifyMasterPassword(password)
      
      if (result.needsSetup) {
        setIsSetup(true)
        setLoading(false)
        return
      }
      
      if (result.valid) {
        onAuthenticated()
      } else {
        setError('Invalid password')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Security Badge */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-full p-4 shadow-lg">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {isSetup ? 'Setup Encryption' : 'Secure Login'}
          </h1>
          <p className="text-gray-500 text-center text-sm mb-6">
            {isSetup 
              ? 'Create a master password to protect your data'
              : 'Enter your master password to access'}
          </p>

          <form onSubmit={isSetup ? handleSetup : handleLogin} className="space-y-4">
            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isSetup ? 'Create Password' : 'Master Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (Setup only) */}
            {isSetup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Requirements (Setup only) */}
            {isSetup && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700 mb-2">Password Requirements:</p>
                <ul className="space-y-1">
                  <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    <Check className={`w-4 h-4 ${password.length >= 8 ? 'opacity-100' : 'opacity-30'}`} />
                    At least 8 characters
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <Check className={`w-4 h-4 ${/[A-Z]/.test(password) ? 'opacity-100' : 'opacity-30'}`} />
                    One uppercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <Check className={`w-4 h-4 ${/[a-z]/.test(password) ? 'opacity-100' : 'opacity-30'}`} />
                    One lowercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <Check className={`w-4 h-4 ${/[0-9]/.test(password) ? 'opacity-100' : 'opacity-30'}`} />
                    One number
                  </li>
                </ul>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{isSetup ? 'Setting up...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>{isSetup ? 'Create Secure Access' : 'Unlock'}</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              🔒 Your data is encrypted with AES-256-GCM
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isSetup 
                ? 'Remember this password - it cannot be recovered!'
                : 'Encryption protects your sensitive customer data'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Sri Orusol Jeweller - Secure Access
        </div>
      </div>
    </div>
  )
}

export default EncryptionLogin
