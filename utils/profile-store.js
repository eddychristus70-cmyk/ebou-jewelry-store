const fs = require("fs");
const path = require("path");

const PROFILE_FILE = path.join(__dirname, "..", "profiles.json");

function readStore() {
  try {
    if (!fs.existsSync(PROFILE_FILE)) return [];
    const raw = fs.readFileSync(PROFILE_FILE, "utf8");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("profile-store read error", err);
    return [];
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("profile-store write error", err);
  }
}

function appendProfile(profile) {
  if (!profile || typeof profile !== "object") return;
  const data = readStore();
  data.push({
    ...profile,
    loginAt: profile.loginAt || new Date().toISOString(),
  });
  writeStore(data);
}

module.exports = { appendProfile };
