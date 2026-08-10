// Admin dashboard API — fetch churches, puzzles, token status
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Simple password auth (env var)
  const providedPassword = req.query.password;
  if (!providedPassword || providedPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase not configured");
    }

    // Fetch all churches
    const churchRes = await fetch(`${supabaseUrl}/rest/v1/church_accounts`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });
    const churches = await churchRes.json();

    // Fetch all puzzles with metadata
    const puzzleRes = await fetch(`${supabaseUrl}/rest/v1/puzzles?select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });
    const puzzles = await puzzleRes.json();

    // Fetch sermon records to track status
    const sermonRes = await fetch(`${supabaseUrl}/rest/v1/church_sermons?select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });
    const sermons = await sermonRes.json();

    // Build dashboard data
    const dashboardData = {
      churches: churches.length,
      puzzlesCreated: puzzles.length,
      recentPuzzles: puzzles.slice(-10).reverse().map(p => ({
        id: p.id,
        slug: p.slug,
        church_name: p.church_name || "Unknown",
        sermon_title: p.sermon_title || "Untitled",
        created_at: p.created_at,
        video_url: p.video_url,
        teacher_token: p.teacher_token,
      })),
      churchStats: churches.map(c => {
        const churchPuzzles = puzzles.filter(p => p.church_name === c.church_name);
        const churchSermons = sermons.filter(s => s.church_account_id === c.id);
        return {
          id: c.id,
          name: c.church_name,
          pastor: c.pastor_name,
          youtube_channel: c.youtube_channel,
          puzzles_created: churchPuzzles.length,
          sermons_processed: churchSermons.length,
          status: churchSermons.length > 0 ? "active" : "identified",
        };
      }),
    };

    return res.status(200).json(dashboardData);
  } catch (err) {
    console.error("admin/dashboard-data error:", err);
    return res.status(500).json({ error: err.message });
  }
}
