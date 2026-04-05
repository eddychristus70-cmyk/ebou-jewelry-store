const contactStore = require("../utils/contact-store");

function isAuthorized(req) {
  const adminToken = process.env.CONTACT_ADMIN_TOKEN;
  if (!adminToken) return true;
  const headerToken = req.headers["x-admin-token"];
  return headerToken === adminToken;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // If email param is provided, filter messages for that customer
  const emailFilter = (req.query?.email || "").trim().toLowerCase();
  if (emailFilter) {
    const messages = await contactStore.getMessagesByEmail(emailFilter);
    res.status(200).json({ count: messages.length, messages });
    return;
  }

  const limit = Number.parseInt(req.query?.limit, 10);
  const messages = await contactStore.getMessages(
    Number.isNaN(limit) ? undefined : limit
  );

  res.status(200).json({
    count: messages.length,
    messages,
  });
};
