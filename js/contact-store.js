const fs = require("fs");
const path = require("path");

const CONTACTS_FILE = path.join(__dirname, "contacts.json");

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
    id: message.id || `MSG-VS${String(Date.now()).slice(-6)}`,
    createdAt: message.createdAt || new Date().toISOString(),
    status: message.status || "unread",
    replies: message.replies || [],
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

function getMessageById(id) {
  const data = readStore();
  return data.find((msg) => msg.id === id) || null;
}

function updateMessageStatus(id, status) {
  if (!id || !status) return;
  const data = readStore();
  const msgIndex = data.findIndex((msg) => msg.id === id);

  if (msgIndex !== -1) {
    data[msgIndex].status = status;
    writeStore(data);
    return data[msgIndex];
  }
  return null;
}

function addReply(messageId, reply) {
  const data = readStore();
  const msgIndex = data.findIndex((msg) => msg.id === messageId);

  if (msgIndex !== -1) {
    if (!data[msgIndex].replies) {
      data[msgIndex].replies = [];
    }
    data[msgIndex].replies.push({
      ...reply,
      id: reply.id || `REP-${String(Date.now()).slice(-6)}`,
      timestamp: reply.timestamp || new Date().toISOString(),
    });
    data[msgIndex].status = "replied";
    writeStore(data);
    return data[msgIndex];
  }
  return null;
}

function deleteMessage(id) {
  const data = readStore();
  const filtered = data.filter((msg) => msg.id !== id);
  writeStore(filtered);
  return filtered.length < data.length;
}

module.exports = {
  appendMessage,
  getMessages,
  getMessageById,
  updateMessageStatus,
  addReply,
  deleteMessage,
  readStore,
  writeStore,
};
