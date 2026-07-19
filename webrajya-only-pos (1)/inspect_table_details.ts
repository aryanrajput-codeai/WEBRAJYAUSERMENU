import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const sb = createClient(url, key);

async function inspectColumns() {
  const tables = ["categories", "customers", "expenses", "payment_methods", "taxes", "orders", "order_items", "branches"];
  
  for (const table of tables) {
    console.log(`\n=== Table: ${table} ===`);
    // Fetch a single row to inspect its keys
    const { data, error } = await sb.from(table).select("*").limit(1);
    if (error) {
      console.log(`  Error or empty: ${error.message} (Code: ${error.code})`);
      // Fallback: try inserting a row with dummy schema to get error message detailing expected columns
      const { error: insErr } = await sb.from(table).insert({}).select();
      if (insErr) {
        console.log(`  Insertion validation helper: ${insErr.message}`);
      }
    } else if (data && data.length > 0) {
      console.log("  Columns:", Object.keys(data[0]));
    } else {
      console.log("  Table is empty, no rows to inspect.");
      // Try to insert with empty object to get column list from postgres error if any, or just empty
      const { error: insErr } = await sb.from(table).insert({}).select();
      if (insErr) {
        console.log(`  Insertion columns trace: ${insErr.message}`);
      }
    }
  }
}

inspectColumns();
