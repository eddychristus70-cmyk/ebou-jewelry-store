const fs = require("fs");
const path = require("path");

const PROFILE_FILE = path.join(__dirname, "..", "data", "profiles.json");

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

function getProfileByEmail(email) {
  const data = readStore();
  return data.find((profile) => profile.email === email) || null;
}

function updateProfile(email, updates) {
  if (!email || !updates) return null;
  const data = readStore();
  const profileIndex = data.findIndex((profile) => profile.email === email);

  if (profileIndex !== -1) {
    data[profileIndex] = {
      ...data[profileIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeStore(data);
    return data[profileIndex];
  }
  return null;
}

function getAllProfiles() {
  return readStore();
}

function deleteProfile(email) {
  const data = readStore();
  const filtered = data.filter((profile) => profile.email !== email);
  writeStore(filtered);
  return filtered.length < data.length;
}

module.exports = {
  appendProfile,
  getProfileByEmail,
  updateProfile,
  getAllProfiles,
  deleteProfile,
  readStore,
  writeStore,
};
