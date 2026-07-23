// ── Trial & Founding Member logic ─────────────────────────────────────────────
// Trial starts the first time a user visits /create.
// Stored in localStorage so it works immediately — no account required.
// When a user signs in via Supabase, trial_started_at syncs to their profile.
//
// Timeline:
//   Day 0–24  : active trial — full access, small "Trial: X days" indicator
//   Day 25–30 : expiring — gentle banner shown, founding member deal highlighted
//   Day 31–37 : grace period — upgrade prompt shown each session, never hard blocked
//   Day 38+   : ended — upgrade prompt shown, current session always completes

export const TRIAL_DAYS  = 30;
export const GRACE_DAYS  = 45; // Extended grace period for beta testing (was 7)
export const WARN_AT_DAY = 25; // start showing banner at this day

const STORAGE_KEY  = "sc_trial_start";
const INTENT_KEY   = "sc_upgrade_intent";
const GRACE_EXT_KEY = "sc_grace_extended"; // set when "Not ready yet" clicked

// ── Trial start ────────────────────────────────────────────────────────────────

export function initTrial() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }
}

export function getTrialStart() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? new Date(raw) : null;
}

// ── Days calculations ──────────────────────────────────────────────────────────

export function getDaysElapsed() {
  const start = getTrialStart();
  if (!start) return 0;
  return Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDaysRemaining() {
  return Math.max(0, TRIAL_DAYS - getDaysElapsed());
}

export function getGraceEnd() {
  // If "Not ready yet" was clicked, grace extends by another 7 days from that click
  const graceExt = localStorage.getItem(GRACE_EXT_KEY);
  if (graceExt) {
    const extDate = new Date(graceExt);
    const daysSince = Math.floor((Date.now() - extDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, GRACE_DAYS - daysSince);
  }
  return Math.max(0, (TRIAL_DAYS + GRACE_DAYS) - getDaysElapsed());
}

// ── Status ─────────────────────────────────────────────────────────────────────

// Returns: 'active' | 'expiring' | 'grace' | 'ended' | 'no-trial'
export function getTrialStatus() {
  const start = getTrialStart();
  if (!start) return "no-trial";

  const elapsed = getDaysElapsed();

  // Already upgraded — check intent
  const intent = getUpgradeIntent();
  if (intent?.confirmed) return "subscribed";

  if (elapsed < WARN_AT_DAY)           return "active";
  if (elapsed < TRIAL_DAYS)            return "expiring";

  // Check grace extension
  const graceExt = localStorage.getItem(GRACE_EXT_KEY);
  if (graceExt) {
    const extDate = new Date(graceExt);
    const daysSinceExt = Math.floor((Date.now() - extDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceExt < GRACE_DAYS) return "grace";
  } else if (elapsed < TRIAL_DAYS + GRACE_DAYS) {
    return "grace";
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
