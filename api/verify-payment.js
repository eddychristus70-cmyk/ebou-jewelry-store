// Vercel serverless: /api/verify-payment
// POST { reference, order: { orderId, customer, items, total } }
// Verifies a Paystack transaction by reference and saves the order.
const fetch = global.fetch || require("node-fetch");
const orderStore = require("../utils/order-store");

module.exports = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  let body = req.body || {};
  try {
    if (!Object.keys(body).length && req.rawBody)
      body = JSON.parse(req.rawBody);
  } catch (e) {}

  const { reference, order = {} } = body;

  if (!reference)
    return res.status(400).json({ error: "Missing payment reference" });

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
  if (!PAYSTACK_SECRET)
    return res
      .status(500)
      .json({ error: "PAYSTACK_SECRET_KEY not configured on server" });

  try {
    // Verify transaction with Paystack
    const resp = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      },
    );

    const data = await resp.json();

    if (!data || !data.status || !data.data) {
      return res
        .status(400)
        .json({ verified: false, error: "Verification failed", raw: data });
    }

    const txn = data.data;

    if (txn.status !== "success") {
      return res.status(400).json({
        verified: false,
        error: `Transaction status: ${txn.status}`,
      });
    }

    // Save order
    const orderId = order.orderId || txn.metadata?.orderId || reference;
    const orderData = {
      orderId: orderId,
      customerName: order.customer?.name || txn.metadata?.customerName || "",
      customerEmail: order.customer?.email || txn.customer?.email || "",
      customerPhone: order.customer?.phone || "",
      shippingAddress: order.customer
        ? `${order.customer.address || ""}, ${order.customer.city || ""}, ${order.customer.region || ""}`
        : "",
      items: order.items || [],
      subtotal: order.total || (txn.amount / 100).toFixed(2),
      total: order.total || (txn.amount / 100).toFixed(2),
      paymentRef: reference,
      paymentStatus: "success",
      status: "confirmed",
      paidAt: txn.paid_at || new Date().toISOString(),
    };

    orderStore.appendOrder(orderData);

    return res.status(200).json({
      verified: true,
      reference: reference,
      orderId: orderId,
      amount: txn.amount,
      currency: txn.currency,
    });
  } catch (err) {
    console.error("verify-payment error", err);
    return res
      .status(500)
      .json({
        verified: false,
        error: "Verification failed",
        detail: String(err),
      });
  }
};
