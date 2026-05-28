import { createContext, useContext, useEffect, useState } from "react";
import { supabase, authEnabled } from "../utils/supabase";

// ── Auth context ──────────────────────────────────────────────────────────────
// Provides `user` (null when signed out) and `signInWithGoogle` / `signOut`
// helpers to any component that calls useAuth().
//
// When authEnabled is false (env vars not set) the context always returns
// user:null and no-op functions — the rest of the app works exactly as before.

const AuthContext = createContext({ user: null, loading: false, signInWithGoogle: () => {}, signOut: () => {} });

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(authEnabled); // only show spinner when auth is real

  useEffect(() => {
    if (!authEnabled) return;

    // Handle PKCE code in URL (OAuth callback) then fall through to getSession
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    console.log("[Auth] mount — hash:", window.location.hash.slice(0, 40), "code:", code ? "yes" : "no");
    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(({ data, error }) => console.log("[Auth] exchangeCode →", data?.session?.user?.email, error))
        .catch(() => {})
        .finally(() => {
          window.history.replaceState({}, "", window.location.pathname);
        });
    }

    // Get current session on mount (also picks up implicit-flow hash tokens)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("[Auth] getSession →", session?.user?.email ?? "null", error);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to future auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] onAuthStateChange →", event, session?.user?.email ?? "null");
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    if (!authEnabled) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/create",
      },
    });
  }

  async function signOut() {
    if (!authEnabled) return;
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
