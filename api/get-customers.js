const profileStore = require("../utils/profile-store");

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

  const limit = Number.parseInt(req.query?.limit, 10);
  const profiles = await profileStore.getProfiles(
    Number.isNaN(limit) ? undefined : limit,
  );

  res.status(200).json({
    count: profiles.length,
    profiles,
  });
};
