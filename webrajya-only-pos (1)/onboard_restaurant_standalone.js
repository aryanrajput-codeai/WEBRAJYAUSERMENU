import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(url, key);

async function onboard() {
  const restaurantId = crypto.randomUUID();
  const ownerEmail = "john@testrestaurant.com";
  const ownerPassword = "password123";
  const now = new Date().toISOString();

  console.log(`Starting standalone onboarding. Generated Restaurant ID: ${restaurantId}`);

  // Step 1: Create Supabase Auth User
  console.log("Step 1: Creating Supabase Auth user...");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: ownerEmail,
    password: ownerPassword,
    options: {
      data: {
        full_name: "John Smith",
        restaurant_id: restaurantId,
        role: "owner"
      }
    }
  });

  let authUserId = "";
  if (authError) {
    if (authError.message.includes("already registered")) {
      console.log("Email already registered in Auth. Fetching existing user...");
      // Since email already exists, we will try to sign in to retrieve the user ID
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: ownerEmail,
        password: ownerPassword
      });
      if (signInError) {
        console.error("Sign in failed:", signInError.message);
        return;
      }
      authUserId = signInData.user.id;
    } else {
      console.error("Auth creation failed:", authError.message);
      return;
    }
  } else if (authData?.user) {
    authUserId = authData.user.id;
  }

  console.log(`Auth User ID: ${authUserId}`);

  // Step 2: Insert into restaurants
  console.log("Step 2: Inserting into restaurants...");
  const restaurantPayload = {
    id: restaurantId,
    name: "Test Restaurant",
    owner_name: "John Smith",
    email: ownerEmail,
    phone: "9999999999",
    address: "123 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    gst_number: "27AAAAA0000A1Z5",
    logo: "",
    plan: "trial",
    status: "active",
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now,
    updated_at: now
  };

  const { error: restError } = await supabase.from("restaurants").insert([restaurantPayload]);
  if (restError) {
    console.error("Step 2 Failed (restaurants):", restError.message);
    return;
  }
  console.log("Step 2 ✅ Restaurant inserted.");

  // Step 3: Insert into restaurant_users
  console.log("Step 3: Inserting into restaurant_users...");
  const { error: ruError } = await supabase.from("restaurant_users").insert([{
    user_id: authUserId,
    restaurant_id: restaurantId,
    role: "owner"
  }]);
  if (ruError) {
    console.error("Step 3 Failed (restaurant_users):", ruError.message);
    // Don't abort, since it might already exist if previously created
  } else {
    console.log("Step 3 ✅ restaurant_users inserted.");
  }

  // Step 4: Insert into restaurant_settings
  console.log("Step 4: Inserting into restaurant_settings...");
  const { error: settingsError } = await supabase.from("restaurant_settings").insert([{
    restaurant_id: restaurantId,
    currency: "INR",
    gst_percentage: 5.0
  }]);
  if (settingsError) {
    console.error("Step 4 Failed (restaurant_settings):", settingsError.message);
  } else {
    console.log("Step 4 ✅ restaurant_settings inserted.");
  }

  // Step 5: Insert into restaurant_counters
  console.log("Step 5: Inserting into restaurant_counters...");
  const { error: countersError } = await supabase.from("restaurant_counters").insert([{
    restaurant_id: restaurantId,
    order_counter: 1000,
    kot_counter: 1
  }]);
  if (countersError) {
    console.error("Step 5 Failed (restaurant_counters):", countersError.message);
  } else {
    console.log("Step 5 ✅ restaurant_counters inserted.");
  }

  // Step 6: Create default branch
  console.log("Step 6: Creating default branch...");
  const branchId = crypto.randomUUID();
  const { error: branchError } = await supabase.from("branches").insert([{
    id: branchId,
    restaurant_id: restaurantId,
    name: "Main Branch",
    status: "active",
    created_at: now
  }]);
  if (branchError) {
    console.error("Step 6 Failed (branches):", branchError.message);
  } else {
    console.log("Step 6 ✅ Default branch created.");
  }

  // Step 7: Insert default payment methods
  console.log("Step 7: Inserting default payment methods...");
  const paymentMethods = [
    { name: 'Cash', is_enabled: true },
    { name: 'UPI', is_enabled: true },
    { name: 'Credit Card', is_enabled: true },
    { name: 'Debit Card', is_enabled: true },
    { name: 'Net Banking', is_enabled: false },
    { name: 'Wallet', is_enabled: false },
  ].map(m => ({
    id: crypto.randomUUID(),
    restaurant_id: restaurantId,
    name: m.name,
    is_enabled: m.is_enabled,
    created_at: now
  }));

  const { error: pmError } = await supabase.from("payment_methods").insert(paymentMethods);
  if (pmError) {
    console.error("Step 7 Failed (payment_methods):", pmError.message);
  } else {
    console.log("Step 7 ✅ Default payment methods seeded.");
  }

  // Step 8: Insert default taxes
  console.log("Step 8: Inserting default taxes...");
  const taxes = [
    { name: 'CGST', rate: 2.5, type: 'percentage', is_enabled: true },
    { name: 'SGST', rate: 2.5, type: 'percentage', is_enabled: true },
    { name: 'IGST', rate: 5.0, type: 'percentage', is_enabled: false },
    { name: 'Service Charge', rate: 10.0, type: 'percentage', is_enabled: false },
  ].map(t => ({
    id: crypto.randomUUID(),
    restaurant_id: restaurantId,
    name: t.name,
    rate: t.rate,
    type: t.type,
    is_enabled: t.is_enabled,
    created_at: now
  }));

  const { error: taxError } = await supabase.from("taxes").insert(taxes);
  if (taxError) {
    console.error("Step 8 Failed (taxes):", taxError.message);
  } else {
    console.log("Step 8 ✅ Default taxes seeded.");
  }

  console.log("🎉 Onboarding Completed successfully!");
}

onboard();
