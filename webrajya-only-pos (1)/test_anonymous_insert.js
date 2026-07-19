import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(url, key);

async function testInsert() {
  const restId = "9779fd89-a54d-43c0-9443-725cfbb08d77"; // Idli Junction
  console.log(`Attempting anonymous insert into categories for restaurant ${restId}...`);
  
  const testCat = {
    id: "test-cat-anon",
    restaurant_id: restId,
    name: "Test Anon Category",
    icon: "🍔",
    description: "Testing anonymous RLS policy"
  };

  const { data, error } = await supabase.from("categories").insert([testCat]).select();
  if (error) {
    console.error("❌ Category insert failed:", error.message, error.code);
  } else {
    console.log("🎉 Category insert succeeded!", data);
  }

  console.log(`\nAttempting anonymous insert into orders...`);
  const testOrder = {
    id: "SR-999999",
    restaurant_id: restId,
    customer_name: "Test Customer",
    phone_number: "9999999999",
    order_type: "takeaway",
    items: JSON.stringify([{ name: "Idli", price: 50, quantity: 2 }]),
    subtotal: 100,
    grand_total: 105,
    payment_status: "Paid",
    order_status: "Completed"
  };

  const { data: oData, error: oError } = await supabase.from("orders").insert([testOrder]).select();
  if (oError) {
    console.error("❌ Order insert failed:", oError.message, oError.code);
  } else {
    console.log("🎉 Order insert succeeded!", oData);
  }
}

testInsert();
