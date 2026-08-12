export default function TrialExpiredModal({ onClose }) {
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
          Your Free Trial Has Ended
        </h2>
        <p style={{ color: "#5a4a28", marginBottom: "24px", fontSize: "14px", lineHeight: "1.6" }}>
          Upgrade to continue creating and playing puzzles. Just $7.99/month for unlimited puzzles.
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              background: "#e0d8c8",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          >
            Close
          </button>
          <button
            onClick={() => window.location.href = "/pricing"}
            style={{
              flex: 1,
              padding: "12px",
              background: "#2D5A1A",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
