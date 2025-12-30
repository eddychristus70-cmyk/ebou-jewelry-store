const contactStore = require("../../utils/contact-store");

const defaultHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function isAuthorized(event) {
  const adminToken = process.env.CONTACT_ADMIN_TOKEN;
  if (!adminToken) return true;
  const headers = event.headers || {};
  const params = event.queryStringParameters || {};
  const provided = headers["x-admin-token"] || params.key || params.token;
  return provided === adminToken;
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: defaultHeaders, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!isAuthorized(event)) {
    return {
      statusCode: 401,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  const limit = Number.parseInt((event.queryStringParameters || {}).limit, 10);
  const messages = contactStore.getMessages(
    Number.isNaN(limit) ? undefined : limit
  );

  return {
    statusCode: 200,
    headers: defaultHeaders,
    body: JSON.stringify({ count: messages.length, messages }),
  };
};
