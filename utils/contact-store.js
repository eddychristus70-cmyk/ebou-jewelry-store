const fs = require("fs");
const path = require("path");

const CONTACTS_FILE = path.join(__dirname, "..", "contacts.json");
const REDIS_KEY = "contact-messages";

// Try to use Upstash Redis (works on Vercel + any serverless platform)
let redis = null;
try {
  const { Redis } = require("@upstash/redis");
  const url = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
} catch (e) {
  // Upstash Redis not available — fall back to file system
}

// --- File-based fallback (local dev) ---
function readFileStore() {
  try {
    if (!fs.existsSync(CONTACTS_FILE)) return [];
    const raw = fs.readFileSync(CONTACTS_FILE, "utf8");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("contact-store file read error", err);
    return [];
  }
}

function writeFileStore(data) {
  try {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("contact-store file write error", err);
  }
}

// --- Redis-based store (Vercel production) ---
async function readRedisStore() {
  try {
    const data = await redis.get(REDIS_KEY);
    if (!data) return [];
    // @upstash/redis auto-deserializes JSON
    if (Array.isArray(data)) return data;
    if (typeof data === "string") return JSON.parse(data);
    return [];
  } catch (err) {
    console.warn("contact-store redis read error", err);
    return [];
  }
}

async function writeRedisStore(data) {
  try {
    await redis.set(REDIS_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("contact-store redis write error", err);
  }
}

// --- Public API (async, works with both backends) ---
async function appendMessage(message) {
  if (!message || typeof message !== "object") return;
  const entry = {
    ...message,
    createdAt: message.createdAt || new Date().toISOString(),
  };

  if (redis) {
    const existing = await readRedisStore();
    existing.push(entry);
    await writeRedisStore(existing);
  } else {
    const existing = readFileStore();
    existing.push(entry);
    writeFileStore(existing);
  }
}

async function getMessages(limit) {
  const data = redis ? await readRedisStore() : readFileStore();
  const sorted = data.slice().sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
  if (typeof limit === "number" && limit > 0) {
    return sorted.slice(0, limit);
  }
  return sorted;
}

module.exports = { appendMessage, getMessages };
