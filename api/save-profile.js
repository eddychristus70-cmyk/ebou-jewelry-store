const profileStore = require("../utils/profile-store");

function normalizeBody(body, rawBody) {
  if (!body || typeof body === "string") {
    try {
      return JSON.parse(body || rawBody || "{}");
    } catch (err) {
      return {};
    }
  }
  return body;
}

function coerceCart(value) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (err) {
      return {};
    }
  }
  return {};
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const payload = normalizeBody(req.body, req.rawBody);
  const email = String(payload.email || "")
    .trim()
    .toLowerCase();
  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const address = String(payload.address || "").trim();
  const cart = coerceCart(payload.cart);

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const entry = {
    email,
    name,
    phone,
    address,
    cartSnapshot: cart,
    loginAt: new Date().toISOString(),
    meta: {
      userAgent: req.headers["user-agent"] || "",
      referer: req.headers.referer || req.headers.referrer || "",
    },
  };

  try {
    profileStore.appendProfile(entry);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("save-profile error", err);
    res.status(500).json({ error: "Unable to save profile" });
  }
};
