// Fetch puzzle from Supabase (same database as save-puzzle.js uses)
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
    return res.status(400).json({ error: "Missing slug" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase not configured");
    }

    const fetchRes = await fetch(
      `${supabaseUrl}/rest/v1/puzzles?slug=eq.${encodeURIComponent(slug.trim())}&select=puzzle_data`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!fetchRes.ok) {
      console.error(`[get-puzzle] Supabase fetch error: ${fetchRes.status}`);
      return res.status(500).json({ error: "Could not load puzzle. Please try again." });
    }

    const data = await fetchRes.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: "Puzzle not found. This link may be incorrect, or the puzzle may not have been saved yet." });
    }

    let puzzleData;
    try {
      puzzleData = JSON.parse(data[0].puzzle_data);
    } catch (parseErr) {
      console.error("[get-puzzle] JSON parse error:", parseErr);
      return res.status(500).json({ error: "Puzzle data is corrupted. Please contact support." });
    }

    return res.status(200).json(puzzleData);
  } catch (err) {
    console.error("get-puzzle error:", err);
    return res.status(500).json({ error: "Could not load puzzle. Please try again." });
  }
}
