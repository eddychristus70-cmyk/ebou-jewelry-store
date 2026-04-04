const fs = require("fs");
const path = require("path");

const PROFILE_FILE = path.join(__dirname, "..", "profiles.json");
const REDIS_KEY = "customer-profiles";

// Try to use Upstash Redis
let redis = null;
try {
  const { Redis } = require("@upstash/redis");
  const url =
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
} catch (e) {
  // Redis not available — fall back to file system
}

// --- File-based fallback (local dev) ---
function readFileStore() {
  try {
    if (!fs.existsSync(PROFILE_FILE)) return [];
    const raw = fs.readFileSync(PROFILE_FILE, "utf8");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("profile-store file read error", err);
    return [];
  }
}

function writeFileStore(data) {
  try {
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("profile-store file write error", err);
  }
}

// --- Redis-based store ---
async function readRedisStore() {
  try {
    const data = await redis.get(REDIS_KEY);
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string") return JSON.parse(data);
    return [];
  } catch (err) {
    console.warn("profile-store redis read error", err);
    return [];
  }
}

async function writeRedisStore(data) {
  try {
    await redis.set(REDIS_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("profile-store redis write error", err);
  }
}

// --- Public API ---
async function appendProfile(profile) {
  if (!profile || typeof profile !== "object") return;
  const entry = {
    ...profile,
    loginAt: profile.loginAt || new Date().toISOString(),
  };

  if (redis) {
    const existing = await readRedisStore();
    // Update existing profile by email or append new one
    const idx = existing.findIndex((p) => p.email && p.email === entry.email);
    if (idx !== -1) {
      existing[idx] = {
        ...existing[idx],
        ...entry,
        loginCount: (existing[idx].loginCount || 1) + 1,
      };
    } else {
      entry.loginCount = 1;
      entry.createdAt = entry.loginAt;
      existing.push(entry);
    }
    await writeRedisStore(existing);
  } else {
    const existing = readFileStore();
    const idx = existing.findIndex((p) => p.email && p.email === entry.email);
    if (idx !== -1) {
      existing[idx] = {
        ...existing[idx],
        ...entry,
        loginCount: (existing[idx].loginCount || 1) + 1,
      };
    } else {
      entry.loginCount = 1;
      entry.createdAt = entry.loginAt;
      existing.push(entry);
    }
    writeFileStore(existing);
  }
}

async function getProfiles(limit) {
  const data = redis ? await readRedisStore() : readFileStore();
  const sorted = data.slice().sort((a, b) => {
    return new Date(b.loginAt || 0) - new Date(a.loginAt || 0);
  });
  if (typeof limit === "number" && limit > 0) {
    return sorted.slice(0, limit);
  }
  return sorted;
}

module.exports = { appendProfile, getProfiles };
