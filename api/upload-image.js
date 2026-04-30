// Vercel serverless: /api/upload-image
// POST { image: "<base64 data URL>" } — uploads to Cloudinary, returns { url }
const crypto = require("crypto");
const fetch = global.fetch || require("node-fetch");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
  const API_KEY = process.env.CLOUDINARY_API_KEY || "";
  const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return res.status(500).json({ error: "Cloudinary not configured" });
  }

  let body = req.body || {};
  try {
    if (!Object.keys(body).length && req.rawBody) body = JSON.parse(req.rawBody);
  } catch (e) {}

  const { image } = body;
  if (!image) return res.status(400).json({ error: "image is required" });

  // Strip data URL prefix if present
  const base64 = image.replace(/^data:image\/\w+;base64,/, "");

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "ebou-products";
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha256")
    .update(paramsToSign + API_SECRET)
    .digest("hex");

  // Build multipart form body manually
  const boundary = "----EbouBoundary" + Date.now();
  const parts = [
    { name: "file", value: `data:image/jpeg;base64,${base64}` },
    { name: "api_key", value: API_KEY },
    { name: "timestamp", value: String(timestamp) },
    { name: "signature", value: signature },
    { name: "folder", value: folder },
  ];

  let formBody = "";
  for (const part of parts) {
    formBody += `--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"\r\n\r\n${part.value}\r\n`;
  }
  formBody += `--${boundary}--`;

  try {
    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
        body: formBody,
      }
    );
    const data = await cloudRes.json();
    if (!cloudRes.ok || !data.secure_url) {
      console.error("Cloudinary error", data);
      return res.status(500).json({ error: "Image upload failed", detail: data.error?.message });
    }
    return res.status(200).json({ url: data.secure_url });
  } catch (err) {
    console.error("upload-image error", err);
    return res.status(500).json({ error: "Upload failed", detail: String(err) });
  }
};
