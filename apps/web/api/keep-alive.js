import { createClient } from '@supabase/supabase-js'

// Vercel Serverless Function for Supabase keep-alive
// This prevents the free tier database from pausing due to inactivity

export const config = {
  runtime: 'edge'
}

export default async function handler(request) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Supabase not configured' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Simple query to keep the database active
    const { error } = await supabase
      .from('pledges')
      .select('id')
      .limit(1)

    if (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

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
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
