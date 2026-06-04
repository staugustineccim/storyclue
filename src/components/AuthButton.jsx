import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { authEnabled } from "../utils/supabase";

// ── AuthButton ────────────────────────────────────────────────────────────────
// Renders in the PuzzleGenerator header (top-right corner).
//
//  · When auth is disabled (no env vars): renders nothing — zero visual change.
//  · When signed out: "Sign in" chip — clicking triggers Google OAuth.
//  · When signed in: user's profile photo (or initials fallback) — clicking
//    opens a small dropdown with name, email, and Sign out option.
//
// The button intentionally stays small and unobtrusive — it must not distract
// from the main puzzle-generation workflow.

export default function AuthButton({ isFirstPuzzle = false }) {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [isNewUser,    setIsNewUser]    = useState(false);
  const [showEmail,    setShowEmail]    = useState(false);   // toggle email/password panel
  const [emailMode,    setEmailMode]    = useState("signin"); // "signin" | "signup"
  const [emailVal,     setEmailVal]     = useState("");
  const [passwordVal,  setPasswordVal]  = useState("");
  const [emailError,   setEmailError]   = useState("");
  const [emailWorking, setEmailWorking] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState("");
  const menuRef = useRef(null);

  // Detect brand-new sign-ins so we can show the founding member welcome
  useEffect(() => {
    if (!user) return;
    const key = "sc_welcomed_" + user.id;
    if (!localStorage.getItem(key)) {
      setIsNewUser(true);
      localStorage.setItem(key, "1");
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Nothing to render when auth is not configured
  if (!authEnabled) return null;
  if (loading)      return null;

  // ── Signed-in state ────────────────────────────────────────────────────────
  if (user) {
    const avatar = user.user_metadata?.avatar_url;
    const name   = user.user_metadata?.full_name || user.email?.split("@")[0] || "You";
    const email  = user.email || "";
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    return (
      <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
        {/* Founding-member welcome toast (auto-dismisses) */}
        {isNewUser && (
          <FoundingWelcome name={name} onDismiss={() => setIsNewUser(false)} />
        )}

        {/* Avatar button */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={avatarBtn}
          title={name}
          aria-label="Account menu"
        >
          {avatar
            ? <img src={avatar} alt="" style={avatarImg} referrerPolicy="no-referrer" />
            : <span style={initialsStyle}>{initials}</span>
          }
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div style={dropdown}>
            <div style={menuHeader}>
              <div style={{ fontWeight: 700, color: "#2d4a18", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
            </div>
            <div style={menuDivider} />
            <button onClick={async () => { setMenuOpen(false); await signOut(); }} style={menuItem}>
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Signed-out state ───────────────────────────────────────────────────────
  async function handleEmailSubmit(e) {
    e.preventDefault();
    setEmailError("");
    setEmailWorking(true);
    const fn = emailMode === "signin" ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(emailVal.trim(), passwordVal);
    setEmailWorking(false);
    if (error) {
      setEmailError(error);
    } else if (emailMode === "signup") {
      setEmailSuccess("Check your email for a confirmation link.");
    }
    // signInWithPassword triggers onAuthStateChange — no navigation needed
  }

  if (showEmail) {
    return (
      <div ref={menuRef} style={{ position:"relative", flexShrink:0 }}>
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, background:"#fff", borderRadius:"12px", boxShadow:"0 4px 24px rgba(0,0,0,.18)", padding:"16px", width:"260px", zIndex:9001, fontFamily:"Lora,Georgia,serif" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", color:"#2d4a18", marginBottom:"12px" }}>
            {emailMode === "signin" ? "Sign in" : "Create account"}
          </div>
          {emailSuccess ? (
            <div style={{ fontSize:"13px", color:"#2d8a40", lineHeight:1.5 }}>{emailSuccess}</div>
          ) : (
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email" placeholder="Email" value={emailVal}
                onChange={e => setEmailVal(e.target.value)} required
                style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #c8b888", borderRadius:"4px", fontFamily:"Lora,serif", fontSize:"13px", marginBottom:"8px", boxSizing:"border-box" }}
              />
              <input
                type="password" placeholder="Password" value={passwordVal}
                onChange={e => setPasswordVal(e.target.value)} required
                style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #c8b888", borderRadius:"4px", fontFamily:"Lora,serif", fontSize:"13px", marginBottom:"8px", boxSizing:"border-box" }}
              />
              {emailError && <div style={{ fontSize:"12px", color:"#c0392b", marginBottom:"6px" }}>{emailError}</div>}
              <button type="submit" disabled={emailWorking} style={{ width:"100%", padding:"8px", background:"#2d4a18", color:"#f0ead8", border:"none", borderRadius:"6px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", cursor:"pointer", marginBottom:"8px" }}>
                {emailWorking ? "…" : emailMode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px" }}>
            <button onClick={() => setEmailMode(m => m === "signin" ? "signup" : "signin")} style={{ background:"none", border:"none", color:"#5a8a2a", cursor:"pointer", fontFamily:"Lora,serif", fontSize:"12px", padding:0 }}>
              {emailMode === "signin" ? "New? Create account" : "Already have account?"}
            </button>
            <button onClick={() => { setShowEmail(false); setEmailError(""); setEmailSuccess(""); }} style={{ background:"none", border:"none", color:"#888", cursor:"pointer", fontFamily:"Lora,serif", fontSize:"12px", padding:0 }}>
              Cancel
            </button>
          </div>
        </div>
        {/* Show the main sign-in button underneath */}
        <button onClick={signInWithGoogle} style={signInBtn} aria-label="Sign in with Google">
          <GoogleIcon />
          <span>Sign in</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={menuRef} style={{ position:"relative", flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" }}>
      <button onClick={signInWithGoogle} style={signInBtn} aria-label="Sign in with Google">
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>
      <button
        onClick={() => setShowEmail(true)}
        style={{ background:"none", border:"none", color:"rgba(240,234,216,.6)", fontFamily:"Lora,serif", fontSize:"11px", cursor:"pointer", padding:"0 4px", whiteSpace:"nowrap" }}
      >
        or email &amp; password
      </button>
    </div>
  );
}

// ── Founding-member welcome toast ─────────────────────────────────────────────
function FoundingWelcome({ name, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const firstName = name.split(" ")[0];

  return (
    <div style={welcomeToast}>
      <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>🌟</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "14px", color: "#2d4a18", marginBottom: "2px" }}>
        Welcome, {firstName}!
      </div>
      <div style={{ fontSize: "12px", color: "#5a6a40", lineHeight: 1.4 }}>
        You're a founding member of StoryClue. Your puzzles are now saved automatically.
      </div>
      <button onClick={onDismiss} style={welcomeClose}>✕</button>
    </div>
  );
}

// ── Google icon (SVG, no external request) ────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const avatarBtn = {
  width: "34px", height: "34px", borderRadius: "50%",
  border: "2px solid rgba(255,255,255,0.5)",
  background: "#3a6a1a", cursor: "pointer", padding: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  overflow: "hidden", flexShrink: 0,
  transition: "border-color 0.15s",
};

const avatarImg = {
  width: "100%", height: "100%", objectFit: "cover",
};

const initialsStyle = {
  fontFamily: "'Playfair Display', serif",
  fontWeight: 700, fontSize: "13px", color: "#f0ead8",
  userSelect: "none",
};

const dropdown = {
  position: "absolute", top: "calc(100% + 8px)", right: 0,
  background: "#fff", borderRadius: "10px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
  minWidth: "190px", zIndex: 9000,
  fontFamily: "Lora, Georgia, serif",
  overflow: "hidden",
};

const menuHeader = {
  padding: "12px 14px 10px",
  maxWidth: "190px",
};

const menuDivider = {
  height: "1px", background: "#eee", margin: "0",
};

const menuItem = {
  display: "block", width: "100%", textAlign: "left",
  padding: "10px 14px", background: "none", border: "none",
  fontFamily: "Lora, Georgia, serif", fontSize: "13px",
  color: "#c0392b", cursor: "pointer",
  transition: "background 0.1s",
};

const signInBtn = {
  display: "flex", alignItems: "center", gap: "6px",
  background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "20px",
  padding: "5px 12px 5px 8px", cursor: "pointer",
  fontFamily: "Lora, Georgia, serif", fontSize: "12px",
  fontWeight: 600, color: "#333",
  flexShrink: 0,
  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  transition: "background 0.15s",
};

const welcomeToast = {
  position: "absolute", top: "calc(100% + 10px)", right: 0,
  background: "#FDFAF4", border: "2px solid #4a8a2a", borderRadius: "12px",
  padding: "14px 36px 14px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  width: "220px", zIndex: 9001,
  fontFamily: "Lora, Georgia, serif",
  textAlign: "center",
};

const welcomeClose = {
  position: "absolute", top: "8px", right: "8px",
  background: "none", border: "none", cursor: "pointer",
  color: "#999", fontSize: "12px", lineHeight: 1, padding: "2px",
};
