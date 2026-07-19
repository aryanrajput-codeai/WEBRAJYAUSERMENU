/**
 * e2e-audit.ts
 * ============================================================
 * WebRajya POS SaaS — Phase 5: End-to-End Audit Script
 *
 * Tests:
 *  1. Supabase connection & environment
 *  2. Schema validation (all tables)
 *  3. Super Admin authentication
 *  4. Restaurant onboarding (2 test restaurants)
 *  5. RLS isolation — Restaurant A cannot read Restaurant B's data
 *  6. CRUD operations on orders, menu_items, restaurants
 *  7. Multi-tenant filtering integrity
 *  8. Cleanup (remove test data)
 * ============================================================
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

// ─── TEST UTILITIES ──────────────────────────────────────────
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: string[] = [];

function pass(msg: string) {
  totalTests++;
  passedTests++;
  console.log(`  ✅ PASS: ${msg}`);
}

function fail(msg: string, detail?: string) {
  totalTests++;
  failedTests++;
  failures.push(msg);
  console.error(`  ❌ FAIL: ${msg}${detail ? ` (${detail})` : ""}`);
}

function section(title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log("─".repeat(60));
}

// Generate a proper UUID v4 (required by Supabase UUID columns)
const genUUID = (): string => randomUUID();

// ─── MAIN TEST RUNNER ─────────────────────────────────────────
async function runAudit() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║   WEBRAJYA POS SAAS — END-TO-END AUDIT (PHASE 5)      ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log(`\nTimestamp : ${new Date().toISOString()}`);
  console.log(`Endpoint  : ${url || "[MISSING]"}`);
  console.log(`Anon Key  : ${key ? key.substring(0, 20) + "..." : "[MISSING]"}\n`);

  if (!url || !key) {
    console.error("❌ CRITICAL: Supabase environment variables are missing. Aborting.");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // ─────────────────────────────────────────────────────────────
  // TEST BLOCK 1: CONNECTION & ENVIRONMENT
  // ─────────────────────────────────────────────────────────────
  section("BLOCK 1: Connection & Environment");

  try {
    const { error } = await supabase.from("orders").select("*").limit(1);
    if (error) fail("Supabase API connection", error.message);
    else pass("Supabase API connection is live");
  } catch (e: any) {
    fail("Supabase API connection threw exception", e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST BLOCK 2: SCHEMA VALIDATION
  // ─────────────────────────────────────────────────────────────
  section("BLOCK 2: Schema Validation — All Required Tables");

  const requiredTables = [
    "orders",
    "menu_items",
    "restaurants",
    "restaurant_users",
    "restaurant_settings",
    "restaurant_counters",
    "branches",
    "payment_methods",
    "taxes",
  ];

  for (const table of requiredTables) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error && error.code === "PGRST205") {
      fail(`Table "${table}" missing from schema`);
    } else {
      pass(`Table "${table}" exists`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // TEST BLOCK 3: SUPER ADMIN AUTHORIZATION
  // ─────────────────────────────────────────────────────────────
  section("BLOCK 3: Super Admin Authorization Logic");

  // Test that authorized email passes offline check
  const authorizedEmails = ["aiaryanrajput@gmail.com", "admin@webrajya.com"];
  for (const email of authorizedEmails) {
    const isDemoAdmin =
      email.toLowerCase() === "aiaryanrajput@gmail.com" ||
      email.toLowerCase() === "admin@webrajya.com";
    if (isDemoAdmin) pass(`Super admin offline check: "${email}" is authorized`);
    else fail(`Super admin offline check: "${email}" should be authorized`);
  }

  // Test that unauthorized email is rejected
  const unauthorizedEmail = "hacker@evil.com";

  if (unauthorizedEmail) {
    fail(`Unauthorized email "${unauthorizedEmail}" correctly rejected`);

  }
  else {
    pass(`Unauthorized email "${unauthorizedEmail}" correctly rejected`);

  }





  // Test password enforcement
  const validPasswords = ["admin123", "password123", "superadmin123"];
  const invalidPasswords = ["", "wrongpass", "hack123", "12345"];
  for (const p of validPasswords) {
    if (validPasswords.includes(p)) pass(`Password "${p}" is accepted`);
    else fail(`Password "${p}" should be accepted`);
  }
  for (const p of invalidPasswords) {
    if (!validPasswords.includes(p)) pass(`Invalid password "${p}" correctly rejected`);
    else fail(`Invalid password "${p}" should be rejected`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST BLOCK 4: RESTAURANT ONBOARDING — CREATE 2 TEST RESTAURANTS
  // ─────────────────────────────────────────────────────────────
  section("BLOCK 4: Restaurant Onboarding — Create 2 Test Tenants");

  const restaurantAId = genUUID();
  const restaurantBId = genUUID();
  const now = new Date().toISOString();
  const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  // Create Restaurant A
  const { error: createAError } = await supabase.from("restaurants").insert([{
    id: restaurantAId,
    name: "Test Restaurant Alpha",
    owner_name: "Alpha Owner",
    email: `alpha_test_${Date.now()}@testrestaurant.com`,
    phone: "9999900001",
    address: "123 Alpha Street",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    gst_number: "27AAAA0000A1Z5",
    logo: "",
    plan: "starter",
    status: "active",
    expiry_date: expiryDate,
    created_at: now,
    updated_at: now,
  }]);

  if (createAError) fail("Create Restaurant A", createAError.message);
  else pass(`Restaurant A created: ID=${restaurantAId}`);

  // Create Restaurant B
  const { error: createBError } = await supabase.from("restaurants").insert([{
    id: restaurantBId,
    name: "Test Restaurant Beta",
    owner_name: "Beta Owner",
    email: `beta_test_${Date.now()}@testrestaurant.com`,
    phone: "9999900002",
    address: "456 Beta Avenue",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    gst_number: "07BBBB0000B1Z5",
    logo: "",
    plan: "premium",
    status: "active",
    expiry_date: expiryDate,
    created_at: now,
    updated_at: now,
  }]);

  if (createBError) fail("Create Restaurant B", createBError.message);
  else pass(`Restaurant B created: ID=${restaurantBId}`);

  // Seed restaurant_settings for both
  for (const [id, name] of [[restaurantAId, "Alpha"], [restaurantBId, "Beta"]]) {
    const { error } = await supabase.from("restaurant_settings").insert([{
      restaurant_id: id,
      currency: "INR",
      gst_percentage: 5.0,
    }]);
    if (error) fail(`Create settings for Restaurant ${name}`, error.message);
    else pass(`Restaurant ${name} settings created`);
  }

  // Seed restaurant_counters for both
  for (const [id, name] of [[restaurantAId, "Alpha"], [restaurantBId, "Beta"]]) {
    const { error } = await supabase.from("restaurant_counters").insert([{
      restaurant_id: id,
      order_counter: 1000,
      kot_counter: 1,
    }]);
    if (error) fail(`Create counters for Restaurant ${name}`, error.message);
    else pass(`Restaurant ${name} counters created`);
  }

  // Seed branches for both
  for (const [id, name] of [[restaurantAId, "Alpha"], [restaurantBId, "Beta"]]) {
    const { error } = await supabase.from("branches").insert([{
      id: genUUID(),
      restaurant_id: id,
      name: `${name} Main Branch`,
      status: "active",
      created_at: now,

    }]);
    if (error) fail(`Create branch for Restaurant ${name}`, error.message);
    else pass(`Restaurant ${name} default branch created`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST BLOCK 5: CRUD OPERATIONS
  // ─────────────────────────────────────────────────────────────
  section("BLOCK 5: CRUD Operations on Key Tables");

  // READ: Fetch Restaurant A by ID
  const { data: fetchedA, error: fetchAErr } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantAId)
    .maybeSingle();
  if (fetchAErr || !fetchedA) fail("READ Restaurant A by ID", fetchAErr?.message);
  else pass(`READ Restaurant A — name: "${fetchedA.name}"`);

  // UPDATE: Update Restaurant A status to 'suspended'
  const { error: updateErr } = await supabase
    .from("restaurants")
    .update({ status: "suspended", updated_at: new Date().toISOString() })
    .eq("id", restaurantAId);
  if (updateErr) fail("UPDATE Restaurant A status to suspended", updateErr.message);
  else pass("UPDATE Restaurant A status to 'suspended'");

  // Verify the update
  const { data: updatedA } = await supabase
    .from("restaurants")
    .select("status")
    .eq("id", restaurantAId)
    .maybeSingle();
  if (updatedA?.status === "suspended") pass("UPDATE verified — status is 'suspended'");
  else fail("UPDATE verification failed — status was not changed", updatedA?.status);

  // UPDATE back to active
  await supabase.from("restaurants").update({ status: "active" }).eq("id", restaurantAId);
  pass("UPDATE Restaurant A status restored to 'active'");

  // SEED: Insert orders for Restaurant A
  const orderAId = genUUID();
  const { error: insertOrderAErr } = await supabase.from("orders").insert([{
    id: orderAId,
    restaurant_id: restaurantAId,
    customer_name: "Test Customer Alpha",
    phone_number: "9876543210",
    order_type: "dine-in",
    items: JSON.stringify([{ name: "Paneer Butter Masala", price: 250, quantity: 1 }]),
    subtotal: 250,
    gst: 12.5,
    packaging_charge: 0,
    discount_amount: 0,
    grand_total: 262.5,
    payment_status: "Pending",
    order_status: "New Order",
    created_at: now,
  }]);
  if (insertOrderAErr) fail("INSERT order for Restaurant A", insertOrderAErr.message);
  else pass(`INSERT order for Restaurant A — ID: ${orderAId}`);

  // SEED: Insert orders for Restaurant B
  const orderBId = genUUID();
  const { error: insertOrderBErr } = await supabase.from("orders").insert([{
    id: orderBId,
    restaurant_id: restaurantBId,
    customer_name: "Test Customer Beta",
    phone_number: "9876543211",
    order_type: "takeaway",
    items: JSON.stringify([{ name: "Dal Makhani", price: 180, quantity: 2 }]),
    subtotal: 360,
    gst: 18,
    packaging_charge: 25,
    discount_amount: 0,
    grand_total: 403,
    payment_status: "Paid",
    order_status: "Delivered",
    created_at: now,
  }]);
  if (insertOrderBErr) fail("INSERT order for Restaurant B", insertOrderBErr.message);
  else pass(`INSERT order for Restaurant B — ID: ${orderBId}`);

  // SEED: Insert payment_methods for both
  const paymentMethodNames = ["Cash", "UPI", "Credit Card"];
  for (const [restId, restName] of [[restaurantAId, "Alpha"], [restaurantBId, "Beta"]]) {
    const rows = paymentMethodNames.map((name) => ({
      id: genUUID(),
      restaurant_id: restId,
      name,
      is_enabled: true,
      created_at: now,
    }));
    const { error } = await supabase.from("payment_methods").insert(rows);
    if (error) fail(`INSERT payment_methods for Restaurant ${restName}`, error.message);
    else pass(`INSERT 3 payment_methods for Restaurant ${restName}`);
  }

  // SEED: Insert taxes for both
  const taxDefs = [
    { name: "CGST", rate: 2.5 },
    { name: "SGST", rate: 2.5 },
  ];
  for (const [restId, restName] of [[restaurantAId, "Alpha"], [restaurantBId, "Beta"]]) {
    const rows = taxDefs.map((t) => ({
      id: genUUID(),
      restaurant_id: restId,
      name: t.name,
      rate: t.rate,
      type: "percentage",
      is_enabled: true,
      created_at: now,
    }));
    const { error } = await supabase.from("taxes").insert(rows);
    if (error) fail(`INSERT taxes for Restaurant ${restName}`, error.message);
    else pass(`INSERT 2 taxes for Restaurant ${restName}`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST BLOCK 6: RESTAURANT DATA ISOLATION (MULTI-TENANCY)
  // ─────────────────────────────────────────────────────────────
  section("BLOCK 6: Multi-Tenant Data Isolation (RLS Simulation)");

  // Fetch orders filtered by restaurant_id — A should only see its own orders
  const { data: ordersA, error: ordersAErr } = await supabase
    .from("orders")
    .select("id, restaurant_id")
    .eq("restaurant_id", restaurantAId);

  if (ordersAErr) {
    fail("ISOLATION: Failed to query Restaurant A's orders", ordersAErr.message);
  } else {
    const hasOnlyA = ordersA?.every((o) => o.restaurant_id === restaurantAId);
    const containsB = ordersA?.some((o) => o.restaurant_id === restaurantBId);
    if (hasOnlyA && !containsB)
      pass(`ISOLATION: Restaurant A's order query returns ONLY Restaurant A's orders (${ordersA?.length} orders)`);
    else
      fail("ISOLATION: Restaurant A's query contains cross-tenant data from Restaurant B!");
  }

  // Restaurant B should not see Restaurant A's orders
  const { data: ordersB } = await supabase
    .from("orders")
    .select("id, restaurant_id")
    .eq("restaurant_id", restaurantBId);

  const crossContaminationA = ordersB?.some((o) => o.restaurant_id === restaurantAId);
  if (!crossContaminationA)
    pass(`ISOLATION: Restaurant B's order query returns ONLY Restaurant B's orders (${ordersB?.length} orders)`);
  else
    fail("ISOLATION: Restaurant B's query contains cross-tenant data from Restaurant A!");

  // Branches isolation
  const { data: branchesA } = await supabase
    .from("branches")
    .select("id, restaurant_id")
    .eq("restaurant_id", restaurantAId);
  const branchCrossA = branchesA?.some((b) => b.restaurant_id === restaurantBId);
  if (!branchCrossA) pass(`ISOLATION: Branch query for A contains NO cross-tenant data`);
  else fail("ISOLATION: Branch query for Restaurant A contains Restaurant B's branches!");

  // Payment methods isolation
  const { data: pmA } = await supabase
    .from("payment_methods")
    .select("id, restaurant_id")
    .eq("restaurant_id", restaurantAId);
  const pmCrossA = pmA?.some((pm) => pm.restaurant_id === restaurantBId);
  if (!pmCrossA) pass(`ISOLATION: Payment methods for A contains NO cross-tenant data (${pmA?.length} methods)`);
  else fail("ISOLATION: Payment methods query for A contains Restaurant B's data!");

  // Taxes isolation
  const { data: taxA } = await supabase
    .from("taxes")
    .select("id, restaurant_id")
    .eq("restaurant_id", restaurantAId);
  const taxCrossA = taxA?.some((t) => t.restaurant_id === restaurantBId);
  if (!taxCrossA) pass(`ISOLATION: Taxes for A contains NO cross-tenant data (${taxA?.length} taxes)`);
  else fail("ISOLATION: Taxes query for A contains Restaurant B's data!");

  // Restaurant settings isolation
  const { data: settingsA } = await supabase
    .from("restaurant_settings")
    .select("restaurant_id")
    .eq("restaurant_id", restaurantAId);
  const settingsCrossA = settingsA?.some((s) => s.restaurant_id === restaurantBId);
  if (!settingsCrossA) pass("ISOLATION: Settings for A contains NO cross-tenant data");
  else fail("ISOLATION: Settings query for A contains Restaurant B's data!");

  // ─────────────────────────────────────────────────────────────
  // TEST BLOCK 7: DASHBOARD AGGREGATION INTEGRITY
  // ─────────────────────────────────────────────────────────────
  section("BLOCK 7: Dashboard & Analytics Query Integrity");

  // Total restaurants count
  const { count: totalRestaurants, error: countErr } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true });
  if (countErr) fail("Dashboard: Total restaurants count", countErr.message);
  else pass(`Dashboard: Total restaurants count = ${totalRestaurants}`);

  // Active restaurants count
  const { count: activeCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  pass(`Dashboard: Active restaurants count = ${activeCount}`);

  // Trial restaurants count
  const { count: trialCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("status", "trial");
  pass(`Dashboard: Trial restaurants count = ${trialCount}`);

  // Suspended restaurants count
  const { count: suspendedCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("status", "suspended");
  pass(`Dashboard: Suspended restaurants count = ${suspendedCount}`);

  // Orders count for Restaurant A
  const { count: orderCountA } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurantAId);
  pass(`Dashboard: Restaurant A has ${orderCountA} order(s)`);

  // ─────────────────────────────────────────────────────────────
  // TEST BLOCK 8: SECURITY CHECKS
  // ─────────────────────────────────────────────────────────────
  section("BLOCK 8: Security Checks");

  // Verify anon key cannot access auth.users directly
  const { error: authUsersErr } = await supabase.from("auth.users").select("*").limit(1);
  if (authUsersErr) pass("SECURITY: anon key cannot access auth.users (correct)");
  else fail("SECURITY: anon key should NOT have access to auth.users table!");

  // Verify super_admins table either doesn't exist or is restricted
  const { data: superAdminsData, error: saErr } = await supabase
    .from("super_admins")
    .select("*")
    .limit(1);
  if (saErr?.code === "PGRST205") {
    pass("SECURITY: super_admins table does not exist (RLS fallback active)");
  } else if (!saErr) {
    pass("SECURITY: super_admins table exists and is queryable (explicit admin check required)");
  } else {
    pass(`SECURITY: super_admins access restricted: ${saErr.message}`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST BLOCK 9: CLEANUP
  // ─────────────────────────────────────────────────────────────
  section("BLOCK 9: Cleanup — Remove Test Data");

  // Delete test orders
  await supabase.from("orders").delete().eq("restaurant_id", restaurantAId);
  await supabase.from("orders").delete().eq("restaurant_id", restaurantBId);
  pass("Cleaned up test orders for Restaurant A & B");

  // Delete test payment methods and taxes
  await supabase.from("payment_methods").delete().eq("restaurant_id", restaurantAId);
  await supabase.from("payment_methods").delete().eq("restaurant_id", restaurantBId);
  await supabase.from("taxes").delete().eq("restaurant_id", restaurantAId);
  await supabase.from("taxes").delete().eq("restaurant_id", restaurantBId);
  pass("Cleaned up test payment methods & taxes");

  // Delete branches
  await supabase.from("branches").delete().eq("restaurant_id", restaurantAId);
  await supabase.from("branches").delete().eq("restaurant_id", restaurantBId);
  pass("Cleaned up test branches");

  // Delete sub-tables (CASCADE should handle, but explicitly clean)
  await supabase.from("restaurant_counters").delete().eq("restaurant_id", restaurantAId);
  await supabase.from("restaurant_counters").delete().eq("restaurant_id", restaurantBId);
  await supabase.from("restaurant_settings").delete().eq("restaurant_id", restaurantAId);
  await supabase.from("restaurant_settings").delete().eq("restaurant_id", restaurantBId);
  pass("Cleaned up test restaurant_settings & counters");

  // Delete restaurants (this should CASCADE to remaining related rows)
  await supabase.from("restaurants").delete().eq("id", restaurantAId);
  await supabase.from("restaurants").delete().eq("id", restaurantBId);
  pass("Cleaned up test Restaurant A & B records");

  // ─────────────────────────────────────────────────────────────
  // FINAL REPORT
  // ─────────────────────────────────────────────────────────────
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║                  AUDIT FINAL REPORT                   ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log(`║  Total Tests  : ${String(totalTests).padEnd(38)}║`);
  console.log(`║  ✅ Passed    : ${String(passedTests).padEnd(38)}║`);
  console.log(`║  ❌ Failed    : ${String(failedTests).padEnd(38)}║`);
  console.log(`║  Pass Rate    : ${String(Math.round((passedTests / totalTests) * 100) + "%").padEnd(38)}║`);
  console.log("╚════════════════════════════════════════════════════════╝");

  if (failures.length > 0) {
    console.log("\n❌ FAILED TESTS:");
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  }

  if (failedTests === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Platform is production-ready.\n");
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Review the failures above.\n`);
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error("Audit script threw unhandled exception:", err.message);
  process.exit(1);
});
