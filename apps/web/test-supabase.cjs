const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://iqqrejasymilqogxyody.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcXJlamFzeW1pbHFvZ3h5b2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjgzMTksImV4cCI6MjA4Nzk0NDMxOX0.drNAE0-x7GgVG8x034oUTsRY3tnn9ZqXqbAgM76tg3E";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing Supabase connection...\n");
  
  // Test 1: Check if we can connect
  try {
    const { data, error } = await supabase.from("pledges").select("*").limit(5);
    if (error) {
      console.log("❌ Connection Error:", error.message);
      console.log("Error details:", error);
      return;
    }
    console.log("✅ Connected to Supabase!");
    console.log("📊 Existing pledges count:", data ? data.length : 0);
    if (data && data.length > 0) {
      console.log("\n📋 Sample pledges:");
      data.forEach(p => console.log(`   - ${p.pledge_no}: ${p.customer_name} - ₹${p.loan_amount || 'N/A'}`));
    }
  } catch (err) {
    console.log("❌ Error:", err.message);
    return;
  }

  // Test 2: Try to insert a test pledge
  console.log("\n🧪 Testing data insert...");
  const testPledge = {
    id: crypto.randomUUID(),
    pledge_no: "TEST-" + Date.now(),
    date: new Date().toISOString().split("T")[0],
    customer_name: "Test Customer",
    phone_number: "9876543210",
    place: "Test Place",
    jewels_details: "Test Gold Chain",
    no_of_items: 1,
    gross_weight: 10.5,
    net_weight: 10.0,
    jewel_type: "GOLD",
    interest_rate: 2,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data: insertedPledge, error: insertError } = await supabase
      .from("pledges")
      .insert(testPledge)
      .select()
      .single();

    if (insertError) {
      console.log("❌ Insert Error:", insertError.message);
      console.log("Error code:", insertError.code);
      console.log("Error details:", insertError.details);
      console.log("Error hint:", insertError.hint);
      return;
    }

    console.log("✅ Test pledge inserted successfully!");
    console.log("   Pledge No:", insertedPledge.pledge_no);
    console.log("   ID:", insertedPledge.id);

    // Test 3: Insert amount entry
    console.log("\n🧪 Testing amount insert...");
    const testAmount = {
      id: crypto.randomUUID(),
      pledge_id: insertedPledge.id,
      amount: 5000,
      date: new Date().toISOString().split("T")[0],
      interest_rate: 2,
      amount_type: "INITIAL",
      created_at: new Date().toISOString()
    };

    const { data: insertedAmount, error: amountError } = await supabase
      .from("pledge_amounts")
      .insert(testAmount)
      .select()
      .single();

    if (amountError) {
      console.log("❌ Amount Insert Error:", amountError.message);
      console.log("Error details:", amountError);
    } else {
      console.log("✅ Test amount inserted successfully!");
      console.log("   Amount:", insertedAmount.amount);
    }

    // Verify the data exists
    console.log("\n🔍 Verifying inserted data...");
    const { data: verifyData } = await supabase
      .from("pledges")
      .select("*")
      .eq("id", insertedPledge.id)
      .single();
    
    if (verifyData) {
      console.log("✅ Data verified in database!");
      console.log("   Customer:", verifyData.customer_name);
      console.log("   Status:", verifyData.status);
    }

  } catch (err) {
    console.log("❌ Error:", err.message);
  }
}

testConnection();
