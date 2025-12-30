const crypto = require("crypto");

const defaultHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function parseBody(body) {
  if (!body) return {};
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

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: defaultHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { username = "", password = "" } = parseBody(event.body);
  if (!username || !password) {
    return {
      statusCode: 400,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Username and password are required" }),
    };
  }

  const adminUser = process.env.ADMIN_USERNAME || "";
  const adminHash = process.env.ADMIN_PASSWORD_HASH || "";
  if (!adminUser || !adminHash) {
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Admin credentials not configured" }),
    };
  }

  const userMatch = safeCompare(username, adminUser);
  const passMatch = safeCompare(sha256(password), adminHash);

  if (!userMatch || !passMatch) {
    return {
      statusCode: 401,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Invalid credentials" }),
    };
  }

  return {
    statusCode: 200,
    headers: defaultHeaders,
    body: JSON.stringify({
      success: true,
      token: process.env.CONTACT_ADMIN_TOKEN || null,
      redirect: "admin/messages.html",
    }),
  };
};
