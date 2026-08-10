import { useState } from "react";
import CitizenshipQuizMode from "./CitizenshipQuizMode";

export default function CitizenshipPrep() {
  const [language, setLanguage] = useState("english");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareLink = `${window.location.origin}/citizenship-prep?lang=${language}&ref=pastor`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const emailTemplateSpanish = `Asunto: Ayuda para Pasar el Examen de Ciudadanía

Hermanos y hermanas,

Si se están preparando para el examen de Ciudadanía de EE.UU., tenemos un recurso gratuito para ustedes.

StoryClue Citizenship Test Prep - aprenda en español, practique en inglés, apruebe su examen.

${shareLink}

¿Preguntas? Pregúntenle a su pastor/pastora.`;

  const emailTemplateEnglish = `Subject: Help Passing the U.S. Citizenship Test

Friends,

If you're preparing for your U.S. Citizenship test, we have a free resource for you.

StoryClue Citizenship Test Prep - Study in your language, practice English, pass your test.

${shareLink}

Questions? Ask your pastor.`;

  return (
    <div>
      {/* Header with Language & Share */}
      <div style={{
        background: "#f4efe4",
        borderBottom: "1.5px solid #c8b888",
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          fontFamily: "'Playfair Display',serif",
          fontWeight: 900,
          fontSize: "18px",
          color: "#2d4a18"
        }}>
          🇺🇸 Citizenship Prep
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1.5px solid #c8b888",
              borderRadius: "6px",
              fontFamily: "Lora,serif",
              fontSize: "13px",
              background: "white",
              cursor: "pointer",
              color: "#2c1a08"
            }}
          >
            <option value="english">🇺🇸 English</option>
            <option value="spanish">🇪🇸 Spanish</option>
            <option value="french">🇫🇷 French</option>
            <option value="german">🇩🇪 German</option>
            <option value="portuguese">🇵🇹 Portuguese</option>
            <option value="italian">🇮🇹 Italian</option>
            <option value="mandarin">🇨🇳 Mandarin</option>
            <option value="japanese">🇯🇵 Japanese</option>
            <option value="korean">🇰🇷 Korean</option>
          </select>

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            style={{
              padding: "8px 14px",
              background: "#3a6a1a",
              color: "#f0ead8",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontFamily: "Lora,serif",
              fontSize: "13px",
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}
          >
            📤 Share with Church
          </button>
        </div>
      </div>

      {/* Main Content */}
      <CitizenshipQuizMode language={language} />

      {/* Share Modal */}
      {showShareModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "12px"
        }}>
          <div style={{
            background: "#fdfaf4",
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "500px",
            boxShadow: "0 28px 90px rgba(0,0,0,.45)"
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 900,
              color: "#2D5A1A",
              fontSize: "1.3rem",
              margin: "0 0 20px"
            }}>
              Share with Your Congregation
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "24px"
            }}>
              {/* Email Template Spanish */}
              <button
                onClick={() => {
                  const mailto = `mailto:?subject=${encodeURIComponent("Ayuda para Pasar el Examen de Ciudadanía")}&body=${encodeURIComponent(emailTemplateSpanish)}`;
                  window.location.href = mailto;
                }}
                style={{
                  padding: "14px",
                  background: "#e8f4d8",
                  border: "1.5px solid #4a8a2a",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontFamily: "Lora,serif",
                  color: "#2c1a08",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.background = "#d4e8c8"}
                onMouseLeave={(e) => e.target.style.background = "#e8f4d8"}
              >
                📧 Email<br/><span style={{ fontSize: "12px", fontWeight: 400 }}>Spanish Template</span>
              </button>

              {/* Email Template English */}
              <button
                onClick={() => {
                  const mailto = `mailto:?subject=${encodeURIComponent("Help Passing the U.S. Citizenship Test")}&body=${encodeURIComponent(emailTemplateEnglish)}`;
                  window.location.href = mailto;
                }}
                style={{
                  padding: "14px",
                  background: "#e8f4d8",
                  border: "1.5px solid #4a8a2a",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontFamily: "Lora,serif",
                  color: "#2c1a08",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.background = "#d4e8c8"}
                onMouseLeave={(e) => e.target.style.background = "#e8f4d8"}
              >
                📧 Email<br/><span style={{ fontSize: "12px", fontWeight: 400 }}>English Template</span>
              </button>
            </div>

            {/* Copy Link */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontFamily: "Lora,serif",
                fontSize: "12px",
                color: "#8a7a50",
                marginBottom: "8px",
                fontWeight: 600
              }}>
                Or copy this link:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: "8px" }}>
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  style={{
                    padding: "10px 12px",
                    border: "1.5px solid #c8b888",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    background: "#fffef5",
                    color: "#2c1a08"
                  }}
                />
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: "10px",
                    background: copied ? "#4a8a2a" : "#3a6a1a",
                    color: "#f0ead8",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontFamily: "Lora,serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* WhatsApp Share */}
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={() => {
                  const text = encodeURIComponent(`Help passing the U.S. Citizenship test: ${shareLink}`);
                  window.open(`https://wa.me/?text=${text}`, "_blank");
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#25D366",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontFamily: "Lora,serif",
                  fontSize: "14px",
                  fontWeight: 600
                }}
              >
                💬 Share via WhatsApp
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#c8b888",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "Lora,serif",
                fontSize: "14px",
                fontWeight: 600
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
