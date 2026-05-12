import { sql } from "@vercel/postgres";

// Converts a puzzle title into a URL-safe slug segment
function titleToSlug(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")   // strip non-alphanumeric (keep spaces)
    .trim()
    .replace(/\s+/g, "-")           // spaces → hyphens
    .replace(/-+/g, "-")            // collapse consecutive hyphens
    .replace(/-$/, "")              // strip trailing hyphen
    .slice(0, 40)                   // max 40 chars for the title portion
    .replace(/-$/, "");             // strip trailing hyphen after truncation
}

// Returns YYYYMMDD from today's UTC date
function dateStamp() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// 2-character alphanumeric suffix (a-z 0-9) — 1296 combinations
function randomSuffix() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function buildSlug(title) {
  return `${titleToSlug(title) || "puzzle"}-${dateStamp()}-${randomSuffix()}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, grade, faith, language, rows, cols, words } = req.body || {};

  if (!title || !Array.isArray(words) || !rows || !cols) {
    return res.status(400).json({ error: "Missing required puzzle data" });
  }

  const puzzleJson = JSON.stringify({ title, grade, faith, language, rows, cols, words });

  try {
    // Auto-create table on first use (safe to run every time — IF NOT EXISTS)
    await sql`
      CREATE TABLE IF NOT EXISTS puzzles (
        slug        TEXT PRIMARY KEY,
        title       TEXT NOT NULL,
        grade       TEXT,
        faith       TEXT,
        language    TEXT,
        puzzle_json TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Try up to 3 times in the astronomically unlikely event of a slug collision
    let slug = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = buildSlug(title);
      const result = await sql`
        INSERT INTO puzzles (slug, title, grade, faith, language, puzzle_json)
        VALUES (${candidate}, ${title}, ${grade || ""}, ${faith || ""}, ${language || "english"}, ${puzzleJson})
        ON CONFLICT (slug) DO NOTHING
        RETURNING slug
      `;
      if (result.rowCount > 0) {
        slug = candidate;
        break;
      }
    }

    if (!slug) {
      // Absolute last resort — append timestamp to guarantee uniqueness
      slug = buildSlug(title) + Date.now().toString(36).slice(-4);
      await sql`
        INSERT INTO puzzles (slug, title, grade, faith, language, puzzle_json)
        VALUES (${slug}, ${title}, ${grade || ""}, ${faith || ""}, ${language || "english"}, ${puzzleJson})
      `;
    }

    return res.status(200).json({ slug });
  } catch (err) {
    console.error("save-puzzle error:", err);
    return res.status(500).json({
      error: "Could not save puzzle. If this is a new deployment, make sure Vercel Postgres is connected in your project settings.",
    });
  }
}
