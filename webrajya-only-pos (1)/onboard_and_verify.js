import puppeteer from "puppeteer-core";
import dotenv from "dotenv";

dotenv.config();

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createTempEmail() {
  console.log("Fetching domains from mail.tm...");
  const domainsRes = await fetch("https://api.mail.tm/domains");
  if (!domainsRes.ok) throw new Error("Failed to fetch domains");
  const domainsData = await domainsRes.json();
  const domain = domainsData["hydra:member"]?.[0]?.domain;
  if (!domain) throw new Error("No domain found");

  const randomUser = `owner_${Math.floor(100000 + Math.random() * 900000)}`;
  const address = `${randomUser}@${domain}`;
  const password = "password123";

  const createRes = await fetch("https://api.mail.tm/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password })
  });
  
  if (!createRes.ok) {
    throw new Error(`Failed to create account: ${await createRes.text()}`);
  }
  
  console.log(`Created temp email: ${address}`);
  return { address, password };
}

async function getTempMailToken(address, password) {
  const tokenRes = await fetch("https://api.mail.tm/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password })
  });
  if (!tokenRes.ok) throw new Error("Failed to get mail token");
  const tokenData = await tokenRes.json();
  return tokenData.token;
}

async function pollForEmail(token) {
  console.log("Polling for confirmation email from Supabase...");
  for (let i = 0; i < 20; i++) {
    await delay(3000);
    const msgsRes = await fetch("https://api.mail.tm/messages", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!msgsRes.ok) continue;
    const msgsData = await msgsRes.json();
    const msgList = msgsData["hydra:member"];
    if (msgList && msgList.length > 0) {
      console.log(`Email received! Subject: "${msgList[0].subject}"`);
      // Fetch full message
      const msgId = msgList[0].id;
      const detailRes = await fetch(`https://api.mail.tm/messages/${msgId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!detailRes.ok) throw new Error("Failed to fetch message details");
      const detailData = await detailRes.json();
      return detailData.html || detailData.text || "";
    }
  }
  throw new Error("Timeout waiting for email");
}

async function run() {
  let tempMail;
  try {
    tempMail = await createTempEmail();
  } catch (err) {
    console.error("Failed to create temp email, aborting:", err.message);
    return;
  }

  console.log("Launching Google Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on("dialog", async dialog => {
    console.log(`[Browser Dialog] Type: ${dialog.type()}, Message: "${dialog.message()}"`);
    await dialog.accept();
  });

  try {
    console.log("Navigating to Super Admin Portal...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });

    // Step 1: Login
    await page.waitForSelector("#input-login-email", { timeout: 5000 });
    await page.type("#input-login-email", "admin@webrajya.com");
    await page.type("#input-login-password", "admin123");
    await page.click("#btn-login-submit");
    
    await page.waitForSelector("#btn-quick-add-restaurant", { timeout: 10000 });
    console.log("Logged in to Super Admin.");

    // Step 2: Open Wizard
    await page.click("#btn-quick-add-restaurant");
    await page.waitForSelector("#input-wizard-rest-name", { timeout: 5000 });

    // Step 3: Wizard Step 1
    await page.type("#input-wizard-rest-name", "Test Restaurant");
    await page.type("#input-wizard-owner-name", "John Smith");
    await page.type("#input-wizard-email", tempMail.address);
    await page.type("#input-wizard-phone", "9999999999");
    await page.type("#input-wizard-password", "password123");
    await page.click("#btn-wizard-next");
    await delay(1000);

    // Step 4: Wizard Step 2
    await page.waitForSelector("#input-wizard-address", { timeout: 5000 });
    await page.type("#input-wizard-address", "123 Main Street");
    await page.type("#input-wizard-city", "Mumbai");
    await page.type("#input-wizard-state", "Maharashtra");
    await page.type("#input-wizard-gst", "27AAAAA0000A1Z5");
    await page.click("#btn-wizard-next");
    await delay(1000);

    // Step 5: Wizard Step 3
    await page.waitForSelector("#select-wizard-plan", { timeout: 5000 });
    await page.select("#select-wizard-plan", "trial");
    await page.type("#input-wizard-expiry", "2027-07-19");
    await page.select("#select-wizard-currency", "INR");
    
    await page.focus("#input-wizard-branch");
    await page.keyboard.down("Meta");
    await page.keyboard.press("A");
    await page.keyboard.up("Meta");
    await page.keyboard.press("Backspace");
    await page.type("#input-wizard-branch", "Main Branch");
    await page.click("#btn-wizard-next");
    await delay(1000);

    // Step 6: Review & Submit (Step 4)
    await page.waitForSelector("#btn-wizard-submit", { timeout: 5000 });
    await page.click("#btn-wizard-submit");

    // Wait for the success or commit dialog to complete
    console.log("Submitting transaction... Waiting for commit...");
    await page.waitForSelector("#btn-close-wizard-success", { timeout: 35000 });
    console.log("🎉 Onboarding wizard transaction completed!");

    await page.click("#btn-close-wizard-success");
    await delay(1000);

    // Now, poll mailbox for email
    const mailToken = await getTempMailToken(tempMail.address, tempMail.password);
    const emailHtml = await pollForEmail(mailToken);
    
    // Extract confirmation link
    // Look for link containing confirmation_url
    const linkMatch = emailHtml.match(/href="([^"]+confirm[^"]+)"/) || emailHtml.match(/href="([^"]+supabase[^"]+)"/);
    if (!linkMatch) {
      throw new Error("Confirmation link not found in email body");
    }
    let confirmUrl = linkMatch[1].replace(/&amp;/g, "&");
    console.log("Verification Link found:", confirmUrl);

    // Navigate Puppeteer to confirmation URL
    console.log("Opening verification link to confirm email...");
    const verifyPage = await browser.newPage();
    await verifyPage.goto(confirmUrl, { waitUntil: "networkidle2" });
    console.log("Email confirmation page loaded!");
    await delay(3000);
    await verifyPage.screenshot({ path: "email_confirmed.png" });
    await verifyPage.close();

    console.log(`🎉 SUCCESS! Owner ${tempMail.address} is onboarded and confirmed!`);

  } catch (err) {
    console.error("❌ Process Failed:", err.message);
    await page.screenshot({ path: "verification_error.png" });
  } finally {
    await browser.close();
  }
}

run();
