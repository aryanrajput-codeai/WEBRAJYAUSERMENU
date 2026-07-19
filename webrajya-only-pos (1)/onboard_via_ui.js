import puppeteer from "puppeteer-core";
import dotenv from "dotenv";

dotenv.config();

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log("Launching Google Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  // Handle page dialogs/alerts automatically
  page.on("dialog", async dialog => {
    console.log(`[Browser Dialog] Type: ${dialog.type()}, Message: "${dialog.message()}"`);
    await dialog.accept();
  });

  try {
    console.log("Navigating to Super Admin Portal (http://localhost:3000)...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });

    // Step 1: Login
    console.log("Checking if Login Screen is visible...");
    await page.waitForSelector("#input-login-email", { timeout: 5000 });
    
    console.log("Entering credentials...");
    await page.type("#input-login-email", "admin@webrajya.com");
    await page.type("#input-login-password", "admin123");
    
    console.log("Clicking login submit...");
    await page.click("#btn-login-submit");
    
    // Wait for main dashboard to load
    console.log("Waiting for dashboard view...");
    await page.waitForSelector("#btn-quick-add-restaurant", { timeout: 10000 });
    console.log("🎉 Successfully logged into Super Admin Dashboard!");

    // Step 2: Open Wizard
    console.log("Clicking 'Add Restaurant' button...");
    await page.click("#btn-quick-add-restaurant");
    
    console.log("Waiting for onboarding wizard to open...");
    await page.waitForSelector("#input-wizard-rest-name", { timeout: 5000 });

    // Step 3: Fill Wizard Step 1
    console.log("Wizard Step 1: Filling Owner Info...");
    await page.type("#input-wizard-rest-name", "Test Restaurant");
    await page.type("#input-wizard-owner-name", "John Smith");
    await page.type("#input-wizard-email", "john@testrestaurant.com");
    await page.type("#input-wizard-phone", "9999999999");
    await page.type("#input-wizard-password", "password123");
    
    console.log("Clicking Next...");
    await page.click("#btn-wizard-next");
    await delay(1000); // Wait for transition

    // Step 4: Fill Wizard Step 2
    console.log("Wizard Step 2: Filling Address & GST...");
    await page.waitForSelector("#input-wizard-address", { timeout: 5000 });
    await page.type("#input-wizard-address", "123 Main Street");
    await page.type("#input-wizard-city", "Mumbai");
    await page.type("#input-wizard-state", "Maharashtra");
    await page.type("#input-wizard-gst", "27AAAAA0000A1Z5");
    
    console.log("Clicking Next...");
    await page.click("#btn-wizard-next");
    await delay(1000);

    // Step 5: Fill Wizard Step 3
    console.log("Wizard Step 3: Selecting Plan & Config...");
    await page.waitForSelector("#select-wizard-plan", { timeout: 5000 });
    
    await page.select("#select-wizard-plan", "trial");
    await page.type("#input-wizard-expiry", "2027-07-19");
    await page.select("#select-wizard-currency", "INR");
    
    // Clear and type branch
    await page.focus("#input-wizard-branch");
    await page.keyboard.down("Meta");
    await page.keyboard.press("A");
    await page.keyboard.up("Meta");
    await page.keyboard.press("Backspace");
    await page.type("#input-wizard-branch", "Main Branch");

    console.log("Clicking Next...");
    await page.click("#btn-wizard-next");
    await delay(1000);

    // Step 6: Review and Submit (Step 4)
    console.log("Wizard Step 4: Submitting Onboarding...");
    await page.waitForSelector("#btn-wizard-submit", { timeout: 5000 });
    await page.click("#btn-wizard-submit");

    // Wait for success screen or log redirect
    console.log("Waiting for onboarding transaction to complete...");
    // Let's wait for a success notification or close wizard success button
    await page.waitForSelector("#btn-close-wizard-success", { timeout: 25000 });
    console.log("🎉 Restaurant onboarding transaction completed successfully!");

    console.log("Closing wizard success dialog...");
    await page.click("#btn-close-wizard-success");
    await delay(1000);

    // Take screenshot of list
    await page.screenshot({ path: "super_admin_dashboard.png" });
    console.log("Screenshot saved as super_admin_dashboard.png");

  } catch (err) {
    console.error("❌ Onboarding flow failed:", err);
    await page.screenshot({ path: "onboarding_error.png" });
    console.log("Error screenshot saved as onboarding_error.png");
  } finally {
    await browser.close();
  }
}

run();
