import dotenv from "dotenv";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";

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
  for (const table of tables) {
    const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${table}?select=*&limit=1`;
    try {
      const res = await fetch(endpoint, {
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`,
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
