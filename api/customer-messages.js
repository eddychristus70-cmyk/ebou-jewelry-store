// Vercel serverless: /api/customer-messages
// GET ?email=customer@email.com — returns messages for that customer only
const contactStore = require("../utils/contact-store");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const email = (req.query?.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "email param required" });

  try {
    const messages = await contactStore.getMessagesByEmail(email);
    return res.status(200).json({ count: messages.length, messages });
  } catch (err) {
    console.error("customer-messages error", err);
    return res.status(500).json({ error: "Failed to load messages" });
  }
};
