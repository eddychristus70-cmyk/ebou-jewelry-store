// Netlify function: netlify/functions/verify-payment.js
// POST { reference, order: { orderId, customer, items, subtotal, total } }
const sendgrid = require("@sendgrid/mail");
const Twilio = require("twilio");
const fetch = global.fetch || require("node-fetch");
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
    body = {};
  }
  const reference = (body.reference || body.ref || "").toString();
  const order = body.order || {};
  const {
    orderId,
    customer = {},
    items = [],
    subtotal = "",
    total = "",
  } = order;
  if (!reference)
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing payment reference" }),
    };
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
  if (!PAYSTACK_SECRET)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "PAYSTACK_SECRET_KEY not configured on server",
      }),
    };
  try {
    const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(
      reference
    )}`;
    const resp = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await resp.json();
    if (!data || !data.status)
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Unexpected paystack response",
          raw: data,
        }),
      };
    if (!data.data || data.data.status !== "success")
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          ok: false,
          verified: false,
          reason: data.data ? data.data.gateway_response : "not successful",
          raw: data,
        }),
      };

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

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
    const SENDGRID_FROM = process.env.SENDGRID_FROM || "no-reply@example.com";
    const SENDGRID_TO = (process.env.SENDGRID_TO || customer.email)
      .split(",")
      .map((s) => s.trim());
    if (SENDGRID_API_KEY) {
      sendgrid.setApiKey(SENDGRID_API_KEY);
      const itemsHtml = (items || [])
        .map((i) => `<li>${i.qty} x ${i.title} — ${i.price || ""}</li>`)
        .join("");
      const html = `
        <p>Hi ${customer.name || "customer"},</p>
        <p>Your payment was successful. Reference: <strong>${reference}</strong></p>
        <p>Order number: <strong>${orderId}</strong></p>
        <p><strong>Items</strong></p><ul>${itemsHtml}</ul>
        <p>Subtotal: ${ensureCedi(subtotal)} — Total: ${ensureCedi(total)}</p>
        <p>Regards,<br/>Ebou Jewelry</p>
      `;
      try {
        await sendgrid.send({
          to: SENDGRID_TO,
          from: SENDGRID_FROM,
          subject: `Payment received — ${orderId}`,
          text: `Order ${orderId} confirmed. Ref: ${reference}`,
          html,
        });
      } catch (e) {
        console.error("SendGrid send error in verify-payment", e);
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
        const t = ensureCedi(total);
        const msg = `Thanks ${
          customer.name || ""
        }! Payment received for Order ${orderId}. Total: ${t} (Ref: ${reference})`;
        await tw.messages.create({
          from: TWILIO_FROM,
          to: customer.phone,
          body: msg,
        });
      } catch (e) {
        console.error("Twilio error in verify-payment", e);
      }
    }

    const deliveryFee = order.deliveryFee ?? order.delivery ?? "";
    const paymentChannel =
      (data.data && data.data.channel) || order.paymentChannel || "";
    try {
      orderStore.appendOrder({
        orderId,
        customer,
        items,
        subtotal,
        total,
        deliveryFee,
        paymentRef: reference,
        paymentChannel,
        status: "paid",
        source: "verify-payment",
        createdAt: order.createdAt || new Date().toISOString(),
        raw: {
          paystack: {
            id: data.data && data.data.id,
            status: data.data && data.data.status,
            gateway_response: data.data && data.data.gateway_response,
          },
        },
      });
    } catch (e) {
      console.warn("Failed to persist order in verify-payment", e);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, verified: true, reference }),
    };
  } catch (err) {
    console.error("Error verifying paystack reference", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Verification failed",
        detail: String(err),
      }),
    };
  }
};
