// ── Trial & Founding Member logic ─────────────────────────────────────────────
// Global trial end date: October 22, 2026 (60 days from August 23, 2026)
// ALL users get free trial until this date, regardless of when they started.
// Stored in localStorage so it works immediately — no account required.
// When a user signs in via Supabase, trial_started_at syncs to their profile.
//
// Timeline (remaining days until TRIAL_END_DATE):
//   51+ days : active trial — full access, small "Trial: X days" indicator
//   1–50 days: expiring — gentle banner shown, founding member deal highlighted
//   Grace period: 30 extra days after trial end before hard block
//   After grace: ended — upgrade prompt shown, current session always completes

const TRIAL_END_DATE = new Date(2026, 9, 22); // October 22, 2026 (months are 0-indexed)
const GRACE_PERIOD_DAYS = 30;
const WARN_AT_DAYS_REMAINING = 50;

const STORAGE_KEY  = "sc_trial_start";
const INTENT_KEY   = "sc_upgrade_intent";
const GRACE_EXT_KEY = "sc_grace_extended"; // set when "Not ready yet" clicked

// ── Trial initialization ──────────────────────────────────────────────────────

export function initTrial() {
  // Marker that trial has been viewed; now uses global end date
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, "true");
  }
}

export function getTrialStart() {
  // Returns global TRIAL_END_DATE for reference (backward compatibility)
  return TRIAL_END_DATE;
}

// ── Days calculations ──────────────────────────────────────────────────────────

export function getDaysRemaining() {
  const now = new Date();
  const daysUntilEnd = Math.ceil((TRIAL_END_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysUntilEnd);
}

export function getGraceEnd() {
  // If "Not ready yet" was clicked, grace extends by another N days from that click
  const graceExt = localStorage.getItem(GRACE_EXT_KEY);
  if (graceExt) {
    const extDate = new Date(graceExt);
    const daysSince = Math.floor((Date.now() - extDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, GRACE_PERIOD_DAYS - daysSince);
  }
  // Grace period starts after TRIAL_END_DATE
  const graceEndDate = new Date(TRIAL_END_DATE);
  graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);
  const daysUntilGraceEnd = Math.ceil((graceEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysUntilGraceEnd);
}

// ── Status ─────────────────────────────────────────────────────────────────────

// Returns: 'active' | 'expiring' | 'grace' | 'ended' | 'subscribed'
export function getTrialStatus() {
  // Already upgraded — check intent
  const intent = getUpgradeIntent();
  if (intent?.confirmed) return "subscribed";

  const now = new Date();
  const daysRemaining = getDaysRemaining();

  // Trial still active
  if (now < TRIAL_END_DATE) {
    if (daysRemaining > WARN_AT_DAYS_REMAINING) {
      return "active";
    } else {
      return "expiring";
    }
  }

  // Trial ended — check grace period
  const graceExt = localStorage.getItem(GRACE_EXT_KEY);
  if (graceExt) {
    const extDate = new Date(graceExt);
    const daysSinceExt = Math.floor((Date.now() - extDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceExt < GRACE_PERIOD_DAYS) return "grace";
  } else {
    const graceEndDate = new Date(TRIAL_END_DATE);
    graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);
    if (now < graceEndDate) {
      return "grace";
    }
  }

  return "ended";
}

export function isTrialActive()   { const s = getTrialStatus(); return s === "active" || s === "expiring"; }
export function isExpiring()      { return getTrialStatus() === "expiring"; }
export function isInGrace()       { return getTrialStatus() === "grace"; }
export function isTrialOver()     { return getTrialStatus() === "ended"; }
export function isSubscribed()    { return getTrialStatus() === "subscribed"; }
export function hasStartedTrial() { return getTrialStatus() !== "no-trial"; }

// ── Upgrade intent (pre-Stripe) ────────────────────────────────────────────────
// Stores intent locally and in Supabase when auth is available.
// When Stripe is wired up, replace the localStorage write with the Stripe checkout call.

export function getUpgradeIntent() {
  try {
    const raw = localStorage.getItem(INTENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setUpgradeIntent(plan) {
  // plan: 'single-founding' | 'family-founding'
  const intent = { plan, at: new Date().toISOString(), confirmed: false };
  localStorage.setItem(INTENT_KEY, JSON.stringify(intent));
  return intent;
}

export function extendGrace() {
  localStorage.setItem(GRACE_EXT_KEY, new Date().toISOString());
}

// ── Supabase sync (called from AuthContext after sign-in) ──────────────────────
// Upserts trial_started_at and upgrade_intent into the Supabase profiles table.
// No-ops if supabase client is null (auth not configured).

export async function syncTrialToSupabase(supabase, userId) {
  if (!supabase || !userId) return;
  const start = getTrialStart();
  const intent = getUpgradeIntent();
  try {
    await supabase.from("profiles").upsert({
      id: userId,
      trial_started_at: start?.toISOString() ?? new Date().toISOString(),
      upgrade_intent:   intent ?? null,
    }, { onConflict: "id" });
  } catch { /* non-blocking — local state is source of truth */ }
}
