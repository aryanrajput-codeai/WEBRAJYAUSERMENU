import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(url, key);

async function discover() {
  console.log("Signing in as John Smith to run discovery...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "john@testrestaurant.com",
    password: "password123"
  });

  if (authError) {
    console.error("Auth failed (make sure restaurant is onboarded first):", authError.message);
    return;
  }

  const user = authData.user;
  const restId = user.user_metadata.restaurant_id || "d14f4e70-349d-4c33-bf5e-ae18a5996f01"; // fallback placeholder
  console.log(`Authenticated. User ID: ${user.id}, Restaurant ID: ${restId}`);

  // Test 1: Expenses Table Columns
  console.log("\n--- Testing Expenses Table ---");
  const testExpense = {
    restaurant_id: restId,
    title: "Test Expense Title",
    amount: 150.50,
    category: "Utilities",
    date: new Date().toISOString().split("T")[0]
  };
  
  let res = await supabase.from("expenses").insert([testExpense]);
  console.log("Insert with standard fields:", res.error ? `Failed: ${res.error.message} (${res.error.code})` : "Success!");

  if (res.error && res.error.message.includes("column")) {
    // If title doesn't exist, try name
    console.log("Trying alternative columns for expenses...");
    const altExpense = {
      restaurant_id: restId,
      name: "Test Expense Name",
      amount: 150.50,
      category: "Utilities",
      created_at: new Date().toISOString()
    };
    let resAlt = await supabase.from("expenses").insert([altExpense]);
    console.log("Insert with alternative fields:", resAlt.error ? `Failed: ${resAlt.error.message}` : "Success!");
  }

  // Test 2: Customers Table Columns
  console.log("\n--- Testing Customers Table ---");
  const testCustomer = {
    restaurant_id: restId,
    name: "Jane Doe",
    phone: "9876543210",
    email: "jane@doe.com",
    created_at: new Date().toISOString()
  };
  
  res = await supabase.from("customers").insert([testCustomer]);
  console.log("Customer Insert with standard fields:", res.error ? `Failed: ${res.error.message} (${res.error.code})` : "Success!");

  if (res.error && res.error.message.includes("column")) {
    console.log("Trying alternative columns for customers...");
    const altCustomer = {
      restaurant_id: restId,
      customer_name: "Jane Doe",
      phone_number: "9876543210",
      email: "jane@doe.com"
    };
    let resAlt = await supabase.from("customers").insert([altCustomer]);
    console.log("Insert with alternative fields:", resAlt.error ? `Failed: ${resAlt.error.message}` : "Success!");
  }
}

discover();
