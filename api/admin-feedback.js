import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Password check
  const password = req.headers["x-admin-password"];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Get up to 500 most recent feedback records
    const raw = await kv.lrange("feedback", 0, 499);
    const records = raw.map(item => {
      try {
        return typeof item === "string" ? JSON.parse(item) : item;
      } catch {
        return null;
      }
    }).filter(Boolean);

    return res.status(200).json({ records, total: records.length });
  } catch (err) {
    console.error("KV error:", err);
    return res.status(500).json({ error: "Could not load feedback" });
  }
}
