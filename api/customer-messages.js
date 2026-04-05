const contactStore = require("../utils/contact-store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const email = (req.query?.email || "").trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Missing email parameter" });
    return;
  }

  try {
    const messages = await contactStore.getMessagesByEmail(email);
    res.status(200).json({ count: messages.length, messages });
  } catch (err) {
    console.error("customer-messages error", err);
    res.status(500).json({ error: "Failed to get messages" });
  }
};
