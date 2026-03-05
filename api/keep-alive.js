import { neon } from '@neondatabase/serverless'

// Vercel Serverless Function for Neon keep-alive
// This prevents the free tier database from pausing due to inactivity

export const config = {
  runtime: 'edge'
}

export default async function handler(request) {
  const databaseUrl = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL

  if (!databaseUrl) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Database not configured' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const sql = neon(databaseUrl)
    
    // Simple query to keep the database active
    await sql`SELECT 1`

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Keep-alive ping successful',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Database ping failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
