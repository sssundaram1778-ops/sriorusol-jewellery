/**
 * Local Development Server for API Routes
 * Mimics Vercel serverless functions for local development
 */

import express from 'express'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3000

// Middleware
app.use(express.json())

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
})

// Dynamic API route handler
const apiHandler = async (apiPath) => {
  try {
    const module = await import(`./api/${apiPath}.js`)
    return module.default
  } catch (error) {
    console.error(`Failed to load API handler: ${apiPath}`, error)
    return null
  }
}

// API routes - specific routes first
app.all('/api/otp', async (req, res) => {
  try {
    const handler = await apiHandler('otp')
    if (handler) {
      await handler(req, res)
    } else {
      res.status(404).json({ error: 'API route not found: /api/otp' })
    }
  } catch (error) {
    console.error('API Error [/api/otp]:', error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
})

app.all('/api/db', async (req, res) => {
  try {
    const handler = await apiHandler('db')
    if (handler) {
      await handler(req, res)
    } else {
      res.status(404).json({ error: 'API route not found: /api/db' })
    }
  } catch (error) {
    console.error('API Error [/api/db]:', error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
})

app.all('/api/keep-alive', async (req, res) => {
  try {
    const handler = await apiHandler('keep-alive')
    if (handler) {
      await handler(req, res)
    } else {
      res.status(404).json({ error: 'API route not found: /api/keep-alive' })
    }
  } catch (error) {
    console.error('API Error [/api/keep-alive]:', error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
})

// Start server
const server = createServer(app)

server.listen(PORT, () => {
  console.log(`\n🚀 API Server running at http://localhost:${PORT}`)
  console.log(`📧 Gmail User: ${process.env.GMAIL_USER || 'Not configured'}`)
  console.log(`🔑 Gmail App Password: ${process.env.GMAIL_APP_PASSWORD ? '✓ Configured' : '✗ Not configured'}`)
  console.log(`\nAvailable API routes:`)
  console.log(`  POST /api/otp - OTP Authentication`)
  console.log(`  POST /api/db - Database operations`)
  console.log(`  GET  /api/keep-alive - Health check\n`)
})
