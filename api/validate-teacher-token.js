import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug, token } = req.query;

  if (!slug || !token) {
    return res.status(400).json({ error: "Missing slug or token" });
  }

  try {
    const result = await sql`
      SELECT teacher_token FROM puzzles WHERE slug = ${slug}
    `;

    if (result.rowCount === 0) {
      return res.status(404).json({ valid: false });
    }

    const storedToken = result.rows[0].teacher_token;
    const isValid = storedToken === token;

    return res.status(200).json({ valid: isValid });
  } catch (err) {
    console.error("validate-teacher-token error:", err);
    return res.status(500).json({ error: "Could not validate token" });
  }
}
