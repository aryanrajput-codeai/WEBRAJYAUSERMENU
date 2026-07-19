import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(url, key);

async function testLogin() {
  const email = "john@testrestaurant.com";
  const password = "password123";

  console.log(`Checking login for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("❌ Login Failed:", error.message);
  } else {
    console.log("🎉 Login Succeeded!");
    console.log("User metadata:", data.user.user_metadata);
    console.log("User ID:", data.user.id);
    
    // Check if linked to restaurant
    const { data: ruData, error: ruError } = await supabase
      .from("restaurant_users")
      .select("restaurant_id, role")
      .eq("user_id", data.user.id);
      
    if (ruError) {
      console.error("Failed to query restaurant_users:", ruError.message);
    } else {
      console.log("Linked Restaurants:", ruData);
    }
  }
}

testLogin();
