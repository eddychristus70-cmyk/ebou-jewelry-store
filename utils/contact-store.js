const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize contacts file if it doesn't exist
if (!fs.existsSync(CONTACTS_FILE)) {
  fs.writeFileSync(CONTACTS_FILE, "[]", "utf8");
}

function readMessages() {
  try {
    const data = fs.readFileSync(CONTACTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading contacts:", err);
    return [];
  }
}

function writeMessages(messages) {
  try {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(messages, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing contacts:", err);
    return false;
  }
}

function appendMessage(message) {
  const messages = readMessages();
  const newMessage = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    ...message,
    read: false,
    replied: false,
  };
  messages.unshift(newMessage); // Add to beginning (newest first)
  writeMessages(messages);
  return newMessage;
}

function getMessage(id) {
  const messages = readMessages();
  return messages.find((m) => m.id === id) || null;
}

function updateMessage(id, updates) {
  const messages = readMessages();
  const index = messages.findIndex((m) => m.id === id);
  if (index === -1) return null;
  
  messages[index] = { ...messages[index], ...updates };
  writeMessages(messages);
  return messages[index];
}

function deleteMessage(id) {
  const messages = readMessages();
  const index = messages.findIndex((m) => m.id === id);
  if (index === -1) return false;
  
  messages.splice(index, 1);
  writeMessages(messages);
  return true;
}

function markAsRead(id) {
  return updateMessage(id, { read: true });
}

function markAsReplied(id) {
  return updateMessage(id, { replied: true, repliedAt: new Date().toISOString() });
}

function getUnreadCount() {
  const messages = readMessages();
  return messages.filter((m) => !m.read).length;
}

function getAllMessages(options = {}) {
  let messages = readMessages();
  
  // Filter by read status
  if (options.unreadOnly) {
    messages = messages.filter((m) => !m.read);
  }
  
  // Filter by topic
  if (options.topic) {
    messages = messages.filter((m) => m.topic === options.topic);
  }
  
  // Pagination
  const page = options.page || 1;
  const limit = options.limit || 20;
  const start = (page - 1) * limit;
  
  return {
    messages: messages.slice(start, start + limit),
    total: messages.length,
    page,
    totalPages: Math.ceil(messages.length / limit),
  };
}

module.exports = {
  readMessages,
  writeMessages,
  appendMessage,
  getMessage,
  updateMessage,
  deleteMessage,
  markAsRead,
  markAsReplied,
  getUnreadCount,
  getAllMessages,
};
