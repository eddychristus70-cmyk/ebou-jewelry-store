const crypto = require("crypto");

function parseBody(req) {
  const body = req.body || req.rawBody;
  if (!body) return {};
  if (typeof body === "object") return body;
  try {
    return JSON.parse(body);
  } catch (err) {
    return {};
  }
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function safeCompare(a, b) {
  const aBuf = Buffer.from(a || "", "utf8");
  const bBuf = Buffer.from(b || "", "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { username = "", password = "" } = parseBody(req);
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const adminUser = process.env.ADMIN_USERNAME || "";
  const adminHash = process.env.ADMIN_PASSWORD_HASH || "";
  if (!adminUser || !adminHash) {
    res.status(500).json({ error: "Admin credentials not configured" });
    return;
  }

  const userMatch = safeCompare(username, adminUser);
  const passMatch = safeCompare(sha256(password), adminHash);

  if (!userMatch || !passMatch) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.status(200).json({
    success: true,
    token: process.env.CONTACT_ADMIN_TOKEN || null,
    redirect: "admin/messages.html",
  });
};
