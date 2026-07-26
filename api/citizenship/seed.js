// Seed citizenship database with all USCIS civics questions
// Protected endpoint: only call once to populate the database
// Usage: POST /api/citizenship/seed with admin authorization

import seedDatabase from "./seed-database.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Protect this endpoint - require admin token
  const adminToken = req.headers["x-admin-token"] || req.query.token;
  if (!adminToken || adminToken !== process.env.CITIZENSHIP_SEED_TOKEN) {
    return res.status(401).json({ error: "Unauthorized - invalid or missing admin token" });
  }

  try {
    console.log("[Seed Endpoint] Starting seed operation...");
    const result = await seedDatabase();

    return res.status(200).json({
      success: true,
      message: "Citizenship database seeded successfully",
      ...result,
    });
  } catch (err) {
    console.error("[Seed Endpoint] Error:", err);
    return res.status(500).json({
      error: "Failed to seed database",
      details: err.message,
    });
  }
}
