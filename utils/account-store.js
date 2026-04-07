const fs = require("fs");
const path = require("path");

const ACCOUNTS_FILE = path.join(__dirname, "..", "accounts.json");
const REDIS_KEY = "customer-accounts";

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
  // Upstash Redis not available
}

// --- File-based fallback (local dev) ---
function readFileStore() {
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) return [];
    const raw = fs.readFileSync(ACCOUNTS_FILE, "utf8");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("account-store file read error", err);
    return [];
  }
}

function writeFileStore(data) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("account-store file write error", err);
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
    console.warn("account-store redis read error", err);
    return [];
  }
}

async function writeRedisStore(data) {
  try {
    await redis.set(REDIS_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("account-store redis write error", err);
  }
}

// --- Public API ---
async function findAccount(email) {
  if (!email) return null;
  const accounts = redis ? await readRedisStore() : readFileStore();
  return accounts.find((a) => a.email === email.toLowerCase()) || null;
}

async function createAccount(account) {
  if (!account || !account.email || !account.hash) return false;
  const accounts = redis ? await readRedisStore() : readFileStore();
  const exists = accounts.find((a) => a.email === account.email.toLowerCase());
  if (exists) return false;

  accounts.push({
    email: account.email.toLowerCase(),
    hash: account.hash,
    createdAt: account.createdAt || new Date().toISOString(),
    profile: account.profile || {},
  });

  if (redis) {
    await writeRedisStore(accounts);
  } else {
    writeFileStore(accounts);
  }
  return true;
}

async function updateAccountProfile(email, profile) {
  if (!email) return false;
  const accounts = redis ? await readRedisStore() : readFileStore();
  const idx = accounts.findIndex((a) => a.email === email.toLowerCase());
  if (idx === -1) return false;

  accounts[idx].profile = { ...accounts[idx].profile, ...profile };
  accounts[idx].lastLoginAt = new Date().toISOString();

  if (redis) {
    await writeRedisStore(accounts);
  } else {
    writeFileStore(accounts);
  }
  return true;
}

async function createOrUpdateGoogleAccount(email, profile) {
  if (!email) return false;
  const accounts = redis ? await readRedisStore() : readFileStore();
  const idx = accounts.findIndex((a) => a.email === email.toLowerCase());

  if (idx === -1) {
    accounts.push({
      email: email.toLowerCase(),
      hash: null,
      isGoogleUser: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      profile: profile || {},
    });
  } else {
    accounts[idx].lastLoginAt = new Date().toISOString();
    accounts[idx].isGoogleUser = true;
    if (profile) {
      accounts[idx].profile = { ...accounts[idx].profile, ...profile };
    }
  }

  if (redis) {
    await writeRedisStore(accounts);
  } else {
    writeFileStore(accounts);
  }
  return true;
}

// File-based fallback for reset codes (local dev only)
const resetCodesMap = new Map();

async function updatePassword(email, newHash) {
  if (!email || !newHash) return false;
  const accounts = redis ? await readRedisStore() : readFileStore();
  const idx = accounts.findIndex((a) => a.email === email.toLowerCase());
  if (idx === -1) return false;

  accounts[idx].hash = newHash;
  accounts[idx].passwordChangedAt = new Date().toISOString();

  if (redis) {
    await writeRedisStore(accounts);
  } else {
    writeFileStore(accounts);
  }
  return true;
}

async function storeResetCode(email, code) {
  const key = "reset-code:" + email.toLowerCase();
  const value = JSON.stringify({
    code,
    email: email.toLowerCase(),
    createdAt: new Date().toISOString(),
  });

  if (redis) {
    try {
      await redis.set(key, value, { ex: 900 });
      return true;
    } catch (err) {
      console.warn("storeResetCode redis error", err);
      return false;
    }
  }

  // File fallback: in-memory with 15-min timeout
  resetCodesMap.set(key, { code, email: email.toLowerCase() });
  setTimeout(() => resetCodesMap.delete(key), 900000);
  return true;
}

async function verifyResetCode(email, code) {
  const key = "reset-code:" + email.toLowerCase();

  if (redis) {
    try {
      const raw = await redis.get(key);
      if (!raw) return false;
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (data.code === code) {
        await redis.del(key);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("verifyResetCode redis error", err);
      return false;
    }
  }

  // File fallback
  const entry = resetCodesMap.get(key);
  if (entry && entry.code === code) {
    resetCodesMap.delete(key);
    return true;
  }
  return false;
}

module.exports = {
  findAccount,
  createAccount,
  updateAccountProfile,
  createOrUpdateGoogleAccount,
  updatePassword,
  storeResetCode,
  verifyResetCode,
};
