// Serverless function for Vercel /api/send-order
// Expects a POST with JSON: { orderId, customer: { name, email, phone, addr1, addr2, city, zip, country }, items: [{title, qty, price}], subtotal, total }
// Uses environment variables:
// SENDGRID_API_KEY, SENDGRID_FROM, SENDGRID_TO (comma separated allowed)
// TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM

const sendgrid = require("@sendgrid/mail");
const Twilio = require("twilio");
const orderStore = require("../utils/order-store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (!body || Object.keys(body).length === 0) {
    // Vercel may not parse JSON automatically in some runtimes; try to parse raw body
    try {
      body = JSON.parse(req.rawBody || req.body || "{}");
    } catch (e) {
      // ignore
    }
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
    res.status(400).json({
      error: "Missing required order fields (orderId, customer.email)",
    });
    return;
  }

  // SendGrid email
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
    // if it's a plain number like "12.34" add symbol
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
      // don't fail immediately; we'll still try SMS below and return partial status
    }
  }

  // Twilio SMS
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
      const t = ensureCedi(total);
      const msg = `Thanks ${
        customer.name || ""
      }! Order ${orderId} received. Total: ${t}${
        paymentRef ? ` (Ref: ${paymentRef})` : ""
      }`;
      await tw.messages.create({
        from: TWILIO_FROM,
        to: customer.phone,
        body: msg,
      });
    } catch (err) {
      console.error("Twilio send error:", err);
      // ignore and continue
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
    console.warn("order persistence step failed", e);
  }

  // Return success (we treat email/SMS as best-effort and don't block on them)
  res.status(200).json({ ok: true, orderId });
};
