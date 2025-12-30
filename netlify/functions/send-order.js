// Netlify function: netlify/functions/send-order.js
// Same behavior as the Vercel /api/send-order endpoint: sends email (SendGrid), SMS (Twilio)
// and optionally persists orders to orders.json when PERSIST_ORDERS=local.

const sendgrid = require("@sendgrid/mail");
const Twilio = require("twilio");
const orderStore = require("../../utils/order-store");

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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    console.warn("Could not parse body", e);
    body = {};
  }

  const {
    orderId,
    customer = {},
    items = [],
    subtotal = "",
    total = "",
    paymentRef = "",
  } = body;

  if (!orderId || !customer || !customer.email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Missing required order fields (orderId, customer.email)",
      }),
    };
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
  const SENDGRID_FROM = process.env.SENDGRID_FROM || "no-reply@example.com";
  const SENDGRID_TO = (process.env.SENDGRID_TO || customer.email)
    .split(",")
    .map((s) => s.trim());

  function ensureCedi(v) {
    if (v === undefined || v === null) return "";
    if (typeof v === "number") return "₵" + v.toFixed(2);
    const s = String(v).trim();
    if (s.startsWith("₵")) return s;
    if (s.startsWith("$")) return s.replace(/^\$\s?/, "₵");
    if (/^[0-9]/.test(s)) {
      const n = parseFloat(s.replace(/[^0-9.\-]/g, "") || "0");
      return "₵" + n.toFixed(2);
    }
    return s;
  }

  if (SENDGRID_API_KEY) {
    sendgrid.setApiKey(SENDGRID_API_KEY);
    const itemsHtml = items
      .map((i) => {
        const price =
          i && i.price ? String(i.price).replace(/^\$\s?/, "₵") : "";
        return `<li>${i.qty} x ${i.title} — ${price}</li>`;
      })
      .join("");
    const html = `
      <p>Hi ${customer.name || "customer"},</p>
      <p>Thanks for your order. Your order number is <strong>${orderId}</strong>.</p>
      ${
        paymentRef
          ? `<p>Payment reference: <strong>${paymentRef}</strong></p>`
          : ""
      }
      <p><strong>Shipping address</strong>: ${customer.addr1 || ""} ${
      customer.addr2 || ""
    }, ${customer.city || ""} ${customer.zip || ""}, ${
      customer.country || ""
    }</p>
      <p><strong>Items</strong></p><ul>${itemsHtml}</ul>
      <p>Subtotal: ${ensureCedi(subtotal)} — Total: ${ensureCedi(total)}</p>
      <p>Regards,<br/>Ebou Jewelry</p>
    `;
    try {
      await sendgrid.send({
        to: SENDGRID_TO,
        from: SENDGRID_FROM,
        subject: `Order confirmation — ${orderId}`,
        text: `Order ${orderId} confirmed. Items: ${items
          .map((i) => `${i.qty} x ${i.title}`)
          .join(", ")}`,
        html: html,
      });
    } catch (err) {
      console.error("SendGrid send error:", err);
    }
  }

  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
  const TWILIO_FROM = process.env.TWILIO_FROM || "";

  if (
    TWILIO_ACCOUNT_SID &&
    TWILIO_AUTH_TOKEN &&
    TWILIO_FROM &&
    customer.phone
  ) {
    try {
      const tw = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const msg = `Thanks ${
        customer.name || ""
      }! Order ${orderId} received. Total: ${total}`;
      await tw.messages.create({
        from: TWILIO_FROM,
        to: customer.phone,
        body: msg,
      });
    } catch (err) {
      console.error("Twilio send error:", err);
    }
  }

  const deliveryFee = body.deliveryFee ?? body.delivery ?? "";
  try {
    orderStore.appendOrder({
      orderId,
      customer,
      items,
      subtotal,
      total,
      deliveryFee,
      paymentRef,
      status: body.status || "processing",
      source: "send-order",
      createdAt: body.createdAt || new Date().toISOString(),
    });
  } catch (e) {
    console.warn("Failed to persist order locally", e);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, orderId }),
  };
};
