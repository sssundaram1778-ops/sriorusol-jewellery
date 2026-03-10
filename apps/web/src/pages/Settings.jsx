import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Info, Gem, Shield, Clock, ChevronLeft, Layers, LogOut, Lock, Mail, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCategoryStore } from '../store/categoryStore'
import CategoryBadge from '../components/CategoryBadge'
import { clearEncryptionSession } from '../lib/encryption'
import { clearPINAuth } from '../components/PINLogin'
import toast from 'react-hot-toast'

// Simple hash function for SAI PIN
const hashSaiPin = async (pin) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'sai_secret_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// API call helper
const apiCall = async (action, data = {}) => {
  const apiUrl = `${window.location.origin}/api/db`
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API request failed: ${response.status}`)
  }
  return response.json()
}

export default function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeCategory, setCategory, saiUnlocked, saiVisibleUntil, unlockSai, hideSai } = useCategoryStore()
  const isFirst = activeCategory === 'FIRST'
  
  // Version tap counter for hidden SAI access
  const [versionTapCount, setVersionTapCount] = useState(0)
  const [lastTapTime, setLastTapTime] = useState(0)
  
  // Countdown timer state
  const [countdown, setCountdown] = useState(0)
  
  // SAI PIN modal states
  const [showSaiPinModal, setShowSaiPinModal] = useState(false)
  const [saiPinMode, setSaiPinMode] = useState('check') // 'check', 'setup', 'verify', 'reset_verify', 'reset_new'
  const [saiPin, setSaiPin] = useState('')
  const [confirmSaiPin, setConfirmSaiPin] = useState('')
  const [saiPinError, setSaiPinError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSaiPin, setHasSaiPin] = useState(false)
  
  // Auto-hide SAI timer effect
  useEffect(() => {
    if (!saiUnlocked || !saiVisibleUntil) {
      setCountdown(0)
      return
    }
    
    // Update countdown every second
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((saiVisibleUntil - Date.now()) / 1000))
      setCountdown(remaining)
      
      // Auto-hide when timer expires
      if (remaining <= 0) {
        hideSai()
        toast('SAI hidden - tap version 5x to unlock again', { icon: '🔒', duration: 2000 })
      }
    }
    
    // Initial update
    updateCountdown()
    
    // Set interval
    const intervalId = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(intervalId)
  }, [saiUnlocked, saiVisibleUntil, hideSai])

  // Check if SAI PIN exists on mount (for showing reset button)
  useEffect(() => {
    const checkSaiPinExists = async () => {
      try {
        const result = await apiCall('getSaiPinStatus')
        setHasSaiPin(result.data?.exists || false)
      } catch (error) {
        console.error('Error checking SAI PIN:', error)
      }
    }
    checkSaiPinExists()
  }, [])

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout? You will need to enter PIN and master password again.')) {
      clearPINAuth() // Clear PIN session
      clearEncryptionSession() // Clear encryption session
      window.location.reload()
    }
  }
  
  // Handle version tap for hidden SAI access
  const handleVersionTap = () => {
    const now = Date.now()
    
    // Reset counter if more than 2 seconds between taps
    if (now - lastTapTime > 2000) {
      setVersionTapCount(1)
    } else {
      setVersionTapCount(prev => prev + 1)
    }
    setLastTapTime(now)
    
    // Show progress feedback
    if (versionTapCount >= 2 && versionTapCount < 4) {
      toast.dismiss()
      toast(`${5 - versionTapCount} more taps...`, { duration: 1000, icon: '🔐' })
    }
    
    // Unlock SAI after 5 taps (starts 60-second timer)
    if (versionTapCount >= 4) {
      setVersionTapCount(0)
      unlockSai()
      toast.success('🔓 SAI Unlocked - 60 seconds to select', { duration: 3000 })
    }
  }
  
  // Handle SAI category click - show PIN modal
  const handleSaiClick = async () => {
    setShowSaiPinModal(true)
    setSaiPin('')
    setConfirmSaiPin('')
    setSaiPinError('')
    setSaiPinMode('check')
    setIsLoading(true)
    
    try {
      // Check if SAI PIN is already set up
      const result = await apiCall('getSaiPinStatus')
      if (result.data?.exists) {
        setSaiPinMode('verify')
      } else {
        setSaiPinMode('setup')
      }
    } catch (error) {
      console.error('Error checking SAI PIN status:', error)
      setSaiPinMode('setup') // Default to setup if can't check
    } finally {
      setIsLoading(false)
    }
  }
  
  // Setup new SAI PIN
  const handleSetupSaiPin = async () => {
    if (saiPin.length < 4) {
      setSaiPinError('PIN must be at least 4 digits')
      return
    }
    if (saiPin !== confirmSaiPin) {
      setSaiPinError('PINs do not match')
      return
    }
    
    setIsLoading(true)
    try {
      const pinHash = await hashSaiPin(saiPin)
      await apiCall('setupSaiPIN', { sai_pin_hash: pinHash })
      
      toast.success('SAI PIN created successfully')
      setShowSaiPinModal(false)
      setCategory('SECOND')
    } catch (error) {
      console.error('Error setting up SAI PIN:', error)
      setSaiPinError('Failed to setup PIN. Try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Verify SAI PIN
  const handleVerifySaiPin = async () => {
    if (saiPin.length < 4) {
      setSaiPinError('Enter your SAI PIN')
      return
    }
    
    setIsLoading(true)
    try {
      const pinHash = await hashSaiPin(saiPin)
      const result = await apiCall('verifySaiPIN', { sai_pin_hash: pinHash })
      
      if (result.data?.valid) {
        // Check if this is reset flow or normal access
        if (saiPinMode === 'reset_verify') {
          // Move to set new PIN
          setSaiPin('')
          setConfirmSaiPin('')
          setSaiPinMode('reset_new')
          toast.success('PIN verified. Set your new PIN.')
        } else {
          toast.success('Access granted')
          setShowSaiPinModal(false)
          setCategory('SECOND')
        }
      } else {
        setSaiPinError('Incorrect PIN')
        setSaiPin('')
      }
    } catch (error) {
      console.error('Error verifying SAI PIN:', error)
      setSaiPinError('Verification failed. Try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle Reset SAI PIN button click
  const handleResetSaiPinClick = () => {
    setShowSaiPinModal(true)
    setSaiPin('')
    setConfirmSaiPin('')
    setSaiPinError('')
    setSaiPinMode('reset_verify')
  }
  
  // Set new PIN after reset verification
  const handleSetNewPin = async () => {
    if (saiPin.length < 4) {
      setSaiPinError('PIN must be at least 4 digits')
      return
    }
    if (saiPin !== confirmSaiPin) {
      setSaiPinError('PINs do not match')
      return
    }
    
    setIsLoading(true)
    try {
      const pinHash = await hashSaiPin(saiPin)
      await apiCall('setupSaiPIN', { sai_pin_hash: pinHash })
      
      toast.success('SAI PIN reset successfully')
      setShowSaiPinModal(false)
      setHasSaiPin(true)
    } catch (error) {
      console.error('Error resetting SAI PIN:', error)
      setSaiPinError('Failed to reset PIN. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${isFirst ? 'bg-blue-50' : 'bg-purple-50'} pb-20`}>
      {/* Header */}
      <div className={`${isFirst ? 'bg-blue-50 border-blue-200/50' : 'bg-purple-50 border-purple-200/50'} border-b`}>
        <div className="px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 ${isFirst ? 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-blue-500/30' : 'bg-gradient-to-br from-purple-600 to-purple-500 shadow-purple-500/30'} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Gem className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800">Sri Orusol Jeweller</h1>
                <CategoryBadge showLabel={false} />
              </div>
              <p className="text-[11px] text-slate-500">Settings & Preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Pledge Category Selector - Only show if SAI is unlocked or currently in SAI mode */}
        {(saiUnlocked || activeCategory === 'SECOND') && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${isFirst ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'} rounded-xl flex items-center justify-center shadow-md`}>
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">Pledge Category</h3>
                <p className="text-xs text-slate-500">Select which category to work with</p>
              </div>
              {/* Countdown timer - only show when SAI is unlocked but not yet selected */}
              {saiUnlocked && activeCategory === 'FIRST' && countdown > 0 && (
                <div className="flex items-center gap-2 bg-purple-100 px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-purple-600">{countdown}s</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* First Category - SS */}
              <button
                onClick={() => setCategory('FIRST')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  activeCategory === 'FIRST'
                    ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeCategory === 'FIRST' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    <span className="text-xl font-bold">SS</span>
                  </div>
                  <span className={`font-bold ${
                    activeCategory === 'FIRST' ? 'text-blue-700' : 'text-slate-600'
                  }`}>
                    SS
                  </span>
                  {activeCategory === 'FIRST' && (
                    <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
              </button>
              
              {/* Second Category - SAI (requires PIN) */}
              <button
                onClick={handleSaiClick}
                className={`p-4 rounded-xl border-2 transition-all relative ${
                  activeCategory === 'SECOND'
                    ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                    : countdown > 0 
                      ? 'border-purple-400 bg-purple-50 animate-pulse'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeCategory === 'SECOND' 
                      ? 'bg-purple-500 text-white' 
                      : countdown > 0
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className={`font-bold ${
                    activeCategory === 'SECOND' ? 'text-purple-700' : countdown > 0 ? 'text-purple-700' : 'text-slate-600'
                  }`}>
                    SAI
                  </span>
                  {activeCategory === 'SECOND' && (
                    <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
              </button>
            </div>
            
            <p className="text-xs text-slate-400 text-center mt-4">
              {countdown > 0 
                ? `Select SAI within ${countdown} seconds or it will hide`
                : 'Each category has separate pledges, financers, and data'
              }
            </p>
          </div>
        )}

        {/* Shop Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-14 h-14 ${isFirst ? 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-blue-500/30' : 'bg-gradient-to-br from-purple-600 to-purple-500 shadow-purple-500/30'} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Gem className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Sri Orusol Jeweller</h3>
              <p className="text-sm text-slate-500"></p>
            </div>
          </div>
          
          <div className={`${isFirst ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'} rounded-xl p-4 border`}>
            <div className={`flex items-center gap-2 ${isFirst ? 'text-blue-700' : 'text-purple-700'} mb-2`}>
              <Shield className="w-5 h-5" />
              <span className="text-sm font-bold">Premium Account</span>
            </div>
            <p className={`text-xs ${isFirst ? 'text-blue-600' : 'text-purple-600'}`}>Full access to all features</p>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800">{t('settings.backup')}</h3>
              <p className="text-xs text-slate-500">Cloud sync status</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-600 font-bold">Active</span>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Auto-sync enabled</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Powered by Neon</span>
          </div>
        </div>

        {/* Security & Encryption */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 ${isFirst ? 'bg-blue-100' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
              <Lock className={`w-6 h-6 ${isFirst ? 'text-blue-600' : 'text-purple-600'}`} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Security</h3>
              <p className="text-xs text-slate-500">Encryption & Access Control</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Email OTP Authentication */}
            <div className="flex justify-between items-center py-3 px-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Email OTP Authentication</span>
              </div>
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-bold">VERIFIED</span>
            </div>
            
            {/* AES-256 Encryption */}
            <div className="flex justify-between items-center py-3 px-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">AES-256-GCM Encryption</span>
              </div>
              <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-bold">ACTIVE</span>
            </div>
            
            {/* Reset SAI PIN - Only show if PIN exists */}
            {hasSaiPin && (
              <button
                onClick={handleResetSaiPinClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-purple-600 font-medium transition-colors"
              >
                <Lock className="w-5 h-5" />
                <span>Reset SAI PIN</span>
              </button>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout & Lock</span>
            </button>
          </div>
          
          <p className="text-xs text-slate-400 text-center mt-3">
            2-Factor: Email OTP + Master Password + AES-256 Encryption
          </p>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 ${isFirst ? 'bg-blue-100' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
              <Info className={`w-6 h-6 ${isFirst ? 'text-blue-600' : 'text-purple-600'}`} />
            </div>
            <h3 className="font-bold text-slate-800">{t('settings.about')}</h3>
          </div>
          
          <div className="space-y-1">
            {/* Version - Tappable for hidden SAI access */}
            <button
              onClick={handleVersionTap}
              className="w-full flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <span className="text-sm text-slate-600 font-medium">Version</span>
              <span className={`text-sm font-bold ${isFirst ? 'text-blue-600' : 'text-purple-600'}`}>1.0.2</span>
            </button>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600 font-medium">Build</span>
              <span className="text-sm font-bold text-slate-700">2026.03.10b</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600 font-medium">Platform</span>
              <span className="text-sm font-bold text-slate-700">PWA</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-slate-500 font-medium">© 2026 Sri Orusol Jeweller</p>
          <p className="text-xs text-slate-400 mt-1">All rights reserved</p>
        </div>
      </div>
      
      {/* SAI PIN Modal */}
      {showSaiPinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">
                  {saiPinMode === 'setup' ? 'Setup SAI PIN' : 
                   saiPinMode === 'reset_verify' ? 'Reset SAI PIN' :
                   saiPinMode === 'reset_new' ? 'New SAI PIN' : 'Enter SAI PIN'}
                </h3>
              </div>
              <button
                onClick={() => setShowSaiPinModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {isLoading && saiPinMode === 'check' ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {saiPinMode === 'setup' || saiPinMode === 'reset_new' ? (
                    <>
                      <p className="text-sm text-slate-600 text-center">
                        {saiPinMode === 'reset_new' ? 'Create your new 4-digit PIN' : 'Create a 4-digit PIN for SAI access'}
                      </p>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">New PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={saiPin}
                          onChange={(e) => {
                            setSaiPin(e.target.value.replace(/\D/g, ''))
                            setSaiPinError('')
                          }}
                          placeholder="Enter 4-6 digit PIN"
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl tracking-widest font-mono focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Confirm PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={confirmSaiPin}
                          onChange={(e) => {
                            setConfirmSaiPin(e.target.value.replace(/\D/g, ''))
                            setSaiPinError('')
                          }}
                          placeholder="Confirm PIN"
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl tracking-widest font-mono focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600 text-center">
                        {saiPinMode === 'reset_verify' ? 'Enter your current SAI PIN to reset' : 'Enter your SAI PIN to access'}
                      </p>
                      <div>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={saiPin}
                          onChange={(e) => {
                            setSaiPin(e.target.value.replace(/\D/g, ''))
                            setSaiPinError('')
                          }}
                          placeholder="Enter PIN"
                          className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-3xl tracking-widest font-mono focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                          autoFocus
                        />
                      </div>
                    </>
                  )}
                  
                  {saiPinError && (
                    <p className="text-sm text-red-500 text-center font-medium">{saiPinError}</p>
                  )}
                  
                  <button
                    onClick={
                      saiPinMode === 'setup' ? handleSetupSaiPin : 
                      saiPinMode === 'reset_new' ? handleSetNewPin :
                      handleVerifySaiPin
                    }
                    disabled={isLoading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        {saiPinMode === 'setup' ? 'Create PIN' : 
                         saiPinMode === 'reset_new' ? 'Save New PIN' :
                         saiPinMode === 'reset_verify' ? 'Verify & Reset' : 'Unlock'}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
















