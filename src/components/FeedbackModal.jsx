import { useState } from "react";
import { trackEvent } from "../utils/analytics";

export default function FeedbackModal({ puzzleTitle, grade, wasRevealed, onClose }) {
  const [step, setStep] = useState("rating"); // "rating" | "followup" | "thanks"
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [wouldPay, setWouldPay] = useState(null);

  async function submitRating() {
    if (stars === 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          puzzleTitle,
          grade,
          stars,
          comment: comment.trim(),
          wasRevealed,
          wouldPay: null,
          date: new Date().toISOString(),
        }),
      });
    } catch { /* non-blocking */ }
    setSubmitting(false);
    setStep("followup");
  }

  async function submitFollowup(answer) {
    setWouldPay(answer);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          puzzleTitle,
          grade,
          stars,
          comment: comment.trim(),
          wasRevealed,
          wouldPay: answer,
          date: new Date().toISOString(),
        }),
      });
    } catch { /* non-blocking */ }
    trackEvent("feedback_submitted", {
      stars,
      would_pay:   answer,
      grade_level: grade,
      was_revealed: wasRevealed,
    });
    setStep("thanks");
  }

  const starLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Close button */}
        <button onClick={onClose} style={closeBtn} aria-label="Close">✕</button>

        {step === "rating" && (
          <>
            <div style={bookIcon}>📖</div>
            <h2 style={heading}>How was your puzzle?</h2>
            <p style={sub}>Rate your StoryClue experience</p>

            {/* Stars */}
            <div style={starRow} role="group" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  style={{
                    ...starBtn,
                    color: n <= (hovered || stars) ? "#8A7A30" : "#ccc",
                    transform: n <= (hovered || stars) ? "scale(1.2)" : "scale(1)",
                  }}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setStars(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
            {(hovered || stars) > 0 && (
              <p style={starLabel}>{starLabels[hovered || stars]}</p>
            )}

            {/* Comment */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 200))}
              placeholder="Any comments? (optional)"
              style={textarea}
              rows={3}
            />
            <div style={charCount}>{comment.length}/200</div>

            <button
              onClick={submitRating}
              disabled={stars === 0 || submitting}
              style={{ ...submitButton, opacity: stars === 0 ? 0.5 : 1 }}
            >
              {submitting ? "Sending…" : "Submit Feedback"}
            </button>
          </>
        )}

        {step === "followup" && (
          <>
            <div style={bookIcon}>💡</div>
            <h2 style={heading}>One quick question</h2>
            <p style={followupQ}>
              Would you pay for unlimited puzzles?
            </p>
            <div style={buttonRow}>
              <button onClick={() => submitFollowup(true)} style={yesBtn}>
                👍 Yes
              </button>
              <button onClick={() => submitFollowup(false)} style={noBtn}>
                👎 No
              </button>
            </div>
          </>
        )}

        {step === "thanks" && (
          <>
            <div style={bookIcon}>🌟</div>
            <h2 style={heading}>Thank you!</h2>
            <p style={sub}>Your feedback helps us make StoryClue better for every reader.</p>
            <button onClick={onClose} style={submitButton}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9999, padding: "1rem",
};

const modal = {
  background: "#FDFAF4", borderRadius: "16px", padding: "2rem 2.5rem 2.5rem",
  maxWidth: "420px", width: "100%", textAlign: "center",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  position: "relative", fontFamily: "Lora, Georgia, serif",
};

const closeBtn = {
  position: "absolute", top: "1rem", right: "1rem",
  background: "none", border: "none", fontSize: "1.1rem",
  cursor: "pointer", color: "#888", lineHeight: 1,
};

const bookIcon = { fontSize: "2.5rem", marginBottom: "0.5rem" };

const heading = {
  color: "#2D5A1A", fontSize: "1.4rem", fontWeight: 700,
  margin: "0 0 0.3rem",
};

const sub = {
  color: "#666", fontSize: "0.9rem", margin: "0 0 1.2rem",
};

const starRow = {
  display: "flex", justifyContent: "center", gap: "0.4rem",
  margin: "0 0 0.3rem",
};

const starBtn = {
  background: "none", border: "none", fontSize: "2.2rem",
  cursor: "pointer", padding: "0 0.1rem",
  transition: "transform 0.1s, color 0.1s",
  lineHeight: 1,
};

const starLabel = {
  color: "#8A7A30", fontSize: "0.85rem", fontWeight: 600,
  margin: "0 0 1rem", height: "1.2em",
};

const textarea = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid #ddd", borderRadius: "8px",
  padding: "0.6rem 0.75rem", fontSize: "0.9rem",
  fontFamily: "Lora, Georgia, serif", resize: "vertical",
  background: "#fff", color: "#333", marginBottom: "0.2rem",
};

const charCount = {
  textAlign: "right", fontSize: "0.75rem", color: "#999",
  marginBottom: "1.2rem",
};

const submitButton = {
  background: "#2D5A1A", color: "#fff",
  border: "none", borderRadius: "8px",
  padding: "0.7rem 2rem", fontSize: "1rem",
  fontWeight: 600, cursor: "pointer",
  fontFamily: "Lora, Georgia, serif",
  transition: "background 0.2s",
};

const followupQ = {
  fontSize: "1.1rem", color: "#333",
  margin: "0.5rem 0 1.8rem", lineHeight: 1.5,
};

const buttonRow = {
  display: "flex", gap: "1rem", justifyContent: "center",
};

const yesBtn = {
  background: "#2D5A1A", color: "#fff",
  border: "none", borderRadius: "8px",
  padding: "0.7rem 1.8rem", fontSize: "1rem",
  fontWeight: 600, cursor: "pointer",
  fontFamily: "Lora, Georgia, serif",
};

const noBtn = {
  background: "#fff", color: "#2D5A1A",
  border: "2px solid #2D5A1A", borderRadius: "8px",
  padding: "0.7rem 1.8rem", fontSize: "1rem",
  fontWeight: 600, cursor: "pointer",
  fontFamily: "Lora, Georgia, serif",
};
