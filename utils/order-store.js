const fs = require("fs");
const path = require("path");

const ORDER_FILE = path.join(__dirname, "..", "orders.json");

function readStore() {
  try {
    if (!fs.existsSync(ORDER_FILE)) return [];
    const raw = fs.readFileSync(ORDER_FILE, "utf8");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("order-store read error", err);
    return [];
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(ORDER_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("order-store write error", err);
  }
}

function appendOrder(order) {
  if (!order || typeof order !== "object") return;
  const data = readStore();
  data.push({
    ...order,
    timestamp: new Date().toISOString(),
  });
  writeStore(data);
}

function updateOrderStatus(orderId, status, paymentData = {}) {
  if (!orderId || !status) return;
  const data = readStore();
  const orderIndex = data.findIndex((order) => order.orderId === orderId);

  if (orderIndex !== -1) {
    data[orderIndex] = {
      ...data[orderIndex],
      status: status,
      paymentStatus: status,
      paymentData: paymentData,
      updatedAt: new Date().toISOString(),
    };
    writeStore(data);
    return data[orderIndex];
  }
  return null;
}

function getOrderById(orderId) {
  const data = readStore();
  return data.find((order) => order.orderId === orderId) || null;
}

module.exports = {
  readStore,
  writeStore,
  appendOrder,
  updateOrderStatus,
  getOrderById,
};
