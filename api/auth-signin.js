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
  const profile = body.profile || null;
  const isGoogle = body.isGoogle === true;

  if (!email) {
    res.status(400).json({ error: "Missing email" });
    return;
  }

  try {
    // Google sign-in: create or update account
    if (isGoogle) {
      await accountStore.createOrUpdateGoogleAccount(email, profile);
      const account = await accountStore.findAccount(email);
      res.status(200).json({
        success: true,
        account: {
          email: account.email,
          profile: account.profile || {},
          isGoogleUser: true,
        },
      });
      return;
    }

    // Regular sign-in
    if (!hash) {
      res.status(400).json({ error: "Missing password" });
      return;
    }

    const account = await accountStore.findAccount(email);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    if (account.hash !== hash) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    // Update profile if provided
    if (profile) {
      await accountStore.updateAccountProfile(email, profile);
    }

    res.status(200).json({
      success: true,
      account: {
        email: account.email,
        profile: account.profile || {},
        createdAt: account.createdAt,
      },
    });
  } catch (err) {
    console.error("auth-signin error", err);
    res.status(500).json({ error: "Server error" });
  }
};
