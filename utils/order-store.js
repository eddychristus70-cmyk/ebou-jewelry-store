const fs = require("fs");
const path = require("path");

const ORDER_FILE = path.join(__dirname, "..", "orders.json");
const REDIS_KEY = "orders";

// Try to use Upstash Redis (works on Vercel + any serverless platform)
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
  // Upstash Redis not available — fall back to file system
}

// --- File-based fallback (local dev) ---
function readFileStore() {
  try {
    if (!fs.existsSync(ORDER_FILE)) return [];
    const raw = fs.readFileSync(ORDER_FILE, "utf8");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("order-store file read error", err);
    return [];
  }
}

function writeFileStore(data) {
  try {
    fs.writeFileSync(ORDER_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("order-store file write error", err);
  }
}

// --- Redis-based store (Vercel production) ---
async function readRedisStore() {
  try {
    const data = await redis.get(REDIS_KEY);
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string") return JSON.parse(data);
    return [];
  } catch (err) {
    console.warn("order-store redis read error", err);
    return [];
  }
}

async function writeRedisStore(data) {
  try {
    await redis.set(REDIS_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("order-store redis write error", err);
  }
}

// --- Public API (async, works with both backends) ---
async function appendOrder(order) {
  if (!order || typeof order !== "object") return;
  const entry = {
    ...order,
    timestamp: order.timestamp || new Date().toISOString(),
    createdAt: order.createdAt || new Date().toISOString(),
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

async function getOrders() {
  const data = redis ? await readRedisStore() : readFileStore();
  return data.slice().sort((a, b) => {
    const aTime = new Date(a.createdAt || a.timestamp || 0).getTime();
    const bTime = new Date(b.createdAt || b.timestamp || 0).getTime();
    return bTime - aTime;
  });
}

async function updateOrderStatus(orderId, status, paymentData = {}) {
  if (!orderId || !status) return null;
  const data = redis ? await readRedisStore() : readFileStore();
  const orderIndex = data.findIndex((order) => order.orderId === orderId);

  if (orderIndex !== -1) {
    data[orderIndex] = {
      ...data[orderIndex],
      status: status,
      paymentStatus: status,
      paymentData: paymentData,
      updatedAt: new Date().toISOString(),
    };
    if (redis) {
      await writeRedisStore(data);
    } else {
      writeFileStore(data);
    }
    return data[orderIndex];
  }
  return null;
}

async function getOrderById(orderId) {
  const data = redis ? await readRedisStore() : readFileStore();
  return data.find((order) => order.orderId === orderId) || null;
}

module.exports = {
  readStore: getOrders,
  writeStore: writeRedisStore || writeFileStore,
  appendOrder,
  getOrders,
  updateOrderStatus,
  getOrderById,
};
