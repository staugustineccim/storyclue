// ── StoryClue Vocabulary Struggle Tracker — Spaced Repetition Engine ──────────
//
// Implements a simplified SM-2 algorithm adapted for vocabulary crossword puzzles.
//
// Research basis:
//   - Ebbinghaus Forgetting Curve: first review at 1 day, then 3, 7, 16, 35 days
//   - Marzano Six-Step Vocabulary Framework: multiple exposures with varied contexts
//   - Beck, McKeown & Kucan Tier 2 academic vocabulary (cross-domain words)
//   - Common Core ELA: vocabulary mastery requires 10–15+ meaningful encounters
//
// Word status lifecycle:
//   new        → first encounter, no data yet
//   learning   → active SM-2 schedule (normal)
//   struggling → used Show Answer or 3+ hint failures; daily review until clean solve
//   mastered   → 3 clean solves on expanding intervals; monthly refresher only
//
// Storage: localStorage per child/user — works offline, no backend needed.
// Key format: sc_wp_<childId>  (or sc_wp_anon for anonymous)
// Background Supabase sync for cross-device support (future sprint).

// Grade order used for clue difficulty stepping
export const GRADE_ORDER = ["k","1","2","3","4","5","6","7","8","9-10","11-12","adult"];

// Return localStorage key for this child/user context
export function progressKey(childId) {
  return childId ? `sc_wp_${childId}` : "sc_wp_anon";
}

