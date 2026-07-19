import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(url, key);

async function testSuperAdmin() {
  const credentials = [
    { email: "admin@webrajya.com", password: "admin123" },
    { email: "admin@webrajya.com", password: "superadmin123" },
    { email: "aiaryanrajput@gmail.com", password: "password123" }
  ];

  let authenticated = false;
  for (const cred of credentials) {
    console.log(`Trying auth login for ${cred.email}...`);
    const { data, error } = await supabase.auth.signInWithPassword(cred);
    if (!error) {
      console.log(`🎉 Authenticated as ${cred.email}!`);
      authenticated = true;
      break;
    } else {
      console.warn(`Failed: ${error.message}`);
    }
  }

  if (!authenticated) {
    console.error("❌ Could not authenticate with any super admin credentials via Supabase Auth.");
    return;
  }

  // Now perform blank inserts to inspect columns
  const tables = ["categories", "orders", "expenses", "restaurants", "restaurant_users"];
  for (const table of tables) {
    console.log(`\nAttempting blank insert on table: ${table}...`);
    const { data, error } = await supabase.from(table).insert([{}]).select();
    if (error) {
      console.log(`Table ${table} error:`, error.message, error.details || "");
    } else {
      console.log(`🎉 Table ${table} columns:`, Object.keys(data[0]));
      // Clean up the blank row
      if (data[0].id) {
        await supabase.from(table).delete().eq("id", data[0].id);
      }
    }
  }
}

testSuperAdmin();
