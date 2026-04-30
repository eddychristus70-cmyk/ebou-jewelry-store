const fs = require("fs");
const path = require("path");

const PRODUCTS_FILE = path.join(__dirname, "..", "products.json");
const REDIS_KEY = "products";

let redis = null;
try {
  const { Redis } = require("@upstash/redis");
  const url =
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) redis = new Redis({ url, token });
} catch (e) {}

function readProductsFile() {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

async function getProducts() {
  if (redis) {
    try {
      const data = await redis.get(REDIS_KEY);
      if (data) {
        const list = Array.isArray(data)
          ? data
          : typeof data === "string"
          ? JSON.parse(data)
          : [];
        if (list.length > 0) return list;
      }
      // Redis empty — seed from products.json
      const seeded = readProductsFile();
      if (seeded.length > 0) {
        await redis.set(REDIS_KEY, JSON.stringify(seeded));
      }
      return seeded;
    } catch (e) {
      console.warn("product-store redis read error", e);
      return readProductsFile();
    }
  }
  return readProductsFile();
}

async function saveProducts(products) {
  if (redis) {
    await redis.set(REDIS_KEY, JSON.stringify(products));
  }
}

function generateId(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

async function addProduct(product) {
  const products = await getProducts();
  if (!product.id) product.id = generateId(product.title || "product");
  product.createdAt = new Date().toISOString();
  products.push(product);
  await saveProducts(products);
  return product;
}

async function updateProduct(id, updates) {
  const products = await getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveProducts(products);
  return products[idx];
}

async function deleteProduct(id) {
  const products = await getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products.splice(idx, 1);
  await saveProducts(products);
  return true;
}

module.exports = { getProducts, addProduct, updateProduct, deleteProduct };
