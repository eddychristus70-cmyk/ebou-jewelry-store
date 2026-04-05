const accountStore = require("../utils/account-store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || req.rawBody || "{}");
    } catch (e) {
      body = {};
    }
  }

  const email = String(body.email || "").trim().toLowerCase();
  const hash = String(body.hash || "").trim();
  const profile = body.profile || {};

  if (!email || !hash) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }

  try {
    const existing = await accountStore.findAccount(email);
    if (existing) {
      res.status(409).json({ error: "Account already exists" });
      return;
    }

    const created = await accountStore.createAccount({
      email,
      hash,
      profile,
    });

    if (created) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to create account" });
    }
  } catch (err) {
    console.error("auth-signup error", err);
    res.status(500).json({ error: "Server error" });
  }
};
