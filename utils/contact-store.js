const fs = require("fs");
const path = require("path");

const CONTACTS_FILE = path.join(__dirname, "..", "contacts.json");

function readStore() {
  try {
    if (!fs.existsSync(CONTACTS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(CONTACTS_FILE, "utf8");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("contact-store read error", err);
    return [];
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("contact-store write error", err);
  }
}

function appendMessage(message) {
  if (!message || typeof message !== "object") return;
  const existing = readStore();
  existing.push({
    ...message,
    createdAt: message.createdAt || new Date().toISOString(),
  });
  writeStore(existing);
}

function getMessages(limit) {
  const data = readStore();
  const sorted = data.slice().sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
  if (typeof limit === "number" && limit > 0) {
    return sorted.slice(0, limit);
  }
  return sorted;
}

module.exports = { appendMessage, getMessages };
