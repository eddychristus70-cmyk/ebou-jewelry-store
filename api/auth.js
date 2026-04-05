const accountStore = require("../utils/account-store");

function parseBody(req) {
  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || req.rawBody || "{}");
    } catch (e) {
      body = {};
    }
  }
  return body;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = parseBody(req);
  const action = String(body.action || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const hash = String(body.hash || "").trim();
  const profile = body.profile || null;
  const isGoogle = body.isGoogle === true;

  if (!email) {
    res.status(400).json({ error: "Missing email" });
    return;
  }

  try {
    // --- SIGNUP ---
    if (action === "signup") {
      if (!hash) {
        res.status(400).json({ error: "Missing password" });
        return;
      }
      const existing = await accountStore.findAccount(email);
      if (existing) {
        res.status(409).json({ error: "Account already exists" });
        return;
      }
      const created = await accountStore.createAccount({
        email,
        hash,
        profile: profile || {},
      });
      if (created) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to create account" });
      }
      return;
    }

    // --- GOOGLE SIGN-IN ---
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

    // --- SIGNIN (default) ---
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
    console.error("auth error", err);
    res.status(500).json({ error: "Server error" });
  }
};
