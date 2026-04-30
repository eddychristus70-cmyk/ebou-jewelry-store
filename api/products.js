// Vercel serverless: /api/products
// GET  — returns all products
// POST — add a new product (admin)
// PUT  — update product by id (admin)
// DELETE — delete product by id (admin)
const productStore = require("../utils/product-store");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET — public
  if (req.method === "GET") {
    try {
      const products = await productStore.getProducts();
      return res.status(200).json(products);
    } catch (err) {
      console.error("products GET error", err);
      return res.status(500).json({ error: "Failed to load products" });
    }
  }

  // Parse body for mutations
  let body = req.body || {};
  try {
    if (!Object.keys(body).length && req.rawBody) body = JSON.parse(req.rawBody);
  } catch (e) {}

  // POST — add product
  if (req.method === "POST") {
    const { title, price, originalPrice, discount, img, description, category, stock } = body;
    if (!title || !price) return res.status(400).json({ error: "title and price are required" });

    try {
      const product = await productStore.addProduct({
        title,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
        discount: discount ? parseInt(discount) : 0,
        img: img || "",
        description: description || "",
        category: category || "Other",
        stock: stock !== undefined ? parseInt(stock) : null,
        reviews: [],
      });
      return res.status(201).json({ ok: true, product });
    } catch (err) {
      console.error("products POST error", err);
      return res.status(500).json({ error: "Failed to add product" });
    }
  }

  // PUT — update product
  if (req.method === "PUT") {
    const { id, ...updates } = body;
    if (!id) return res.status(400).json({ error: "id is required" });
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.originalPrice) updates.originalPrice = parseFloat(updates.originalPrice);
    if (updates.discount) updates.discount = parseInt(updates.discount);

    try {
      const updated = await productStore.updateProduct(id, updates);
      if (!updated) return res.status(404).json({ error: "Product not found" });
      return res.status(200).json({ ok: true, product: updated });
    } catch (err) {
      console.error("products PUT error", err);
      return res.status(500).json({ error: "Failed to update product" });
    }
  }

  // DELETE — delete product
  if (req.method === "DELETE") {
    const { id } = body;
    if (!id) return res.status(400).json({ error: "id is required" });

    try {
      const deleted = await productStore.deleteProduct(id);
      if (!deleted) return res.status(404).json({ error: "Product not found" });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("products DELETE error", err);
      return res.status(500).json({ error: "Failed to delete product" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
