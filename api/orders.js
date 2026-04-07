// Vercel serverless: /api/orders
// GET — returns all orders from Redis/file store
// POST { orderId, status } — update order status
const orderStore = require("../utils/order-store");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      const orders = await orderStore.getOrders();
      return res.status(200).json({ orders });
    } catch (err) {
      console.error("orders GET error", err);
      return res.status(500).json({ error: "Failed to load orders" });
    }
  }

  if (req.method === "POST") {
    let body = req.body || {};
    try {
      if (!Object.keys(body).length && req.rawBody)
        body = JSON.parse(req.rawBody);
    } catch (e) {}

    const { orderId, status } = body;
    if (!orderId || !status)
      return res.status(400).json({ error: "Missing orderId or status" });

    try {
      const updated = await orderStore.updateOrderStatus(orderId, status);
      if (!updated)
        return res.status(404).json({ error: "Order not found" });
      return res.status(200).json({ ok: true, order: updated });
    } catch (err) {
      console.error("orders POST error", err);
      return res.status(500).json({ error: "Failed to update order" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
