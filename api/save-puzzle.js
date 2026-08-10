import { validateCSRFToken } from "./csrf.js";

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

// 32-character random token for teacher URL access (hexadecimal)
function generateTeacherToken() {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function buildSlug(title) {
  return `${titleToSlug(title) || "puzzle"}-${dateStamp()}-${randomSuffix()}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, grade, faith, language, rows, cols, words, phonicsMode, pictureMode, church_name, sermon_title, video_url } = req.body || {};

  if (!title || !Array.isArray(words) || !rows || !cols) {
    return res.status(400).json({ error: "Missing required puzzle data" });
  }

  const puzzleJson = JSON.stringify({
    title, grade, faith, language, rows, cols, words,
    phonicsMode: !!phonicsMode,
    pictureMode: !!pictureMode,
  });

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    // Try up to 3 times in case of slug collision
    let slug = null;
    const teacherToken = generateTeacherToken();

    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = buildSlug(title);

      const insertRes = await fetch(`${supabaseUrl}/rest/v1/puzzles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          slug: candidate,
          puzzle_data: puzzleJson,
          teacher_token: teacherToken,
          church_name: church_name || "",
          sermon_title: sermon_title || title,
          video_url: video_url || null,
        }),
      });

      const insertData = await insertRes.json();

      if (insertRes.ok && insertData && insertData.length > 0) {
        slug = candidate;
        break;
      }

      // If conflict (409), try again with a new slug
      if (insertRes.status === 409) {
        continue;
      }

      if (!insertRes.ok) {
        console.error("[save-puzzle] Insert error:", insertRes.status, insertData);
        throw new Error(`Supabase insert failed: ${insertRes.status}`);
      }
    }

    if (!slug) {
      // Last resort — use timestamp for uniqueness
      slug = buildSlug(title) + Date.now().toString(36).slice(-4);
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/puzzles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          slug: slug,
          puzzle_data: puzzleJson,
          teacher_token: teacherToken,
          church_name: church_name || "",
          sermon_title: sermon_title || title,
          video_url: video_url || null,
        }),
      });

      if (!insertRes.ok) {
        const errData = await insertRes.json();
        throw new Error(`Final insert failed: ${insertRes.status} - ${errData.message || ""}`);
      }
    }

    return res.status(200).json({ slug, teacherToken });
  } catch (err) {
    console.error("save-puzzle error:", err);
    return res.status(500).json({
      error: err.message || "Could not save puzzle to Supabase",
    });
  }
}
