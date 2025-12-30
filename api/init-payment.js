// Vercel serverless: /api/init-payment
// POST { orderId, customer: { name, email, phone }, total, paymentMethod }
// Initializes a Paystack transaction and returns Paystack initialization response to client.
const fetch = global.fetch || require("node-fetch");
module.exports = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  let body = req.body || {};
  try {
    if (!Object.keys(body).length && req.rawBody)
      body = JSON.parse(req.rawBody);
  } catch (e) {}
  const { orderId, customer = {}, total = "", paymentMethod = "card" } = body;
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
  if (!PAYSTACK_SECRET)
    return res
      .status(500)
      .json({ error: "PAYSTACK_SECRET_KEY not configured on server" });

  // parse total (allow "₵12.34" or "12.34")
  function parseAmount(s) {
    if (!s) return 0;
    const cleaned = String(s).replace(/[₵$,\s]/g, "");
    const n = parseFloat(cleaned) || 0;
    return Math.round(n * 100); // to kobo
  }

  const amount = parseAmount(total);
  if (!amount || amount <= 0)
    return res.status(400).json({ error: "Invalid amount" });

  const payload = {
    email: (customer.email || "").toString(),
    amount: amount,
    currency: "GHS",
    metadata: {
      orderId: orderId || "",
      customerName: customer.name || "",
    },
  };

  // channel hints
  if (paymentMethod === "momo") {
    payload.channels = ["mobile_money"];
    // include phone in mobile_money if available
    const phone = (customer.phone || "").toString();
    if (phone) payload.mobile_money = { phone };
  } else {
    payload.channels = ["card"];
  }

  try {
    const resp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!data)
      return res.status(502).json({ error: "Empty response from Paystack" });
    if (!data.status) return res.status(400).json({ ok: false, raw: data });
    // return useful fields to client
    return res.status(200).json({ ok: true, init: data });
  } catch (err) {
    console.error("init-payment error", err);
    return res
      .status(500)
      .json({ error: "Initialization failed", detail: String(err) });
  }
};
