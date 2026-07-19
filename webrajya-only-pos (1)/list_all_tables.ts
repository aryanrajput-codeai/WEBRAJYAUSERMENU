import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(url, key);

async function listTables() {
  // Querying public schema tables using RPC or standard queries
  // Since we don't have direct access to pg_catalog via standard select on typical Supabase keys,
  // we can test query various potential tables and see if they exist or fail with specific codes.
  const potentialTables = [
    "restaurants",
    "restaurant_users",
    "restaurant_settings",
    "restaurant_counters",
    "branches",
    "categories",
    "menu_items",
    "customers",
    "tables",
    "orders",
    "order_items",
    "payments",
    "kots",
    "expenses",
    "activity_logs",
    "sessions",
    "payment_methods",
    "taxes",
    "suppliers",
    "kitchen_printers",
    "roles",
    "coupons"
  ];

  console.log("Checking tables existence on Supabase...");
  for (const t of potentialTables) {
    const { error } = await supabase.from(t).select("*").limit(1);
    if (error && error.code === "PGRST205") {
      console.log(`❌ Table '${t}' does NOT exist.`);
    } else if (error) {
      console.log(`✅ Table '${t}' exists (Error: ${error.message}, Code: ${error.code})`);
    } else {
      console.log(`✅ Table '${t}' exists (Query Succeeded)`);
    }
  }
}

listTables();
