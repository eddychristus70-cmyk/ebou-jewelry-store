const orderStore = require("../../utils/order-store");

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const params = event.queryStringParameters || {};
  const suppliedKey =
    params.key || event.headers["x-admin-key"] || event.headers["X-Admin-Key"] || "";
  const requiredKey = process.env.ADMIN_API_KEY || "devpass";

  if (requiredKey && suppliedKey !== requiredKey) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  const searchTerm = (params.q || "").trim().toLowerCase();
  const limit = parseInt(params.limit, 10);

  const orders = orderStore.readOrders();
  const ordered = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const filtered = ordered.filter((order) => {
    if (!searchTerm) return true;
    const customer = order.customer || {};
    const text = [
      order.orderId,
      order.paymentRef,
      customer.name,
      customer.email,
      customer.phone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes(searchTerm);
  });

  const limited = !isNaN(limit) && limit > 0 ? filtered.slice(0, limit) : filtered;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      count: limited.length,
      total: orders.length,
      updatedAt: new Date().toISOString(),
      orders: limited,
    }),
  };
};
