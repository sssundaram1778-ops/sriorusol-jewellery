import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_Bq2xT0HdMIND@ep-broad-lake-aizjs2hb-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function checkTables() {
  try {
    // Check all tables in database
    console.log('=== ALL TABLES IN DATABASE ===');
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    allTables.forEach(t => console.log('  -', t.table_name));

    // Check second pledge tables
    console.log('\n=== SECOND PLEDGE TABLES ===');
    const secondTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%second%'
    `;
    
    if (secondTables.length === 0) {
      console.log('❌ No second pledge tables found!');
      console.log('   Run the neon-setup-second.sql to create them.');
    } else {
      secondTables.forEach(t => console.log('  ✓', t.table_name));
      
      // Count records
      console.log('\n=== RECORD COUNTS ===');
      const pledgeCount = await sql`SELECT COUNT(*) as count FROM pledges_second`;
      console.log('  pledges_second:', pledgeCount[0].count, 'records');
      
      const amountCount = await sql`SELECT COUNT(*) as count FROM pledge_amounts_second`;
      console.log('  pledge_amounts_second:', amountCount[0].count, 'records');
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

checkTables();
