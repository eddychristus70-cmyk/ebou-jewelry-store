// Netlify function: netlify/functions/init-payment.js
// POST { orderId, customer: { name, email, phone }, total, paymentMethod }
const fetch = global.fetch || require("node-fetch");

exports.handler = async function (event, context) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST")
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    body = {};
  }
  const { orderId, customer = {}, total = "", paymentMethod = "card" } = body;
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
  if (!PAYSTACK_SECRET)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "PAYSTACK_SECRET_KEY not configured on server",
      }),
    };

  function parseAmount(s) {
    if (!s) return 0;
    const cleaned = String(s).replace(/[₵$,\s]/g, "");
    const n = parseFloat(cleaned) || 0;
    return Math.round(n * 100);
  }

  const amount = parseAmount(total);
  if (!amount || amount <= 0)
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid amount" }),
    };

  const payload = {
    email: (customer.email || "").toString(),
    amount: amount,
    currency: "GHS",
    metadata: { orderId: orderId || "", customerName: customer.name || "" },
  };
  if (paymentMethod === "momo") {
    payload.channels = ["mobile_money"];
    const phone = (customer.phone || "").toString();
    if (phone) payload.mobile_money = { phone };
  } else payload.channels = ["card"];

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
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Empty response from Paystack" }),
      };
    if (!data.status)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, raw: data }),
      };
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, init: data }),
    };
  } catch (err) {
    console.error("init-payment error", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Initialization failed",
        detail: String(err),
      }),
    };
  }
};
