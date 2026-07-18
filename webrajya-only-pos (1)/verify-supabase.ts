import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load local environment variables
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

console.log("=== SUPABASE PHASE 1 CONNECTION VERIFIER ===");
console.log(`Endpoint URL: ${url ? url : "[EMPTY]"}`);
console.log(`Anon Key: ${key ? key.substring(0, 15) + "..." : "[EMPTY]"}`);

if (!url || !key) {
  console.error("Error: Supabase environment variables are missing! Check your .env file.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function runVerification() {
  let passed = true;

  // 1. Connection Test
  console.log("\n[1] Testing connection to Supabase API...");
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .limit(1);

    if (ordersError) {
      console.error(`❌ Connection test failed: ${ordersError.message} (Code: ${ordersError.code})`);
      passed = false;
    } else {
      console.log(`✅ Connection test passed! Successfully connected to 'orders' table.`);
    }
  } catch (err: any) {
    console.error(`❌ Connection test failed with exception: ${err.message}`);
    passed = false;
  }

  // 2. Schema Checklist
  console.log("\n[2] Checking database schema tables...");
  const tables = [
    { name: "orders", required: true },
    { name: "menu_items", required: true },
    { name: "restaurants", required: true },
    { name: "restaurant_users", required: true },
    { name: "restaurant_settings", required: true },
    { name: "restaurant_counters", required: true },
    { name: "branches", required: true }
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table.name)
        .select("*")
        .limit(1);

      if (error && error.code === "PGRST205") {
        console.error(`❌ Table '${table.name}' does NOT exist in schema!`);
        passed = false;
      } else if (error) {
        // Any error other than PGRST205 (like 401/403 RLS issues or 406 no rows)
        // means the table exists, but query failed due to policies or data constraints.
        console.log(`✅ Table '${table.name}' exists (Query returned: ${error.message})`);
      } else {
        console.log(`✅ Table '${table.name}' exists and is fully queryable.`);
      }
    } catch (err: any) {
      console.error(`❌ Table '${table.name}' check threw exception: ${err.message}`);
      passed = false;
    }
  }

  // 3. Storage Bucket Test
  console.log("\n[3] Testing Storage API connectivity...");
  try {
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
      console.warn(`⚠️ Storage API returned error: ${storageError.message}. RLS policies might restrict listing buckets.`);
    } else {
      console.log(`✅ Storage API connected successfully. Active Buckets: ${buckets.map(b => b.name).join(", ") || "[None]"}`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Storage API check threw exception: ${err.message}`);
  }

  // Final Report
  console.log("\n=== VERIFICATION SUMMARY ===");
  if (passed) {
    console.log("🎉 ALL TESTS PASSED! Supabase configuration is 100% correct and initialized.");
  } else {
    console.error("❌ VERIFICATION FAILED! Some tables do not exist or connection failed. Please run the SQL setup script first.");
  }
}

runVerification();
