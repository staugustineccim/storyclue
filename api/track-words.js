// ── /api/track-words ──────────────────────────────────────────────────────────
// POST { childId, words: [WordProgressEntry, ...] }
// Authorization: Bearer <supabase-access-token>
//
// Background-syncs localStorage SM-2 word progress to Supabase so it follows
// the user across devices. The SM-2 algorithm runs entirely client-side;
// this endpoint just persists the final computed state.
//
// Security:
//   - Verifies the user's JWT before writing anything
//   - Confirms the parent_id of the child matches the authenticated user
//   - Uses SUPABASE_SERVICE_ROLE_KEY server-side only — never exposed to client
//   - Upserts on (child_id, word) — safe to call after every puzzle

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Auth check ──────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  // ── Validate body ───────────────────────────────────────────────────────────
  const { childId, words } = req.body || {};
  if (!childId || !Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ error: "Missing childId or words array" });
  }

  // ── Confirm parent owns this child ──────────────────────────────────────────
  const { data: child, error: childErr } = await supabaseAdmin
    .from("child_profiles")
    .select("id, parent_id")
    .eq("id", childId)
    .eq("parent_id", user.id)
    .single();

  if (childErr || !child) {
    return res.status(403).json({ error: "Forbidden — child not found" });
  }

  // ── Build upsert rows ───────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const rows = words
    .map(w => {
      const word = (w.word || "").toUpperCase().replace(/[^A-Z]/g, "");
      if (!word) return null;
      return {
        parent_id:         user.id,
        child_id:          childId,
        word,
        grade:             w.grade             || "3",
        encounters:        Number(w.encounters)        || 0,
        correct_clean:     Number(w.correctClean)      || 0,
        hints_used:        Number(w.hintsUsed)         || 0,
        letter_revealed:   Number(w.letterRevealed)    || 0,
        shows_used:        Number(w.showsUsed)         || 0,
        mistakes:          Number(w.mistakes)          || 0,
        status:            w.status            || "learning",
        interval_days:     Number(w.intervalDays)      || 1,
        clue_grade_offset: Number(w.clueGradeOffset)   || 0,
        next_review_at:    w.nextReviewAt      || null,
        last_seen_at:      w.lastSeenAt        || null,
        mastered_at:       w.masteredAt        || null,
        updated_at:        now,
      };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    return res.status(200).json({ synced: 0 });
  }

  // ── Upsert — on conflict (child_id, word) take the incoming values ──────────
  const { error: upsertErr } = await supabaseAdmin
    .from("word_progress")
    .upsert(rows, { onConflict: "child_id,word" });

  if (upsertErr) {
    console.error("[track-words] upsert error:", upsertErr.message);
    return res.status(500).json({ error: "Database error" });
  }

  return res.status(200).json({ synced: rows.length });
}
