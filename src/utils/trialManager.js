// Trial system: 30 days free from first play, email at day 25, upgrade at day 40

const TRIAL_KEY = "sc_trial_start";
const TRIAL_EMAIL_KEY = "sc_trial_email";
const TRIAL_EXTENDED_KEY = "sc_trial_extended";

export function getTrialStatus() {
  const startDate = localStorage.getItem(TRIAL_KEY);
  const email = localStorage.getItem(TRIAL_EMAIL_KEY);
  const extended = localStorage.getItem(TRIAL_EXTENDED_KEY);

  if (!startDate) {
    // First visit — start trial
    const now = new Date().toISOString();
    localStorage.setItem(TRIAL_KEY, now);
    return { daysLeft: 30, hasEmail: false, isExtended: false, status: "started" };
  }

  const start = new Date(startDate);
  const now = new Date();
  let daysLeft = 30 - Math.floor((now - start) / (1000 * 60 * 60 * 24));

  if (extended) {
    // Extended trial adds 15 days from extension date
    const extDate = new Date(extended);
    const extDaysLeft = 15 - Math.floor((now - extDate) / (1000 * 60 * 60 * 24));
    daysLeft = Math.max(daysLeft, extDaysLeft);
  }

  const hasEmail = !!email;
  const isExpired = daysLeft <= 0;
  const shouldPromptEmail = daysLeft <= 5 && daysLeft > 0 && !hasEmail; // Day 25-30
  const shouldPromptUpgrade = isExpired && !hasEmail; // Day 40+, no extension

  return {
    daysLeft: Math.max(0, daysLeft),
    hasEmail,
    isExtended: !!extended,
    isExpired,
    shouldPromptEmail,
    shouldPromptUpgrade,
    status: isExpired ? "expired" : daysLeft <= 5 ? "expiring" : "active",
  };
}

export async function saveTrialEmail(email) {
  localStorage.setItem(TRIAL_EMAIL_KEY, email);
  localStorage.setItem(TRIAL_EXTENDED_KEY, new Date().toISOString());

  // Save to database for marketing
  try {
    await fetch("/api/trial/save-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch (err) {
    console.log("Trial email save (non-critical):", err.message);
  }

  return { daysLeft: 15, status: "extended" };
}

export function startTrial() {
  const now = new Date().toISOString();
  localStorage.setItem(TRIAL_KEY, now);
}
