import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
    return res.status(400).json({ error: "Missing slug" });
  }

  try {
    const result = await sql`
      SELECT puzzle_json FROM puzzles WHERE slug = ${slug.trim()}
    `;

    if (!result.rows.length) {
      return res.status(404).json({ error: "Puzzle not found. This link may be incorrect, or the puzzle may not have been saved yet." });
    }

    let puzzleData;
    try {
      puzzleData = JSON.parse(result.rows[0].puzzle_json);
    } catch {
      return res.status(500).json({ error: "Puzzle data is corrupted. Please contact support." });
    }

    return res.status(200).json(puzzleData);
  } catch (err) {
    console.error("get-puzzle error:", err);
    return res.status(500).json({ error: "Could not load puzzle. Please try again." });
  }
}
