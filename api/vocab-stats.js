// ── /api/vocab-stats ──────────────────────────────────────────────────────────
// GET /api/vocab-stats?childId=xxx
// Authorization: Bearer <supabase-access-token>
//
// Returns vocabulary mastery statistics for a child, used by the parent
// Vocabulary Progress dashboard in FamilyDashboard.
//
// Response: {
//   childId,
//   total, mastered, learning, struggling, dueCount,
//   masteredPct,          // 0–100
//   recentlyMastered,     // last 5 words mastered (for the "words learned" highlight)
//   strugglingWords,      // words in struggling status (name + encounters)
//   dueWords,             // words whose next_review_at <= now
// }

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Auth check ──────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const childId = req.query.childId;
  if (!childId) return res.status(400).json({ error: "Missing childId" });

  // ── Confirm parent owns this child ──────────────────────────────────────────
  const { data: child, error: childErr } = await supabaseAdmin
    .from("child_profiles")
    .select("id, parent_id")
    .eq("id", childId)
    .eq("parent_id", user.id)
    .single();

  if (childErr || !child) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // ── Fetch all word progress for this child ──────────────────────────────────
  const { data: rows, error: fetchErr } = await supabaseAdmin
    .from("word_progress")
    .select("word, grade, status, encounters, correct_clean, mastered_at, next_review_at, last_seen_at, interval_days")
    .eq("child_id", childId)
    .order("last_seen_at", { ascending: false });

  if (fetchErr) {
    console.error("[vocab-stats] fetch error:", fetchErr.message);
    return res.status(500).json({ error: "Database error" });
  }

  const now = new Date();
  const total      = rows.length;
  const mastered   = rows.filter(r => r.status === "mastered").length;
  const struggling = rows.filter(r => r.status === "struggling").length;
  const learning   = rows.filter(r => r.status === "learning").length;
  const dueCount   = rows.filter(r => r.next_review_at && new Date(r.next_review_at) <= now).length;
  const masteredPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  // 5 most recently mastered words
  const recentlyMastered = rows
    .filter(r => r.status === "mastered" && r.mastered_at)
    .sort((a, b) => new Date(b.mastered_at) - new Date(a.mastered_at))
    .slice(0, 5)
    .map(r => ({ word: r.word, masteredAt: r.mastered_at }));

  // All struggling words (parent needs to see these)
  const strugglingWords = rows
    .filter(r => r.status === "struggling")
    .map(r => ({
      word:       r.word,
      grade:      r.grade,
      encounters: r.encounters,
      lastSeen:   r.last_seen_at,
    }));

  // Words due for review
  const dueWords = rows
    .filter(r => r.next_review_at && new Date(r.next_review_at) <= now)
    .slice(0, 10)
    .map(r => ({ word: r.word, status: r.status, dueAt: r.next_review_at }));

  return res.status(200).json({
    childId,
    total,
    mastered,
    learning,
    struggling,
    dueCount,
    masteredPct,
    recentlyMastered,
    strugglingWords,
    dueWords,
  });
}
