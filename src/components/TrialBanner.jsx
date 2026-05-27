import { useState } from "react";
import { getDaysRemaining, isExpiring, isInGrace, isTrialOver } from "../utils/trial";

// ── TrialBanner ───────────────────────────────────────────────────────────────
// Shown at the top of /create when trial is expiring (day 25+) or in grace.
// Non-blocking, dismissible per session.
// onUpgrade() opens the UpgradeModal.

export default function TrialBanner({ onUpgrade }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const expiring = isExpiring();
  const grace    = isInGrace();
  const over     = isTrialOver();

  if (!expiring && !grace && !over) return null;

  const daysLeft = getDaysRemaining();

  let message, urgency;
  if (over || grace) {
    message = "Your free trial has ended.";
    urgency = "high";
  } else if (daysLeft <= 1) {
    message = "Your free trial ends today.";
    urgency = "high";
  } else {
    message = `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`;
    urgency = daysLeft <= 3 ? "medium" : "low";
  }

  const colors = {
    low:    { bg: "#e8f4d8", border: "#4a8a2a", text: "#2d4a18", btn: "#2d4a18" },
    medium: { bg: "#fff8e8", border: "#d4a020", text: "#7a5000", btn: "#c08000" },
    high:   { bg: "#fff0e8", border: "#c04010", text: "#8a2800", btn: "#c04010" },
  };
  const c = colors[urgency];

  return (
    <div style={{
      background: c.bg, borderBottom: `2px solid ${c.border}`,
      padding: "10px 20px", display: "flex", alignItems: "center",
      gap: "12px", flexWrap: "wrap", position: "relative",
      fontFamily: "Lora, Georgia, serif",
    }}>
      <span style={{ fontSize: "1.1rem" }}>{over || grace ? "⏰" : "🕐"}</span>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <span style={{ fontWeight: 700, color: c.text, fontSize: "13px" }}>
          {message}
        </span>
        {!over && (
          <span style={{ color: c.text, fontSize: "13px", opacity: 0.85 }}>
            {" "}Founding members who upgrade now lock in <strong>40% off forever.</strong>
          </span>
        )}
        {over && (
          <span style={{ color: c.text, fontSize: "13px", opacity: 0.85 }}>
            {" "}Upgrade to keep your puzzles and lock in the founding member rate.
          </span>
        )}
      </div>
      <button
        onClick={onUpgrade}
        style={{
          background: c.btn, color: "#fff", border: "none",
          borderRadius: "6px", padding: "6px 16px",
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
        }}
      >
        See Founding Member Rates
      </button>
      {!over && (
        <button
          onClick={() => setDismissed(true)}
          style={{
            position: "absolute", top: "6px", right: "8px",
            background: "none", border: "none", cursor: "pointer",
            color: c.text, opacity: 0.5, fontSize: "12px", padding: "2px",
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
