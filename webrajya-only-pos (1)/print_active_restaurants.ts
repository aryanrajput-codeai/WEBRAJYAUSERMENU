import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(url, key);

async function checkData() {
  console.log("Fetching restaurants...");
  const { data: rest, error: restErr } = await supabase.from("restaurants").select("*");
  if (restErr) console.error("Error fetching restaurants:", restErr.message);
  else console.log("Restaurants in DB:", rest);

  console.log("\nFetching restaurant_users...");
  const { data: ru, error: ruErr } = await supabase.from("restaurant_users").select("*");
  if (ruErr) console.error("Error fetching restaurant_users:", ruErr.message);
  else console.log("Restaurant Users in DB:", ru);
}

checkData();
