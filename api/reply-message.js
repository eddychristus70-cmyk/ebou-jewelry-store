const contactStore = require("../utils/contact-store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || req.rawBody || "{}");
    } catch (e) {
      body = {};
    }
  }

  const messageKey = String(body.messageKey || "").trim();
  const message = String(body.message || "").trim();
  const sender = body.sender === "customer" ? "customer" : "admin";

  if (!messageKey || !message) {
    res.status(400).json({ error: "Missing messageKey or message" });
    return;
  }

  try {
    const found = await contactStore.addReply(messageKey, {
      sender,
      message,
      date: new Date().toISOString(),
    });

    if (!found) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("reply-message error", err);
    res.status(500).json({ error: "Failed to save reply" });
  }
};
