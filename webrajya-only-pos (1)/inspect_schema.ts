import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const sb = createClient(url, key);

async function inspectTable(table: string, columns: string[]) {
  console.log(`\n=== ${table} ===`);
  for (const col of columns) {
    const { error } = await sb.from(table).select(col).limit(1);
    if (error?.message?.includes(`Could not find the '${col}'`) || error?.message?.includes(`column "${col}"`)) {
      console.log(`  MISSING: ${col}`);
    } else {
      console.log(`  EXISTS : ${col}`);
    }
  }
}

(async () => {
  await inspectTable("restaurants", ["id","name","owner_name","email","phone","address","city","state","country","logo","gst_number","plan","status","expiry_date","created_at","updated_at"]);
  await inspectTable("restaurant_settings", ["restaurant_id","currency","gst_percentage"]);
  await inspectTable("restaurant_counters", ["restaurant_id","order_counter","kot_counter"]);
  await inspectTable("branches", ["id","restaurant_id","name","status","created_at"]);
  await inspectTable("orders", ["id","restaurant_id","customer_name","phone_number","order_type","items","subtotal","grand_total","payment_status","order_status","created_at"]);
  await inspectTable("payment_methods", ["id","restaurant_id","name","is_enabled","created_at"]);
  await inspectTable("taxes", ["id","restaurant_id","name","rate","type","is_enabled","created_at"]);
})().catch(console.error);
