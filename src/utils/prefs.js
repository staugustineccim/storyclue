// User preference persistence — stores in localStorage with 90-day expiry.
// No account required. Works for all users on the same browser/device.

const KEY    = "storyclue_prefs";
const NINETY = 90 * 24 * 60 * 60 * 1000; // 90 days in ms

export function savePrefs(prefs) {
  try {
    const payload = { ...prefs, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch { /* storage unavailable — fail silently */ }
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    // Expire after 90 days
    if (!payload.savedAt || Date.now() - payload.savedAt > NINETY) {
      localStorage.removeItem(KEY);
      return null;
    }
    return payload;
  } catch { return null; }
}
