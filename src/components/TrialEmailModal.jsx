import { useState } from "react";
import { saveTrialEmail } from "../utils/trialManager";

export default function TrialEmailModal({ onClose, onSave }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      await saveTrialEmail(email);
      onSave?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#faf7f0",
        padding: "32px 24px",
        borderRadius: "8px",
        maxWidth: "400px",
        width: "90%",
        fontFamily: "Georgia, serif",
      }}>
        <h2 style={{ color: "#2D5A1A", marginBottom: "12px", fontSize: "20px" }}>
          🎁 Get 15 Extra Days Free
        </h2>
        <p style={{ color: "#5a4a28", marginBottom: "24px", fontSize: "14px", lineHeight: "1.6" }}>
          Your free trial ends soon. Enter your email to unlock 15 more days of free puzzles—no credit card needed.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="your@email.com"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d0d0d0",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
              marginBottom: "12px",
              fontFamily: "inherit",
            }}
          />
          {error && <p style={{ color: "#c33", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                background: "#e0d8c8",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            >
              Maybe Later
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px",
                background: "#2D5A1A",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "inherit",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Saving..." : "Get 15 Days"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
