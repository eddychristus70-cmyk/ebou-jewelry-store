const contactStore = require("../utils/contact-store");

// Optional email notifications (requires SENDGRID_API_KEY env var)
let sendgrid = null;
try {
  sendgrid = require("@sendgrid/mail");
} catch (e) {
  console.log("SendGrid not available - email notifications disabled");
}

// Optional SMS notifications (requires TWILIO env vars)
let Twilio = null;
try {
  Twilio = require("twilio");
} catch (e) {
  console.log("Twilio not available - SMS notifications disabled");
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sendEmailNotification(message) {
  if (!sendgrid) {
    console.log("Email notification skipped - SendGrid not available");
    return;
  }

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
  if (!Twilio) {
    console.log("SMS notification skipped - Twilio not available");
    return;
  }

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

function normalizeBody(body, rawBody) {
  if (!body || typeof body === "string") {
    try {
      return JSON.parse(body || rawBody || "{}");
    } catch (err) {
      return {};
    }
  }
  return body;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const payload = normalizeBody(req.body, req.rawBody);
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const message = String(payload.message || "").trim();
  const phone = String(payload.phone || "").trim();
  const topic = String(payload.topic || "General").trim();

  if (!name || !email || !message) {
    res.status(400).json({
      error: "Missing required fields (name, email, message)",
    });
    return;
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
      userAgent: req.headers["user-agent"] || "",
      referer: req.headers.referer || req.headers.referrer || "",
    },
  };

  try {
    contactStore.appendMessage(entry);
  } catch (err) {
    console.error("contact message save error", err);
    res.status(500).json({ error: "Unable to save contact message" });
    return;
  }

  try {
    await notifyChannels(entry);
  } catch (err) {
    console.warn("contact notifications failed", err);
  }

  res.status(200).json({ success: true });
};
