import { useState } from "react";
import { setUpgradeIntent, extendGrace, getDaysRemaining, isTrialOver, isInGrace } from "../utils/trial";
import { supabase } from "../utils/supabase";
import { useAuth } from "../context/AuthContext";

// ── UpgradeModal ──────────────────────────────────────────────────────────────
// Shown at day 30 (or when "See Founding Member Rates" is clicked).
// Two plan options + "Not ready yet" grace extension.
// Stores upgrade intent to localStorage + Supabase (no Stripe yet).
// When Stripe is connected: replace the handleSelect() body with a
// Stripe Checkout redirect — everything else stays the same.

const PLANS = [
  {
    id:          "family-founding",
    label:       "Family Plan",
    emoji:       "👨‍👩‍👧‍👦",
    price:       "$9.99",
    period:      "/month",
    normalPrice: "$14.99",
    savings:     "Save 33%",
    perks: [
      "Unlimited puzzles for your whole family",
      "All grade levels K–12",
      "Songs & phonics modes",
      "Print student worksheets",
      "Price locked forever — never increases",
    ],
    highlight: true,
  },
  {
    id:          "single-founding",
    label:       "Single User",
    emoji:       "📚",
    price:       "$4.99",
    period:      "/month",
    normalPrice: "$7.99",
    savings:     "Save 38%",
    perks: [
      "Unlimited puzzles",
      "All grade levels K–12",
      "All puzzle modes",
      "Print student worksheets",
      "Price locked forever — never increases",
    ],
    highlight: false,
  },
];

export default function UpgradeModal({ onClose, forced = false }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null); // plan id
  const [step, setStep]         = useState("plans"); // "plans" | "intent-saved"

  const daysLeft = getDaysRemaining();
  const isOver   = isTrialOver();
  const inGrace  = isInGrace();

  async function handleSelect(planId) {
    setSelected(planId);
    const intent = setUpgradeIntent(planId);

    // Sync to Supabase profiles table (no-op if auth not configured)
    if (supabase && user) {
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          upgrade_intent: intent,
        }, { onConflict: "id" });
      } catch { /* non-blocking */ }
    }

    setStep("intent-saved");
    // TODO (Stripe phase): replace the above with:
    // window.location.href = await createCheckoutSession(planId, user?.id);
  }

  function handleNotReady() {
    extendGrace();
    onClose();
  }

  return (
    <div style={overlay}>
      <div style={modal}>

        {/* Close — only shown when not forced (trial not yet over) */}
        {!forced && (
          <button onClick={onClose} style={closeBtn} aria-label="Close">✕</button>
        )}

        {step === "plans" && (
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: "6px" }}>🕷️</div>
              <h2 style={heading}>
                {isOver || inGrace
                  ? "Keep StoryClue going"
                  : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left in your trial`}
              </h2>
              <p style={sub}>
                Founding members who upgrade now lock in{" "}
                <strong style={{ color: "#2d4a18" }}>this rate forever</strong> — as long as you stay subscribed.
              </p>
            </div>

            {/* Plan cards */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "1.2rem", flexWrap: "wrap" }}>
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  style={{
                    flex: 1, minWidth: "200px",
                    border: plan.highlight ? "2px solid #2d4a18" : "2px solid #ddd",
                    borderRadius: "12px", padding: "16px",
                    background: plan.highlight ? "#f0f8e8" : "#fafafa",
                    position: "relative",
                  }}
                >
                  {plan.highlight && (
                    <div style={mostPopular}>Most Popular</div>
                  )}
                  <div style={{ fontSize: "1.6rem", marginBottom: "4px" }}>{plan.emoji}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "15px", color: "#2d4a18", marginBottom: "4px" }}>
                    {plan.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "2px" }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "22px", color: "#2d4a18" }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: "12px", color: "#666" }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#888", textDecoration: "line-through", marginBottom: "2px" }}>
                    normally {plan.normalPrice}/month
                  </div>
                  <div style={{ fontSize: "11px", color: "#2d8a40", fontWeight: 700, marginBottom: "12px" }}>
                    ✓ {plan.savings} — founding member rate
                  </div>
                  <ul style={{ margin: "0 0 14px", padding: "0 0 0 14px", fontSize: "12px", color: "#444", lineHeight: 1.7 }}>
                    {plan.perks.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                  <button
                    onClick={() => handleSelect(plan.id)}
                    style={{
                      width: "100%", padding: "9px",
                      background: plan.highlight ? "#2d4a18" : "#fff",
                      color: plan.highlight ? "#f0ead8" : "#2d4a18",
                      border: `2px solid #2d4a18`,
                      borderRadius: "7px",
                      fontFamily: "'Playfair Display', serif", fontWeight: 700,
                      fontSize: "13px", cursor: "pointer",
                    }}
                  >
                    Choose {plan.label}
                  </button>
                </div>
              ))}
            </div>

            {/* Not ready yet */}
            {!isOver && (
              <div style={{ textAlign: "center" }}>
                <button onClick={handleNotReady} style={notReadyBtn}>
                  Not ready yet — give me 7 more days
                </button>
              </div>
            )}

            <p style={{ textAlign: "center", fontSize: "11px", color: "#999", marginTop: "12px", fontStyle: "italic" }}>
              Payment processing coming soon — selecting a plan reserves your founding member rate.
            </p>
          </>
        )}

        {step === "intent-saved" && (
          <>
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🌟</div>
              <h2 style={heading}>You're on the list!</h2>
              <p style={sub}>
                Your founding member rate is reserved. We'll notify you at{" "}
                <strong>{user?.email || "your email"}</strong> when payment is ready.
              </p>
              <p style={{ ...sub, marginTop: "8px" }}>
                Keep enjoying StoryClue — nothing changes until billing goes live.
              </p>
              <button onClick={onClose} style={doneBtn}>
                Keep Building Puzzles
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9500, padding: "1rem",
};

const modal = {
  background: "#FDFAF4", borderRadius: "16px",
  padding: "2rem 2rem 1.5rem",
  maxWidth: "520px", width: "100%",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  position: "relative",
  fontFamily: "Lora, Georgia, serif",
  maxHeight: "90vh", overflowY: "auto",
};

const closeBtn = {
  position: "absolute", top: "1rem", right: "1rem",
  background: "none", border: "none", fontSize: "1.1rem",
  cursor: "pointer", color: "#888", lineHeight: 1,
};

const heading = {
  fontFamily: "'Playfair Display', serif",
  fontWeight: 900, fontSize: "1.4rem",
  color: "#2d4a18", margin: "0 0 0.4rem",
};

const sub = {
  fontSize: "13px", color: "#555",
  margin: "0 0 0.5rem", lineHeight: 1.55,
};

const mostPopular = {
  position: "absolute", top: "-10px", left: "50%",
  transform: "translateX(-50%)",
  background: "#2d4a18", color: "#f0ead8",
  fontSize: "10px", fontWeight: 700,
  padding: "2px 10px", borderRadius: "10px",
  fontFamily: "'Playfair Display', serif",
  whiteSpace: "nowrap",
};

const notReadyBtn = {
  background: "none", border: "none",
  fontFamily: "Lora, Georgia, serif",
  fontSize: "12px", color: "#888",
  cursor: "pointer", textDecoration: "underline",
  padding: "4px",
};

const doneBtn = {
  marginTop: "1.2rem",
  background: "#2d4a18", color: "#f0ead8",
  border: "none", borderRadius: "8px",
  padding: "10px 28px", fontSize: "14px",
  fontFamily: "'Playfair Display', serif", fontWeight: 700,
  cursor: "pointer",
};
