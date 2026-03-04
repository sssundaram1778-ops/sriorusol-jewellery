import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_Bq2xT0HdMIND@ep-broad-lake-aizjs2hb-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function resetPIN() {
  try {
    // Reset PIN so user can set up fresh
    await sql`UPDATE app_settings SET pin_hash = NULL, security_question = NULL, security_answer_hash = NULL, failed_attempts = 0, lockout_until = NULL WHERE id = 'main'`;
    console.log('PIN reset successfully!');
    
    // Verify reset
    const settings = await sql`SELECT * FROM app_settings`;
    console.log('Settings after reset:', JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

resetPIN();
