// Script to create app_settings table for server-side PIN storage
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

const databaseUrl = process.env.VITE_DATABASE_URL || process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function createAppSettingsTable() {
  console.log('Creating app_settings table...')
  
  try {
    // Create app_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
        pin_hash VARCHAR(255),
        security_question TEXT,
        security_answer_hash VARCHAR(255),
        lockout_until TIMESTAMP,
        failed_attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    console.log('✅ app_settings table created successfully!')
    
    // Check if table exists
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'app_settings'
      ORDER BY ordinal_position
    `
    
    console.log('\nTable structure:')
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message)
    process.exit(1)
  }
}

createAppSettingsTable()
