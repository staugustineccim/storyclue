import { createClient } from "@supabase/supabase-js";

// ── Supabase client ────────────────────────────────────────────────────────────
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Environment Variables.
// When not set, auth is silently disabled — the rest of the app works exactly as before.
//
// Setup checklist (one-time, Bob does this in Supabase dashboard):
//   1. Create project at supabase.com (free tier)
//   2. Dashboard → Authentication → Providers → Google → Enable
//   3. Add Google OAuth credentials (from console.cloud.google.com)
//   4. Dashboard → Settings → API → copy Project URL and anon public key
//   5. Vercel → StoryClue project → Settings → Environment Variables:
//        VITE_SUPABASE_URL  = https://xxxx.supabase.co
//        VITE_SUPABASE_ANON_KEY = eyJ...
//   6. Redeploy

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("[Supabase] URL:", SUPABASE_URL ? SUPABASE_URL.slice(0, 30) : "MISSING");
console.log("[Supabase] KEY:", SUPABASE_ANON ? SUPABASE_ANON.slice(0, 20) : "MISSING");

let _supabase = null;
if (SUPABASE_URL && SUPABASE_ANON) {
  try {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: "implicit",
      },
    });
    console.log("[Supabase] client created OK");
  } catch (e) {
    console.error("[Supabase] createClient failed:", e);
  }
}

export const supabase = _supabase;
export const authEnabled = Boolean(supabase);
