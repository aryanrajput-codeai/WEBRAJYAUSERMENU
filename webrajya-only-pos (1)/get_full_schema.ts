import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function fetchSchema() {
  if (!url || !key) {
    console.error("Supabase environment variables not set.");
    return;
  }

  const endpoint = url.replace(/\/$/, "") + "/rest/v1/";
  console.log(`Fetching schema from PostgREST: ${endpoint}`);

  try {
    const res = await fetch(endpoint, {
      headers: {
        "apikey": key,
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    fs.writeFileSync(
      path.join(process.cwd(), "db_schema_details.json"),
      JSON.stringify(data, null, 2)
    );
    console.log("🎉 Schema fetched and saved to db_schema_details.json");
    
    // Print table names
    if (data.definitions) {
      console.log("\nTables found in schema:");
      Object.keys(data.definitions).forEach(t => console.log(` - ${t}`));
    }
  } catch (err) {
    console.error("❌ Failed to fetch schema:", err);
  }
}

fetchSchema();
