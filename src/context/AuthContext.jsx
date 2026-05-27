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

    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to future auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
