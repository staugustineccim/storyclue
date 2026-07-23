export default function TranscriptionModal() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "12px",
    }}>
      <div style={{
        background: "#fdfaf4", borderRadius: "16px",
        padding: "40px 32px", textAlign: "center",
        maxWidth: "400px", boxShadow: "0 28px 90px rgba(0,0,0,.45)",
      }}>
        {/* Animated microphone icon */}
        <div style={{
          fontSize: "48px", marginBottom: "20px",
          animation: "pulse 1.5s ease-in-out infinite",
        }}>
          🎤
        </div>

        <h2 style={{
          fontFamily: "'Playfair Display',serif", fontWeight: 900,
          color: "#2D5A1A", fontSize: "1.4rem",
          margin: "0 0 8px", letterSpacing: "0.5px",
        }}>
          Transcribing Video
        </h2>

        <p style={{
          fontFamily: "Lora,serif", fontSize: "14px",
          color: "#5a4a28", lineHeight: 1.6,
          margin: "0 0 16px",
        }}>
          Analyzing sermon to extract main teaching points...
        </p>

        <div style={{
          display: "flex", gap: "4px", justifyContent: "center",
          marginBottom: "8px",
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "8px", height: "40px",
                background: "#2D5A1A", borderRadius: "4px",
                animation: `wave 1.2s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>

        <p style={{
          fontFamily: "Lora,serif", fontSize: "12px",
          color: "#8a7a50", margin: 0,
          fontStyle: "italic",
        }}>
          This may take a minute...
        </p>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes wave {
            0%, 100% { height: 20px; }
            50% { height: 40px; }
          }
        `}</style>
      </div>
    </div>
  );
}
