import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(url, key);

async function discover() {
  const restId = "9779fd89-a54d-43c0-9443-725cfbb08d77"; // Idli Junction
  const tables = [
    "categories",
    "orders",
    "expenses",
    "payment_methods",
    "taxes",
    "restaurant_users",
    "branches"
  ];

  for (const table of tables) {
    console.log(`\n--- Discovering columns for table: ${table} ---`);
    const payload = { restaurant_id: restId };
    
    // Some tables might need specific non-null fields to pass DB constraints
    if (table === "categories") {
      payload.name = "Temp Discover Category";
    }
    if (table === "branches") {
      payload.name = "Temp Discover Branch";
    }
    if (table === "taxes") {
      payload.name = "Temp Discover Tax";
      payload.rate = 5;
      payload.type = "percentage";
    }
    if (table === "payment_methods") {
      payload.name = "Temp Discover PM";
    }

    const { data, error } = await supabase
      .from(table)
      .insert([payload])
      .select();

    if (error) {
      console.log(`❌ Insert failed for ${table}:`, error.message);
      if (error.details) console.log(`   Details:`, error.details);
    } else {
      console.log(`🎉 Success! Table "${table}" columns:`, Object.keys(data[0]));
      console.log("   Row contents:", data[0]);
      
      // Clean up
      const idKey = data[0].id ? "id" : data[0].user_id ? "user_id" : null;
      if (idKey) {
        await supabase.from(table).delete().eq(idKey, data[0][idKey]);
      }
    }
  }
}

discover();
