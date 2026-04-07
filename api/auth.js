const accountStore = require("../utils/account-store");

let sendgrid = null;
try {
  sendgrid = require("@sendgrid/mail");
} catch (e) {
  // SendGrid not available
}

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

function generateResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
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

    // --- REQUEST PASSWORD RESET ---
    if (action === "request-reset") {
      const account = await accountStore.findAccount(email);

      // Don't reveal if email exists (security)
      if (!account) {
        res.status(200).json({ success: true, emailSent: true });
        return;
      }

      // Google-only accounts have no password
      if (account.isGoogleUser && !account.hash) {
        res.status(200).json({ success: true, googleUser: true });
        return;
      }

      const code = generateResetCode();
      await accountStore.storeResetCode(email, code);

      // Try sending email via SendGrid
      let emailSent = false;
      const apiKey = process.env.CONTACT_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY || "";
      const from = process.env.CONTACT_SENDGRID_FROM || process.env.SENDGRID_FROM || "";

      if (sendgrid && apiKey && from) {
        try {
          sendgrid.setApiKey(apiKey);
          await sendgrid.send({
            to: email,
            from,
            subject: "Ebou Jewelry - Password Reset Code",
            text: `Your password reset code is: ${code}\n\nIt expires in 15 minutes. If you did not request this, please ignore this email.`,
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="color:#e50f65;margin:0 0 16px;">Ebou Jewelry</h2>
              <p>Your password reset code is:</p>
              <div style="background:#f3f4f6;border-radius:12px;padding:20px;text-align:center;margin:16px 0;">
                <span style="font-size:2rem;font-weight:700;letter-spacing:8px;color:#111827;">${code}</span>
              </div>
              <p style="color:#6b7280;font-size:0.9rem;">This code expires in 15 minutes. If you did not request a password reset, please ignore this email.</p>
            </div>`,
          });
          emailSent = true;
        } catch (err) {
          console.warn("Reset email send failed:", err);
        }
      }

      res.status(200).json({ success: true, emailSent });
      return;
    }

    // --- VERIFY RESET CODE ---
    if (action === "verify-reset") {
      const code = String(body.code || "").trim();
      const newHash = String(body.newHash || "").trim();

      if (!code || !newHash) {
        res.status(400).json({ error: "Missing code or new password" });
        return;
      }

      const valid = await accountStore.verifyResetCode(email, code);
      if (!valid) {
        res.status(401).json({ error: "Invalid or expired code" });
        return;
      }

      await accountStore.updatePassword(email, newHash);
      res.status(200).json({ success: true });
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
