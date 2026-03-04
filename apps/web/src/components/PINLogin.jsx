import React, { useState, useEffect, useRef } from 'react'
import { Shield, Lock, AlertCircle, Check, KeyRound, HelpCircle, ArrowRight } from 'lucide-react'

const PIN_STORAGE_KEY = 'app_pin_hash'
const SECURITY_QUESTION_KEY = 'app_security_qa'
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 300000 // 5 minutes lockout
const LOCKOUT_KEY = 'app_lockout'

// Simple hash function for PIN (SHA-256 simulation using browser crypto)
const hashPIN = async (pin) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'sriorusol_salt_2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const PINLogin = ({ onAuthenticated }) => {
  const [step, setStep] = useState('checking') // 'checking', 'login', 'setup', 'recovery'
  const [pin, setPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)
  
  // Security question for recovery
  const [securityQuestion, setSecurityQuestion] = useState('What is your mother\'s maiden name?')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [recoveryAnswer, setRecoveryAnswer] = useState('')
  const [savedQuestion, setSavedQuestion] = useState('')
  
  const pinRefs = [useRef(), useRef(), useRef(), useRef()]
  const confirmPinRefs = [useRef(), useRef(), useRef(), useRef()]

  // Security questions list
  const securityQuestions = [
    'What is your mother\'s maiden name?',
    'What was the name of your first pet?',
    'What city were you born in?',
    'What is your favorite movie?',
    'What was your childhood nickname?'
  ]

  // Check if PIN is already set up
  useEffect(() => {
    const checkSetup = () => {
      const pinHash = localStorage.getItem(PIN_STORAGE_KEY)
      const lockout = localStorage.getItem(LOCKOUT_KEY)
      
      // Check lockout
      if (lockout) {
        const lockoutData = JSON.parse(lockout)
        const remaining = lockoutData.until - Date.now()
        if (remaining > 0) {
          setIsLocked(true)
          setLockoutRemaining(remaining)
          setAttempts(lockoutData.attempts)
        } else {
          localStorage.removeItem(LOCKOUT_KEY)
        }
      }
      
      if (pinHash) {
        // Load saved security question for recovery
        const securityData = localStorage.getItem(SECURITY_QUESTION_KEY)
        if (securityData) {
          const data = JSON.parse(securityData)
          setSavedQuestion(data.question)
        }
        setStep('login')
      } else {
        setStep('setup')
      }
    }
    checkSetup()
  }, [])

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked || lockoutRemaining <= 0) return
    
    const timer = setInterval(() => {
      setLockoutRemaining(prev => {
        const newVal = prev - 1000
        if (newVal <= 0) {
          setIsLocked(false)
          localStorage.removeItem(LOCKOUT_KEY)
          setAttempts(0)
          return 0
        }
        return newVal
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [isLocked, lockoutRemaining])

  // Handle PIN input change
  const handlePinChange = (index, value, isConfirm = false) => {
    if (value && !/^\d$/.test(value)) return
    
    const refs = isConfirm ? confirmPinRefs : pinRefs
    const setFunc = isConfirm ? setConfirmPin : setPin
    const currentPin = isConfirm ? confirmPin : pin
    
    const newPin = [...currentPin]
    newPin[index] = value
    setFunc(newPin)
    
    // Auto-focus next input
    if (value && index < 3) {
      refs[index + 1].current?.focus()
    }
  }

  // Handle backspace
  const handleKeyDown = (index, e, isConfirm = false) => {
    const refs = isConfirm ? confirmPinRefs : pinRefs
    const currentPin = isConfirm ? confirmPin : pin
    
    if (e.key === 'Backspace' && !currentPin[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
  }

  // Setup new PIN
  const handleSetup = async (e) => {
    e.preventDefault()
    setError('')
    
    const pinValue = pin.join('')
    const confirmPinValue = confirmPin.join('')
    
    if (pinValue.length !== 4) {
      setError('Please enter complete 4-digit PIN')
      return
    }
    
    if (pinValue !== confirmPinValue) {
      setError('PINs do not match')
      setConfirmPin(['', '', '', ''])
      confirmPinRefs[0].current?.focus()
      return
    }
    
    // Check for weak PINs
    const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123', '9876']
    if (weakPins.includes(pinValue)) {
      setError('PIN is too simple. Please choose a stronger PIN')
      return
    }
    
    if (!securityAnswer.trim()) {
      setError('Please provide answer to security question')
      return
    }
    
    setLoading(true)
    
    try {
      const hashedPin = await hashPIN(pinValue)
      const hashedAnswer = await hashPIN(securityAnswer.toLowerCase().trim())
      
      localStorage.setItem(PIN_STORAGE_KEY, hashedPin)
      localStorage.setItem(SECURITY_QUESTION_KEY, JSON.stringify({
        question: securityQuestion,
        answerHash: hashedAnswer
      }))
      
      // Store auth in session
      sessionStorage.setItem('pin_authenticated', 'true')
      onAuthenticated()
    } catch (err) {
      setError('Failed to setup PIN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Verify PIN login
  const handleLogin = async (e) => {
    e?.preventDefault()
    
    if (isLocked) return
    
    setError('')
    const pinValue = pin.join('')
    
    if (pinValue.length !== 4) {
      setError('Please enter complete 4-digit PIN')
      return
    }
    
    setLoading(true)
    
    try {
      const hashedPin = await hashPIN(pinValue)
      const storedHash = localStorage.getItem(PIN_STORAGE_KEY)
      
      if (hashedPin === storedHash) {
        // Success - clear lockout data
        localStorage.removeItem(LOCKOUT_KEY)
        sessionStorage.setItem('pin_authenticated', 'true')
        onAuthenticated()
      } else {
        // Wrong PIN
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        
        if (newAttempts >= MAX_ATTEMPTS) {
          // Lock out user
          const lockoutData = {
            until: Date.now() + LOCKOUT_TIME,
            attempts: newAttempts
          }
          localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockoutData))
          setIsLocked(true)
          setLockoutRemaining(LOCKOUT_TIME)
          setError(`Too many attempts. Locked for 5 minutes.`)
        } else {
          setError(`Invalid PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`)
        }
        
        setPin(['', '', '', ''])
        pinRefs[0].current?.focus()
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle PIN recovery
  const handleRecovery = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!recoveryAnswer.trim()) {
      setError('Please enter your answer')
      return
    }
    
    setLoading(true)
    
    try {
      const securityData = JSON.parse(localStorage.getItem(SECURITY_QUESTION_KEY))
      const hashedAnswer = await hashPIN(recoveryAnswer.toLowerCase().trim())
      
      if (hashedAnswer === securityData.answerHash) {
        // Correct answer - allow PIN reset
        localStorage.removeItem(PIN_STORAGE_KEY)
        localStorage.removeItem(SECURITY_QUESTION_KEY)
        localStorage.removeItem(LOCKOUT_KEY)
        setAttempts(0)
        setIsLocked(false)
        setPin(['', '', '', ''])
        setConfirmPin(['', '', '', ''])
        setSecurityAnswer('')
        setRecoveryAnswer('')
        setStep('setup')
      } else {
        setError('Incorrect answer. Please try again.')
      }
    } catch (err) {
      setError('Recovery failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Format lockout time
  const formatLockoutTime = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (step === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Security Badge */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-full p-4 shadow-lg">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h1 className="text-xl font-bold text-white text-center">
              {step === 'setup' ? 'Create PIN' : step === 'recovery' ? 'Reset PIN' : 'Enter PIN'}
            </h1>
            <p className="text-blue-100 text-center text-sm mt-1">
              {step === 'setup' 
                ? 'Create a 4-digit PIN to secure your data'
                : step === 'recovery'
                ? 'Answer security question to reset PIN'
                : 'Enter your 4-digit PIN to continue'}
            </p>
          </div>

          <div className="p-6">
            {/* LOGIN STEP */}
            {step === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Lockout Warning */}
                {isLocked && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <Lock className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700 font-medium">Account Temporarily Locked</p>
                    <p className="text-red-600 text-2xl font-bold mt-2">
                      {formatLockoutTime(lockoutRemaining)}
                    </p>
                    <p className="text-red-500 text-sm mt-1">Please wait or reset PIN</p>
                  </div>
                )}

                {/* PIN Input */}
                {!isLocked && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                      Enter 4-digit PIN
                    </label>
                    <div className="flex justify-center gap-3">
                      {pin.map((digit, index) => (
                        <input
                          key={index}
                          ref={pinRefs[index]}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePinChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          disabled={loading}
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
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
                {!isLocked && (
                  <button
                    type="submit"
                    disabled={loading || pin.some(d => !d)}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>Unlock</span>
                      </>
                    )}
                  </button>
                )}

                {/* Forgot PIN Link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('recovery')
                      setError('')
                      setRecoveryAnswer('')
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mx-auto"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Forgot PIN?
                  </button>
                </div>
              </form>
            )}

            {/* SETUP STEP */}
            {step === 'setup' && (
              <form onSubmit={handleSetup} className="space-y-5">
                {/* Create PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Create 4-digit PIN
                  </label>
                  <div className="flex justify-center gap-3">
                    {pin.map((digit, index) => (
                      <input
                        key={index}
                        ref={pinRefs[index]}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        disabled={loading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Confirm PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Confirm PIN
                  </label>
                  <div className="flex justify-center gap-3">
                    {confirmPin.map((digit, index) => (
                      <input
                        key={index}
                        ref={confirmPinRefs[index]}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(index, e.target.value, true)}
                        onKeyDown={(e) => handleKeyDown(index, e, true)}
                        className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>

                {/* Security Question */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Question (for PIN recovery)
                  </label>
                  <select
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 mb-3"
                  >
                    {securityQuestions.map((q, i) => (
                      <option key={i} value={q}>{q}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Your answer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>

                {/* PIN Requirements */}
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-gray-700 mb-2">PIN Requirements:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className={`w-4 h-4 ${pin.join('').length === 4 ? 'text-green-600' : 'text-gray-400'}`} />
                      4 digits required
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-4 h-4 ${pin.join('') === confirmPin.join('') && pin.join('').length === 4 ? 'text-green-600' : 'text-gray-400'}`} />
                      PINs must match
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Avoid simple patterns (1234, 0000)
                    </li>
                  </ul>
                </div>

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
                  disabled={loading || pin.some(d => !d) || confirmPin.some(d => !d) || !securityAnswer.trim()}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Setting up...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Create Secure PIN</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* RECOVERY STEP */}
            {step === 'recovery' && (
              <form onSubmit={handleRecovery} className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    Answer your security question to reset PIN. This will also clear your master password.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {savedQuestion || 'Security Question'}
                  </label>
                  <input
                    type="text"
                    value={recoveryAnswer}
                    onChange={(e) => setRecoveryAnswer(e.target.value)}
                    placeholder="Your answer"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                    autoFocus
                  />
                </div>

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
                  disabled={loading || !recoveryAnswer.trim()}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      <span>Reset PIN</span>
                    </>
                  )}
                </button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('login')
                    setError('')
                    setRecoveryAnswer('')
                  }}
                  className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  ← Back to Login
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm">
            <KeyRound className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">Secured with Local PIN</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Sri Orusol Jewellers - Secure Pledge Management
        </div>
      </div>
    </div>
  )
}

// Check if user is PIN authenticated
export const isPINAuthenticated = () => {
  return sessionStorage.getItem('pin_authenticated') === 'true'
}

// Clear PIN authentication (logout)
export const clearPINAuth = () => {
  sessionStorage.removeItem('pin_authenticated')
}

// Check if PIN is setup
export const hasPINSetup = () => {
  return !!localStorage.getItem(PIN_STORAGE_KEY)
}

export default PINLogin
