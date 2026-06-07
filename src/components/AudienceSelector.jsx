/**
 * AudienceSelector
 *
 * First screen shown to new visitors at /create. Displays four large
 * audience cards. Chosen audience is saved in a 90-day cookie and the
 * user is never shown this screen again (until they click "Change Audience").
 *
 * Audiences:
 *   early-learner  → Grades K, 1st, 2nd
 *   elementary     → Grades 3rd, 4th, 5th
 *   middle-high    → Grades 6th–12th
 *   adult          → Adult / Reader Mode
 */

const G  = "#2D5A1A";
const P  = "#F4EFE4";
const D  = "#2c1a08";

const CARDS = [
  {
    id:        "early-learner",
    icon:      "🐣",
    title:     "Early Learners",
    subtitle:  "Grades K, 1st & 2nd",
    desc:      "Big colorful grids with pictures and phonics clues. Designed for little hands and new readers.",
    pills:     ["Picture Mode", "Phonics Clues", "Audio Read-Aloud", "Celebration Sounds"],
    accent:    "#e91e63",
    bg:        "#fff0f4",
    border:    "#f48fb1",
  },
  {
    id:        "elementary",
    icon:      "📚",
    title:     "Elementary",
    subtitle:  "Grades 3rd, 4th & 5th",
    desc:      "Story-connected vocabulary crosswords for independent readers. Perfect for homeschool and classroom.",
    pills:     ["Grade-Level Clues", "Series Mode", "Print Worksheets", "Share Links"],
    accent:    "#1565c0",
    bg:        "#f0f4ff",
    border:    "#90caf9",
  },
  {
    id:        "middle-high",
    icon:      "🎒",
    title:     "Middle & High School",
    subtitle:  "Grades 6th through 12th",
    desc:      "Analytical clues, rigorous vocabulary, and clean professional puzzles for older students.",
    pills:     ["AP-Level Clues", "Series Mode", "All Input Methods", "PDF Upload"],
    accent:    "#1a237e",
    bg:        "#f0f2ff",
    border:    "#7986cb",
  },
  {
    id:        "adult",
    icon:      "📖",
    title:     "Adult & Seniors",
    subtitle:  "Adult Reader Mode",
    desc:      "Large, minimal puzzles built from books you're reading. Loved by book clubs, faith communities, and seniors.",
    pills:     ["Reader Mode", "Faith Traditions", "Series Mode", "Shareable Links"],
    accent:    "#4a7a22",
    bg:        "#f1f8e9",
    border:    "#a5d6a7",
  },
];

export default function AudienceSelector({ onSelect }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: P,
      fontFamily: "Georgia, serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .aud-card{
          flex:1; min-width:220px; max-width:320px;
          border-radius:16px; padding:28px 24px;
          cursor:pointer;
          transition:transform .15s, box-shadow .15s;
          border:2px solid transparent;
        }
        .aud-card:hover{
          transform:translateY(-4px);
          box-shadow:0 12px 32px rgba(0,0,0,.14);
        }
        .aud-pill{
          display:inline-block; padding:4px 10px; border-radius:20px;
          font-family:Lora,serif; font-size:11px; margin:3px 3px 0 0;
          font-weight:600;
        }
        @media(max-width:600px){
          .aud-card{min-width:100%;max-width:100%}
          .aud-grid{flex-direction:column!important}
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: G,
        padding: "18px 24px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderBottom: "2px solid #8A7A30",
      }}>
        <img src="/icon-192.png" alt="StoryClue" style={{ width:"30px", height:"30px", borderRadius:"7px" }} />
        <span style={{
          fontFamily: "'Playfair Display',serif",
          fontWeight: 900,
          fontSize: "20px",
          color: P,
          flex: 1,
        }}>StoryClue</span>
      </div>

      {/* ── Body ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}>
        <img src="/icon-192.png" alt="StoryClue" style={{ width:"80px", height:"80px", borderRadius:"18px", marginBottom:"12px", boxShadow:"0 4px 20px rgba(0,0,0,.2)" }} />
        <h1 style={{
          fontFamily: "'Playfair Display',serif",
          fontWeight: 900,
          fontSize: "clamp(22px,4vw,36px)",
          color: D,
          textAlign: "center",
          marginBottom: "10px",
          lineHeight: 1.2,
        }}>
          Who are you creating a puzzle for?
        </h1>
        <p style={{
          fontFamily: "Lora, serif",
          fontSize: "16px",
          color: "#5a4a28",
          textAlign: "center",
          marginBottom: "40px",
          maxWidth: "520px",
        }}>
          StoryClue tailors the puzzle experience to your audience — grid size, clue voice, and features all adjust automatically.
        </p>

        <div className="aud-grid" style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          maxWidth: "1200px",
        }}>
          {CARDS.map(card => (
            <div
              key={card.id}
              className="aud-card"
              style={{
                background: card.bg,
                borderColor: card.border,
              }}
              onClick={() => onSelect(card.id)}
            >
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>{card.icon}</div>
              <h2 style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: "20px",
                color: card.accent,
                marginBottom: "4px",
              }}>{card.title}</h2>
              <div style={{
                fontFamily: "Lora,serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#666",
                marginBottom: "12px",
              }}>{card.subtitle}</div>
              <p style={{
                fontFamily: "Lora,serif",
                fontSize: "14px",
                color: "#4a3a18",
                lineHeight: 1.65,
                marginBottom: "16px",
              }}>{card.desc}</p>
              <div>
                {card.pills.map(p => (
                  <span key={p} className="aud-pill" style={{
                    background: card.accent + "18",
                    color: card.accent,
                    border: `1px solid ${card.accent}44`,
                  }}>{p}</span>
                ))}
              </div>
              <div style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: card.accent,
                color: "#fff",
                borderRadius: "8px",
                textAlign: "center",
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: "14px",
              }}>
                Create {card.title} Puzzle →
              </div>
            </div>
          ))}
        </div>

        <p style={{
          fontFamily: "Lora,serif",
          fontSize: "12px",
          color: "#8a7a5a",
          marginTop: "28px",
          textAlign: "center",
        }}>
          We'll remember your choice for 90 days. You can change it any time.
        </p>
      </div>
    </div>
  );
}
