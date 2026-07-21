import { createClient } from "@supabase/supabase-js";
import { menuItems as defaultMenuItems } from "./src/data";

const supabaseUrl = "https://krvlckokabfhivmegukb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtydmxja29rYWJmaGl2bWVndWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODkyODcsImV4cCI6MjA5OTg2NTI4N30.-wl0k_-Iq_WjQUPKi35ttuuY5ybsQdvGVbDH42RGQv4";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log(`Preparing to seed ${defaultMenuItems.length} default menu items to Supabase...`);
  
  // Transform items to match the Supabase table column structure
  const payload = defaultMenuItems.map(item => ({
    id: String(item.id),
    name: item.name,
    item_name: item.name, // Support both column variations
    price: Number(item.price),
    category: item.category,
    description: item.description || "",
    is_veg: !!item.isVeg,
    is_bestseller: !!item.isBestseller,
    is_chef_special: !!item.isChefSpecial,
    image: item.imageUrl,
    image_url: item.imageUrl, // Support both column variations
    spiciness: Number(item.spiciness || 0),
    rating: Number(item.rating || 4.5),
    rating_count: Number(item.ratingCount || 10)
  }));

  console.log("Upserting records to Supabase...");
  const { data, error } = await supabase
    .from("menu_items")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("Failed to seed items:", error);
  } else {
    console.log("Successfully seeded/synced all default menu items in Supabase!");
  }
}

run();
