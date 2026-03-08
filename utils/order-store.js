const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize orders file if it doesn't exist
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, "[]", "utf8");
}

function readOrders() {
  try {
    const data = fs.readFileSync(ORDERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading orders:", err);
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing orders:", err);
    return false;
  }
}

function appendOrder(order) {
  const orders = readOrders();
  const newOrder = {
    id: order.orderId || Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    ...order,
    createdAt: order.createdAt || new Date().toISOString(),
  };
  orders.unshift(newOrder); // Add to beginning (newest first)
  writeOrders(orders);
  return newOrder;
}

function getOrder(orderId) {
  const orders = readOrders();
  return orders.find((o) => o.orderId === orderId || o.id === orderId) || null;
}

function updateOrder(orderId, updates) {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.orderId === orderId || o.id === orderId);
  if (index === -1) return null;
  
  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeOrders(orders);
  return orders[index];
}

function updateOrderStatus(orderId, status) {
  return updateOrder(orderId, { status });
}

function deleteOrder(orderId) {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.orderId === orderId || o.id === orderId);
  if (index === -1) return false;
  
  orders.splice(index, 1);
  writeOrders(orders);
  return true;
}

function getOrdersByEmail(email) {
  const orders = readOrders();
  return orders.filter(
    (o) => o.customer && o.customer.email && 
           o.customer.email.toLowerCase() === email.toLowerCase()
  );
}

function getOrdersByStatus(status) {
  const orders = readOrders();
  return orders.filter((o) => o.status === status);
}

function getAllOrders(options = {}) {
  let orders = readOrders();
  
  // Filter by status
  if (options.status) {
    orders = orders.filter((o) => o.status === options.status);
  }
  
  // Filter by customer email
  if (options.email) {
    orders = orders.filter(
      (o) => o.customer && o.customer.email && 
             o.customer.email.toLowerCase() === options.email.toLowerCase()
    );
  }
  
  // Search by order ID or customer name
  if (options.search) {
    const search = options.search.toLowerCase();
    orders = orders.filter(
      (o) =>
        (o.orderId && o.orderId.toLowerCase().includes(search)) ||
        (o.customer && o.customer.name && o.customer.name.toLowerCase().includes(search)) ||
        (o.customer && o.customer.email && o.customer.email.toLowerCase().includes(search))
    );
  }
  
  // Date range filter
  if (options.startDate) {
    orders = orders.filter((o) => new Date(o.createdAt) >= new Date(options.startDate));
  }
  if (options.endDate) {
    orders = orders.filter((o) => new Date(o.createdAt) <= new Date(options.endDate));
  }
  
  // Pagination
  const page = options.page || 1;
  const limit = options.limit || 20;
  const start = (page - 1) * limit;
  
  return {
    orders: orders.slice(start, start + limit),
    total: orders.length,
    page,
    totalPages: Math.ceil(orders.length / limit),
  };
}

function getOrderStats() {
  const orders = readOrders();
  const stats = {
    total: orders.length,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  };
  
  orders.forEach((order) => {
    if (order.status) {
      stats[order.status] = (stats[order.status] || 0) + 1;
    }
    if (order.total) {
      const amount = parseFloat(String(order.total).replace(/[^0-9.\-]/g, "") || "0");
      stats.totalRevenue += amount;
    }
  });
  
  stats.totalRevenue = stats.totalRevenue.toFixed(2);
  return stats;
}

function getRecentOrders(limit = 10) {
  const orders = readOrders();
  return orders.slice(0, limit);
}

module.exports = {
  readOrders,
  writeOrders,
  appendOrder,
  getOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByEmail,
  getOrdersByStatus,
  getAllOrders,
  getOrderStats,
  getRecentOrders,
};
