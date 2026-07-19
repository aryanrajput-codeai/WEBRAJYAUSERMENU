import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(url, key);

const tables = [
  "restaurants",
  "restaurant_users",
  "restaurant_settings",
  "restaurant_counters",
  "branches",
  "categories",
  "menu_items",
  "customers",
  "orders",
  "order_items",
  "payments",
  "expenses",
  "payment_methods",
  "taxes"
];

async function getHeaders() {
  console.log("Signing in as John Smith...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "john@testrestaurant.com",
    password: "password123"
  });

  if (authError) {
    console.error("❌ Authentication failed:", authError.message);
    return;
  }

  const jwt = authData.session.access_token;
  console.log("🎉 Authenticated! Fetching headers with JWT...");

  for (const table of tables) {
    const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${table}?select=*&limit=1`;
    try {
      const res = await fetch(endpoint, {
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${jwt}`,
          "Accept": "text/csv"
        }
      });
      
      const text = await res.text();
      if (res.ok) {
        const header = text.split("\n")[0];
        console.log(`Table: ${table} -> Columns: [ ${header.trim()} ]`);
      } else {
        console.log(`Table: ${table} -> Error ${res.status}: ${text.trim()}`);
      }
    } catch (err) {
      console.log(`Table: ${table} -> Exception: ${err.message}`);
    }
  }
}

getHeaders();
