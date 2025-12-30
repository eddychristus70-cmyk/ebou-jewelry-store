const profileStore = require("../../utils/profile-store");

function normalizeBody(event) {
  if (event.body) {
    try {
      return JSON.parse(event.body);
    } catch (err) {
      return {};
    }
  }
  return {};
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

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const payload = normalizeBody(event);
  const email = String(payload.email || "")
    .trim()
    .toLowerCase();
  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const address = String(payload.address || "").trim();
  const cart = coerceCart(payload.cart);

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Email is required" }),
    };
  }

  const entry = {
    email,
    name,
    phone,
    address,
    cartSnapshot: cart,
    loginAt: new Date().toISOString(),
    meta: {
      userAgent: event.headers["user-agent"] || "",
      referer: event.headers.referer || event.headers.referrer || "",
    },
  };

  try {
    profileStore.appendProfile(entry);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("save-profile error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unable to save profile" }),
    };
  }
};
