const contactStore = require("../../utils/contact-store");
const sendgrid = require("@sendgrid/mail");
const Twilio = require("twilio");

const defaultHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sendEmailNotification(message) {
  const apiKey =
    process.env.CONTACT_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY || "";
  const from =
    process.env.CONTACT_SENDGRID_FROM ||
    process.env.SENDGRID_FROM ||
    "no-reply@example.com";
  const recipients = parseList(
    process.env.CONTACT_NOTIFY_EMAILS ||
      process.env.SENDGRID_TO ||
      process.env.SENDGRID_FROM ||
      ""
  );
  if (!apiKey || !from || recipients.length === 0) return;

  const subject = `New contact message from ${message.name}`;
  const plain =
    `${message.name} (${message.email})\n` +
    (message.phone ? `Phone: ${message.phone}\n` : "") +
    `Topic: ${message.topic}\n` +
    `Message: ${message.message}\n` +
    `Received: ${message.createdAt}`;
  const html = `
    <p>You have a new contact form submission.</p>
    <p><strong>Name:</strong> ${message.name}</p>
    <p><strong>Email:</strong> ${message.email}</p>
    <p><strong>Phone:</strong> ${message.phone || "—"}</p>
    <p><strong>Topic:</strong> ${message.topic}</p>
    <p><strong>Message:</strong></p>
    <div style="padding:12px;border-left:4px solid #e50f65;background:#fff7fb;">${message.message
      .split("\n")
      .map((line) => line || "&nbsp;")
      .join("<br/>")}</div>
    <p style="font-size:12px;color:#666;margin-top:12px;">Received: ${
      message.createdAt
    }</p>
  `;

  try {
    sendgrid.setApiKey(apiKey);
    await sendgrid.send({ to: recipients, from, subject, text: plain, html });
  } catch (err) {
    console.warn("contact email notify failed", err);
  }
}

async function sendSmsNotification(message) {
  const sid = process.env.TWILIO_ACCOUNT_SID || "";
  const token = process.env.TWILIO_AUTH_TOKEN || "";
  const from = process.env.TWILIO_FROM || "";
  const recipients = parseList(
    process.env.CONTACT_NOTIFY_PHONE || process.env.TWILIO_TO || ""
  );
  if (!sid || !token || !from || recipients.length === 0) return;

  const body =
    `Contact: ${message.name} (${message.topic}) ` +
    `${message.email}${message.phone ? `, ${message.phone}` : ""}`;

  try {
    const client = Twilio(sid, token);
    await Promise.all(
      recipients.map((to) =>
        client.messages.create({ from, to, body }).catch((err) => {
          console.warn("contact sms notify failed", err.message || err);
        })
      )
    );
  } catch (err) {
    console.warn("contact sms client error", err);
  }
}

async function notifyChannels(message) {
  await Promise.allSettled([
    sendEmailNotification(message),
    sendSmsNotification(message),
  ]);
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: defaultHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return {
      statusCode: 400,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const message = String(payload.message || "").trim();
  const phone = String(payload.phone || "").trim();
  const topic = String(payload.topic || "General").trim();

  if (!name || !email || !message) {
    return {
      statusCode: 400,
      headers: defaultHeaders,
      body: JSON.stringify({
        error: "Missing required fields (name, email, message)",
      }),
    };
  }

  const entry = {
    name,
    email,
    phone,
    topic,
    message,
    source: payload.source || "contact-form",
    createdAt: new Date().toISOString(),
    meta: {
      userAgent: event.headers["user-agent"] || "",
      referer: event.headers.referer || event.headers.referrer || "",
    },
  };

  try {
    contactStore.appendMessage(entry);
  } catch (err) {
    console.error("contact message save error", err);
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Unable to save contact message" }),
    };
  }

  try {
    await notifyChannels(entry);
  } catch (err) {
    console.warn("contact notifications failed", err);
  }

  return {
    statusCode: 200,
    headers: defaultHeaders,
    body: JSON.stringify({ success: true }),
  };
};
