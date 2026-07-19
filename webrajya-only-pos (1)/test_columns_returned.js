import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(url, key);

async function testColumns() {
  console.log("Attempting blank insert into categories...");
  const { data: catData, error: catError } = await supabase
    .from("categories")
    .insert([{}])
    .select();

  if (catError) {
    console.error("Categories insert failed:", catError.message, catError.details || "");
  } else {
    console.log("🎉 Categories columns:", Object.keys(catData[0]));
    console.log("Row contents:", catData[0]);
  }

  console.log("\nAttempting blank insert into orders...");
  const { data: oData, error: oError } = await supabase
    .from("orders")
    .insert([{}])
    .select();

  if (oError) {
    console.error("Orders insert failed:", oError.message, oError.details || "");
  } else {
    console.log("🎉 Orders columns:", Object.keys(oData[0]));
    console.log("Row contents:", oData[0]);
  }
  
  console.log("\nAttempting blank insert into expenses...");
  const { data: expData, error: expError } = await supabase
    .from("expenses")
    .insert([{}])
    .select();

  if (expError) {
    console.error("Expenses insert failed:", expError.message, expError.details || "");
  } else {
    console.log("🎉 Expenses columns:", Object.keys(expData[0]));
    console.log("Row contents:", expData[0]);
  }
}

testColumns();
