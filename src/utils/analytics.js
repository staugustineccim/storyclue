// ── StoryClue Analytics ───────────────────────────────────────────────────────
// Fires every event to two places simultaneously:
//   1. Google Analytics 4 (via window.gtag — injected in index.html)
//   2. Supabase/Postgres via /api/log-event (permanent record, queryable)
//
// All calls are fire-and-forget — analytics NEVER block the UI or throw errors.

function getSessionId() {
  try {
    let sid = sessionStorage.getItem("sc_sid");
    if (!sid) {
      sid = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("sc_sid", sid);
    }
    return sid;
  } catch {
    return "unknown";
  }
}

function gtagEvent(name, params) {
  try {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", name, params);
    }
  } catch { /* silent — GA4 may be blocked by ad blockers */ }
}

function logToDatabase(eventType, properties) {
  try {
    // fire-and-forget — intentionally no await
    fetch("/api/log-event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        properties,
        session_id: getSessionId(),
      }),
    }).catch(() => { /* silent */ });
  } catch { /* silent */ }
}

/**
 * Track any StoryClue event.
 * Fires to GA4 and Supabase simultaneously.
 *
 * Standard events:
 *   puzzle_generated  { book_title, grade_level, faith_tradition, language, input_method }
 *   puzzle_completed  { time_taken_seconds, mistake_count, grade_level, book_title }
 *   puzzle_shared     { book_title, grade_level }
 *   hint_used         { hint_type: "letter" | "simpler_clue", grade_level }
 *   show_answer_clicked { grade_level, book_title, time_taken_seconds }
 *   feedback_submitted  { stars, would_pay, grade_level }
 */
export function trackEvent(name, properties = {}) {
  gtagEvent(name, properties);
  logToDatabase(name, properties);
}
