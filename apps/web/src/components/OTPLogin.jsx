import React, { useState, useEffect } from 'react'
import { Mail, Lock, Shield, AlertCircle, ArrowRight, RefreshCw, Check, KeyRound } from 'lucide-react'

const OTP_API_URL = '/api/otp'

const OTPLogin = ({ onAuthenticated }) => {
  const [step, setStep] = useState('email') // 'email', 'otp', 'encryption'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [sessionId, setSessionId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const [authorizedEmail, setAuthorizedEmail] = useState('')
  
  // Refs for OTP inputs
  const otpRefs = Array(6).fill(0).map(() => React.createRef())
  
  // Check OTP service configuration
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch(OTP_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check' })
        })
        
        // Check if response has content before parsing
        const text = await response.text()
        if (!text) {
          console.warn('Empty response from OTP check')
          return
        }
        
        const data = JSON.parse(text)
        if (data.authorizedEmail) {
          setAuthorizedEmail(data.authorizedEmail)
          setEmail(data.authorizedEmail) // Pre-fill email
        }
      } catch (err) {
        console.error('Failed to check OTP config:', err)
      }
    }
    checkConfig()
  }, [])
  
  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (step === 'otp') {
      setCanResend(true)
    }
  }, [countdown, step])
  
  // Handle email submission
  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const response = await fetch(OTP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email })
      })
      
      // Check if response has content before parsing
      const text = await response.text()
      if (!text) {
        throw new Error('Empty response from server. Please check API server is running.')
      }
      
      const data = JSON.parse(text)
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send OTP')
      }
      
      setSessionId(data.sessionId)
      setCountdown(data.expiresIn || 300)
      setCanResend(false)
      setStep('otp')
      
      // Focus first OTP input
      setTimeout(() => otpRefs[0].current?.focus(), 100)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Handle OTP input change
  const handleOTPChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return
    
    const newOTP = [...otp]
    newOTP[index] = value
    setOtp(newOTP)
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus()
    }
    
    // Auto-submit when all filled
    if (value && index === 5 && newOTP.every(d => d)) {
      handleVerifyOTP(newOTP.join(''))
    }
  }
  
  // Handle OTP paste
  const handleOTPPaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      const newOTP = paste.split('')
      setOtp(newOTP)
      otpRefs[5].current?.focus()
      handleVerifyOTP(paste)
    }
  }
  
  // Handle OTP backspace
  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }
  
  // Verify OTP
  const handleVerifyOTP = async (otpValue = otp.join('')) => {
    if (otpValue.length !== 6) {
      setError('Please enter complete 6-digit OTP')
      return
    }
    
    setError('')
    setLoading(true)
    
    try {
      const response = await fetch(OTP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', sessionId, otp: otpValue })
      })
      
      // Check if response has content before parsing
      const text = await response.text()
      if (!text) {
        throw new Error('Empty response from server. Please check API server is running.')
      }
      
      const data = JSON.parse(text)
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Invalid OTP')
      }
      
      if (data.verified) {
        // Store auth token
        sessionStorage.setItem('otp_auth_token', data.authToken)
        sessionStorage.setItem('otp_auth_email', email)
        onAuthenticated()
      }
    } catch (err) {
      setError(err.message)
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      otpRefs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }
  
  // Resend OTP
  const handleResendOTP = async () => {
    setOtp(['', '', '', '', '', ''])
    setError('')
    await handleSendOTP({ preventDefault: () => {} })
  }
  
  // Format countdown
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
              {step === 'email' ? 'Secure Login' : 'Verify OTP'}
            </h1>
            <p className="text-blue-100 text-center text-sm mt-1">
              {step === 'email' 
                ? 'Enter your email to receive OTP' 
                : `OTP sent to ${email}`}
            </p>
          </div>
          
          <div className="p-6">
            {/* Email Step */}
            {step === 'email' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Enter your email"
                      required
                      disabled={!!authorizedEmail}
                    />
                  </div>
                  {authorizedEmail && (
                    <p className="text-xs text-gray-500 mt-1">
                      Only authorized owner can access
                    </p>
                  )}
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
                  disabled={loading || !email}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OTP Step */}
            {step === 'otp' && (
              <div className="space-y-6">
                {/* OTP Input Boxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    Enter 6-digit OTP
                  </label>
                  <div className="flex justify-center gap-2" onPaste={handleOTPPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpRefs[index]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(index, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-600">
                      OTP expires in <span className="font-semibold text-blue-600">{formatCountdown(countdown)}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 font-medium">OTP expired</p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Verify Button */}
                <button
                  onClick={() => handleVerifyOTP()}
                  disabled={loading || otp.some(d => !d)}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Verify OTP</span>
                    </>
                  )}
                </button>

                {/* Resend / Back Options */}
                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => {
                      setStep('email')
                      setOtp(['', '', '', '', '', ''])
                      setError('')
                    }}
                    className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    ← Change Email
                  </button>
                  
                  {canResend && (
                    <button
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm">
            <KeyRound className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">Secured with Email OTP</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Sri Orusol Jewellers - Secure Access
        </div>
      </div>
    </div>
  )
}

// Check if user is OTP authenticated
export const isOTPAuthenticated = () => {
  return !!sessionStorage.getItem('otp_auth_token')
}

// Clear OTP authentication
export const clearOTPAuth = () => {
  sessionStorage.removeItem('otp_auth_token')
  sessionStorage.removeItem('otp_auth_email')
}

export default OTPLogin
