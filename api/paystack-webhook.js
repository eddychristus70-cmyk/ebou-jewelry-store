// Vercel serverless: /api/paystack-webhook
// Paystack sends webhook POSTs with header 'x-paystack-signature' (HMAC SHA512 of raw body using secret key)
const fetch = global.fetch || require("node-fetch");
const sendgrid = require("@sendgrid/mail");
const Twilio = require("twilio");
const crypto = require("crypto");
const orderStore = require("../utils/order-store");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
  if (!PAYSTACK_SECRET)
    return res.status(500).send("PAYSTACK_SECRET_KEY not configured");

  // Raw body is required to verify signature
  const raw = req.rawBody || JSON.stringify(req.body || {});
  const signature = (req.headers["x-paystack-signature"] || "").toString();
  const expected = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(raw)
    .digest("hex");
  if (!signature || signature !== expected) {
    console.warn("Invalid webhook signature", { signature, expected });
    return res.status(400).send("Invalid signature");
  }

  let payload = req.body;
  try {
    if (!payload || Object.keys(payload).length === 0)
      payload = JSON.parse(raw);
  } catch (e) {
    payload = req.body || {};
  }

  const event = payload.event || "";
  const data = payload.data || {};
  const reference = (
    data.reference ||
    (data.customer && data.customer.reference) ||
    ""
  ).toString();

  // Only handle successful charge/transaction events
  if (
    !reference ||
    !/charge\.success|transaction\.success|payment\.complete|charge.success/i.test(
      event
    )
  ) {
    // Not an event we care about; respond 200 to acknowledge
    return res.status(200).send("ignored");
  }

  try {
    // Verify with Paystack's verify endpoint (defensive)
    const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(
      reference
    )}`;
    const resp = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const verified = await resp.json();
    if (
      !verified ||
      !verified.status ||
      !verified.data ||
      verified.data.status !== "success"
    ) {
      console.warn("Webhook: verification failed", { reference, verified });
      return res.status(400).send("verification failed");
    }

    // Extract order metadata if present
    const meta = verified.data.metadata || {};
    const orderId = meta.orderId || meta.reference || "ORD-" + Date.now();
    const customer = {
      name:
        meta.customerName ||
        (verified.data.customer && verified.data.customer.first_name) ||
        "",
      email: (verified.data.customer && verified.data.customer.email) || "",
      phone: (verified.data.customer && verified.data.customer.phone) || "",
    };
    const items = meta.items || [];
    const subtotal = meta.subtotal || "";
    const deliveryFee = meta.deliveryFee || meta.delivery || "";
    const total = (Number(verified.data.amount || 0) / 100).toFixed(2);

    // helper for cedi formatting
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

    // Send notifications (SendGrid)
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
    const SENDGRID_FROM = process.env.SENDGRID_FROM || "no-reply@example.com";
    const SENDGRID_TO = (process.env.SENDGRID_TO || customer.email || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (SENDGRID_API_KEY && SENDGRID_TO.length) {
      try {
        sendgrid.setApiKey(SENDGRID_API_KEY);
        const itemsHtml = (items || [])
          .map(
            (i) =>
              `<li>${i.qty || 1} x ${i.title || i.name || ""} — ${
                i.price || ""
              }</li>`
          )
          .join("");
        const html = `<p>Hi ${
          customer.name || "customer"
        },</p><p>Your payment was successful. Reference: <strong>${reference}</strong></p><p>Order: <strong>${orderId}</strong></p><ul>${itemsHtml}</ul><p>Total: ${ensureCedi(
          total
        )}</p>`;
        await sendgrid.send({
          to: SENDGRID_TO,
          from: SENDGRID_FROM,
          subject: `Payment received — ${orderId}`,
          text: `Order ${orderId} confirmed. Ref: ${reference}`,
          html,
        });
      } catch (e) {
        console.error("Webhook SendGrid error", e);
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
        const msg = `Thanks ${
          customer.name || ""
        }! Payment received for Order ${orderId}. Total: ${ensureCedi(
          total
        )} (Ref: ${reference})`;
        await tw.messages.create({
          from: TWILIO_FROM,
          to: customer.phone,
          body: msg,
        });
      } catch (e) {
        console.error("Webhook Twilio error", e);
      }
    }

    // Persist locally
    try {
      orderStore.appendOrder({
        orderId,
        customer,
        items,
        subtotal,
        total,
        deliveryFee,
        paymentRef: reference,
        paymentChannel: verified.data && verified.data.channel,
        status: "paid",
        source: "paystack-webhook",
        createdAt: meta.createdAt || new Date().toISOString(),
        raw: {
          webhookEvent: eventName,
          paystackId: verified.data && verified.data.id,
        },
      });
    } catch (e) {
      console.warn("Webhook persist failed", e);
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook handler error", err);
    return res.status(500).send("internal error");
  }
};
