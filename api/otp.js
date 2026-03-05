/**
 * OTP Authentication API
 * Sends OTP via Email using Gmail SMTP (Nodemailer)
 */

import nodemailer from 'nodemailer'

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map()

// Config
const OTP_EXPIRY_MINUTES = 5
const MAX_ATTEMPTS = 3
const AUTHORIZED_EMAIL = 'sssundaram1778@gmail.com'

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Create transporter for Gmail
const createTransporter = () => {
  // Use Gmail App Password (not regular password)
  // User needs to set up App Password in Google Account Settings
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || AUTHORIZED_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD // App Password from Google
    }
  })
}

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter()
  
  const mailOptions = {
    from: `"Sri Orusol Jewellers" <${process.env.GMAIL_USER || AUTHORIZED_EMAIL}>`,
    to: email,
    subject: '🔐 Your Login OTP - Sri Orusol Jewellers',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Secure Login</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Sri Orusol Jewellers</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; text-align: center;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 30px 0;">
              Your One-Time Password (OTP) for login:
            </p>
            
            <!-- OTP Box -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 25px; margin: 0 auto; display: inline-block;">
              <span style="font-size: 42px; font-weight: bold; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </span>
            </div>
            
            <!-- Warning -->
            <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; font-size: 13px; margin: 0;">
                ⚠️ This OTP will expire in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.<br>
                Do not share this code with anyone.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              If you didn't request this OTP, please ignore this email.
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} Sri Orusol Jewellers. Secure Pledge Management.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Your OTP for Sri Orusol Jewellers login is: ${otp}. This code will expire in ${OTP_EXPIRY_MINUTES} minutes.`
  }
  
  return transporter.sendMail(mailOptions)
}

// Clean up expired OTPs
const cleanupExpiredOTPs = () => {
  const now = Date.now()
  for (const [key, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(key)
    }
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  // Clean up expired OTPs periodically
  cleanupExpiredOTPs()
  
  try {
    const { action, email, otp, sessionId } = req.body || {}
    
    switch (action) {
      case 'send': {
        // Validate email - only authorized email can login
        if (!email || email.toLowerCase() !== AUTHORIZED_EMAIL.toLowerCase()) {
          return res.status(403).json({ 
            error: 'Unauthorized email address',
            message: 'Only the authorized owner can access this system.'
          })
        }
        
        // Check if Gmail App Password is configured
        if (!process.env.GMAIL_APP_PASSWORD) {
          console.error('GMAIL_APP_PASSWORD not configured')
          return res.status(500).json({ 
            error: 'Email service not configured',
            message: 'Please contact administrator to set up email authentication.'
          })
        }
        
        // Generate OTP
        const newOTP = generateOTP()
        const newSessionId = crypto.randomUUID()
        const expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000)
        
        // Store OTP with session
        otpStore.set(newSessionId, {
          otp: newOTP,
          email: email.toLowerCase(),
          expiresAt,
          attempts: 0
        })
        
        // Send email
        await sendOTPEmail(email, newOTP)
        
        console.log(`[OTP] Sent to ${email}, session: ${newSessionId}`)
        
        return res.json({ 
          success: true, 
          sessionId: newSessionId,
          message: 'OTP sent successfully',
          expiresIn: OTP_EXPIRY_MINUTES * 60
        })
      }
      
      case 'verify': {
        if (!sessionId || !otp) {
          return res.status(400).json({ error: 'Session ID and OTP are required' })
        }
        
        const session = otpStore.get(sessionId)
        
        if (!session) {
          return res.status(400).json({ 
            error: 'Invalid or expired session',
            message: 'Please request a new OTP.'
          })
        }
        
        // Check expiry
        if (Date.now() > session.expiresAt) {
          otpStore.delete(sessionId)
          return res.status(400).json({ 
            error: 'OTP expired',
            message: 'Your OTP has expired. Please request a new one.'
          })
        }
        
        // Check attempts
        if (session.attempts >= MAX_ATTEMPTS) {
          otpStore.delete(sessionId)
          return res.status(429).json({ 
            error: 'Too many attempts',
            message: 'Maximum attempts exceeded. Please request a new OTP.'
          })
        }
        
        // Verify OTP
        if (otp !== session.otp) {
          session.attempts++
          const remainingAttempts = MAX_ATTEMPTS - session.attempts
          return res.status(400).json({ 
            error: 'Invalid OTP',
            message: `Incorrect OTP. ${remainingAttempts} attempt(s) remaining.`,
            remainingAttempts
          })
        }
        
        // Success - delete used OTP
        otpStore.delete(sessionId)
        
        // Generate auth token (simple token for session)
        const authToken = crypto.randomUUID()
        
        console.log(`[OTP] Verified successfully for ${session.email}`)
        
        return res.json({ 
          success: true, 
          verified: true,
          authToken,
          message: 'Authentication successful'
        })
      }
      
      case 'check': {
        // Check if OTP service is configured
        const isConfigured = !!process.env.GMAIL_APP_PASSWORD
        return res.json({ 
          configured: isConfigured,
          authorizedEmail: AUTHORIZED_EMAIL
        })
      }
      
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('[OTP] Error:', error)
    return res.status(500).json({ 
      error: 'Failed to process request',
      message: error.message 
    })
  }
}