// Load the full progress map from localStorage
export function loadProgress(childId) {
  try {
    const raw = localStorage.getItem(progressKey(childId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// Persist progress map
function saveProgress(childId, map) {
  try {
    localStorage.setItem(progressKey(childId), JSON.stringify(map));
  } catch { /* silently ignore — quota exceeded edge case */ }
}

// Default entry for a word never seen before
function defaultEntry(word, grade) {
  return {
    word,
    grade: grade || "3",
    encounters:      0,
    correctClean:    0, // solved without ANY hints AND zero mistakes
    hintsUsed:       0, // simpler clue requested
    letterRevealed:  0, // reveal-a-letter used
    showsUsed:       0, // Show Answer used
    mistakes:        0, // wrong letters typed (cumulative)
    status:          "learning",
    intervalDays:    1,
    nextReviewAt:    null,
    lastSeenAt:      null,
    masteredAt:      null,
    clueGradeOffset: 0,  // 0 = normal grade; -1 = one grade easier; -2 = two easier
  };
}

// ── SM-2 update — call after every puzzle completion ──────────────────────────
// wordResults: Array of {
//   word:           string (uppercase),
//   grade:          string,
//   hintsUsed:      boolean,
//   letterRevealed: boolean,
//   showAnswerUsed: boolean,
//   solvedClean:    boolean, // no hints + no letter reveals + 0 mistakes
//   mistakes:       number,
// }
export function updateWordProgress(childId, wordResults) {
  const progress = loadProgress(childId);
  const now = new Date();

  for (const result of wordResults) {
    const key = result.word.toUpperCase().replace(/[^A-Z]/g, "");
    if (!key) continue;
    const entry = progress[key] || defaultEntry(key, result.grade);

    entry.encounters  += 1;
    entry.mistakes    += result.mistakes || 0;
    entry.lastSeenAt   = now.toISOString();

    // ── Update grade if this is the first time (or if word appears at new grade) ─
    if (!progress[key]) entry.grade = result.grade;

    if (result.showAnswerUsed) {
      // ── Student gave up — most severe signal ─────────────────────────────
      entry.showsUsed += 1;
      entry.status     = "struggling";
      entry.intervalDays = 1;                                    // review tomorrow
      entry.clueGradeOffset = Math.max(-2, entry.clueGradeOffset - 1); // easier clue

    } else if (result.solvedClean) {
      // ── Perfect solve: no hints, no mistakes ─────────────────────────────
      entry.correctClean += 1;

      if (entry.status === "struggling") {
        // Broke free from struggling — reset to learning with cautious interval
        entry.status = "learning";
        entry.intervalDays = 2;
        entry.clueGradeOffset = Math.min(0, entry.clueGradeOffset + 1); // ease difficulty back up
      } else {
        // Normal learning progression — double interval each clean solve
        entry.intervalDays = Math.min(entry.intervalDays * 2, 21);

        // Mastery check: 3+ clean solves AND interval has stretched to 7+ days
        // This mirrors Ebbinghaus research — retention proven across multiple gaps
        if (entry.correctClean >= 3 && entry.intervalDays >= 7) {
          entry.status        = "mastered";
          entry.intervalDays  = 30;           // soft monthly refresher
          entry.masteredAt    = now.toISOString();
          entry.clueGradeOffset = 0;          // restore normal clue grade
        }
      }

    } else if (result.hintsUsed || result.letterRevealed) {
      // ── Solved but needed help ────────────────────────────────────────────
      entry.hintsUsed       += result.hintsUsed       ? 1 : 0;
      entry.letterRevealed  += result.letterRevealed  ? 1 : 0;

      // Three cumulative hint events → downgrade to struggling
      if ((entry.hintsUsed + entry.letterRevealed) >= 3 && entry.status !== "mastered") {
        entry.status         = "struggling";
        entry.intervalDays   = 1;
        entry.clueGradeOffset = Math.max(-2, entry.clueGradeOffset - 1);
      }
      // Interval does NOT advance on a hinted solve — needs a clean solve to progress
    }

    // ── Schedule next review ───────────────────────────────────────────────
    const next = new Date(now);
    next.setDate(next.getDate() + entry.intervalDays);
    entry.nextReviewAt = next.toISOString();

    progress[key] = entry;
  }

  saveProgress(childId, progress);
  return progress;
}

// ── Get words due for review ───────────────────────────────────────────────────
// Returns up to maxWords entries whose nextReviewAt has passed.
// Struggling words are always surfaced first.
// Each entry includes a computed `clueGrade` telling the generator to use a
// simpler clue to ease the student back into the word.
export function getDueWords(childId, maxWords = 3) {
  const progress = loadProgress(childId);
  const now = new Date();

  const due = Object.values(progress).filter(entry => {
    if (!entry.nextReviewAt) return false;
    return new Date(entry.nextReviewAt) <= now;
  });

  // Sort: struggling first, then most overdue
  due.sort((a, b) => {
    if (a.status === "struggling" && b.status !== "struggling") return -1;
    if (b.status === "struggling" && a.status !== "struggling") return 1;
    return new Date(a.nextReviewAt) - new Date(b.nextReviewAt);
  });

  return due.slice(0, maxWords).map(entry => {
    // Calculate effective clue grade (clueGradeOffset is 0 or negative)
    const wordGradeIdx = GRADE_ORDER.indexOf(entry.grade);
    const targetIdx    = Math.max(0, wordGradeIdx + entry.clueGradeOffset);
    const clueGrade    = GRADE_ORDER[targetIdx] || entry.grade;
    return {
      word:       entry.word,
      grade:      entry.grade,
      status:     entry.status,
      clueGrade,
      encounters: entry.encounters,
      // Human-readable context for the review card
      reviewReason: entry.status === "struggling"
        ? "You needed help with this word last time"
        : entry.status === "mastered"
          ? "Quick refresher on a word you know!"
          : `You've seen this word ${entry.encounters} time${entry.encounters !== 1 ? "s" : ""}`,
    };
  });
}

// ── Mastery stats for display ──────────────────────────────────────────────────
export function getMasteryStats(childId) {
  const progress = loadProgress(childId);
  const entries  = Object.values(progress);
  const now      = new Date();
  return {
    total:       entries.length,
    mastered:    entries.filter(e => e.status === "mastered").length,
    learning:    entries.filter(e => e.status === "learning").length,
    struggling:  entries.filter(e => e.status === "struggling").length,
    dueCount:    entries.filter(e => e.nextReviewAt && new Date(e.nextReviewAt) <= now).length,
  };
}

// ── Background sync to Supabase (cross-device support) ───────────────────────
// Fires-and-forgets after every localStorage update when the user is logged in.
// Uses the user's JWT so the server can verify ownership before writing.
// Fails silently — localStorage remains the source of truth.
export async function syncProgressToServer(childId, updatedEntries) {
  if (!childId || !updatedEntries || updatedEntries.length === 0) return;
  try {
    // Lazy-import supabase to avoid circular deps and keep this util framework-agnostic
    const { supabase } = await import("./supabase.js");
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;  // anonymous user — localStorage only

    fetch("/api/track-words", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ childId, words: updatedEntries }),
    }).catch(() => { /* background sync failure — ignore */ });
  } catch { /* supabase not available — ignore */ }
}

// ── Get a device/anon ID from localStorage (created on first use) ─────────────
export function getDeviceId() {
  let id = localStorage.getItem("sc_device_id");
  if (!id) {
    id = "dev_" + (
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)
    );
    localStorage.setItem("sc_device_id", id);
  }
  return id;
}

// ── Get active child ID from sessionStorage ───────────────────────────────────
export function getActiveChildId() {
  try {
    const c = JSON.parse(sessionStorage.getItem("sc_active_child") || "null");
    return c?.id || null;
  } catch { return null; }
}
