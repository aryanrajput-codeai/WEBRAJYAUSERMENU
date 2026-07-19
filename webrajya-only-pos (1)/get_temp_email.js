async function createTempEmail() {
  try {
    // 1. Fetch domains
    console.log("Fetching domains from mail.tm...");
    const domainsRes = await fetch("https://api.mail.tm/domains");
    if (!domainsRes.ok) throw new Error("Failed to fetch domains");
    const domainsData = await domainsRes.json();
    const domain = domainsData["hydra:member"]?.[0]?.domain;
    if (!domain) throw new Error("No domain found");
    console.log("Available domain:", domain);

    // 2. Generate random email address
    const randomUser = `test_owner_${Math.floor(100000 + Math.random() * 900000)}`;
    const address = `${randomUser}@${domain}`;
    const password = "password123";
    console.log("Generating email:", address);

    // 3. Create account
    const createRes = await fetch("https://api.mail.tm/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password })
    });
    
    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create account: ${errText}`);
    }
    
    const accountData = await createRes.json();
    console.log("🎉 Temp email created successfully:", accountData);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

createTempEmail();
