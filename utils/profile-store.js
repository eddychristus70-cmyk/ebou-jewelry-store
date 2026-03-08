const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize profiles file if it doesn't exist
if (!fs.existsSync(PROFILES_FILE)) {
  fs.writeFileSync(PROFILES_FILE, "[]", "utf8");
}

function readProfiles() {
  try {
    const data = fs.readFileSync(PROFILES_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading profiles:", err);
    return [];
  }
}

function writeProfiles(profiles) {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing profiles:", err);
    return false;
  }
}

function appendProfile(profile) {
  const profiles = readProfiles();
  
  // Check if profile with this email already exists
  const existingIndex = profiles.findIndex(
    (p) => p.email.toLowerCase() === profile.email.toLowerCase()
  );
  
  if (existingIndex !== -1) {
    // Update existing profile
    profiles[existingIndex] = {
      ...profiles[existingIndex],
      ...profile,
      updatedAt: new Date().toISOString(),
      loginCount: (profiles[existingIndex].loginCount || 0) + 1,
    };
  } else {
    // Add new profile
    const newProfile = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      ...profile,
      createdAt: new Date().toISOString(),
      loginCount: 1,
    };
    profiles.unshift(newProfile);
  }
  
  writeProfiles(profiles);
  return profile;
}

function getProfile(email) {
  const profiles = readProfiles();
  return profiles.find(
    (p) => p.email.toLowerCase() === email.toLowerCase()
  ) || null;
}

function getProfileById(id) {
  const profiles = readProfiles();
  return profiles.find((p) => p.id === id) || null;
}

function updateProfile(email, updates) {
  const profiles = readProfiles();
  const index = profiles.findIndex(
    (p) => p.email.toLowerCase() === email.toLowerCase()
  );
  if (index === -1) return null;
  
  profiles[index] = {
    ...profiles[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeProfiles(profiles);
  return profiles[index];
}

function deleteProfile(email) {
  const profiles = readProfiles();
  const index = profiles.findIndex(
    (p) => p.email.toLowerCase() === email.toLowerCase()
  );
  if (index === -1) return false;
  
  profiles.splice(index, 1);
  writeProfiles(profiles);
  return true;
}

function getAllProfiles(options = {}) {
  let profiles = readProfiles();
  
  // Search filter
  if (options.search) {
    const search = options.search.toLowerCase();
    profiles = profiles.filter(
      (p) =>
        p.email.toLowerCase().includes(search) ||
        (p.name && p.name.toLowerCase().includes(search))
    );
  }
  
  // Pagination
  const page = options.page || 1;
  const limit = options.limit || 20;
  const start = (page - 1) * limit;
  
  return {
    profiles: profiles.slice(start, start + limit),
    total: profiles.length,
    page,
    totalPages: Math.ceil(profiles.length / limit),
  };
}

function getProfileCount() {
  return readProfiles().length;
}

module.exports = {
  readProfiles,
  writeProfiles,
  appendProfile,
  getProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  getAllProfiles,
  getProfileCount,
};
