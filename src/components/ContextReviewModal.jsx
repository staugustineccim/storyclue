import { useState } from "react";

/**
 * ContextReviewModal — Sermon Context Review
 *
 * Props:
 *   words      — [{ answer, sourceQuote }]  words with their sermon source quotes
 *   grade      — grade string
 *   onClose    — function
 */
export default function ContextReviewModal({ words, grade, onClose }) {
  const [index, setIndex] = useState(0);
  const isEarlyLearner = ["k","1","2"].includes(String(grade));
  const isLower = ["k","1","2","3","4","5"].includes(String(grade));

  // Filter to only words that have a source quote
  const wordsWithContext = words.filter(w => w.sourceQuote);
  const current = wordsWithContext[index];
  const total   = wordsWithContext.length;

  // Highlight the word in the sentence (it's already written ALL CAPS in the sentence)
  function renderSentence(sentence, word) {
    if (!sentence || !word) return sentence;
    const parts = sentence.split(new RegExp(`(${word})`, "g"));
    return parts.map((part, i) =>
      part === word
        ? (
          <strong key={i} style={{
            color:"#1b5e20",
            fontSize: isEarlyLearner ? "1.25em" : "1.05em",
            background:"#e8f5e9",
            padding:"0 4px", borderRadius:"4px",
          }}>
            {part}
          </strong>
        )
        : <span key={i}>{part}</span>
    );
  }

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,.65)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:9600, padding:"12px",
    }}>
      <div style={{
        background:"#fdfaf4", borderRadius:"16px",
        padding:"24px 22px",
        maxWidth:"480px", width:"100%",
        maxHeight:"90vh", overflowY:"auto",
        fontFamily:"Georgia,serif",
        boxShadow:"0 28px 90px rgba(0,0,0,.45)",
      }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"18px" }}>
          <div style={{ fontSize: isEarlyLearner ? "2.5rem" : "2rem", marginBottom:"8px" }}>📖</div>
          <h2 style={{
            fontFamily:"'Playfair Display',serif", fontWeight:900,
            color:"#2D5A1A",
            fontSize: isEarlyLearner ? "1.5rem" : "1.35rem",
            margin:"0 0 4px",
          }}>
            {isEarlyLearner ? "Words in Action! 🌟" : isLower ? "Words in Context" : "Vocabulary in Context"}
          </h2>
          <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#8a7a50" }}>
            Word {index + 1} of {total}
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:"5px", marginBottom:"20px", flexWrap:"wrap" }}>
          {wordsWithContext.map((_, i) => (
            <div key={i} style={{
              width:"8px", height:"8px", borderRadius:"50%",
              background: i < index ? "#4caf50" : i === index ? "#2D5A1A" : "#e0d8c8",
              transition:"background .25s",
            }}/>
          ))}
        </div>

        {/* Word */}
        <div style={{
          textAlign:"center",
          fontFamily:"'Playfair Display',serif", fontWeight:900,
          fontSize: isEarlyLearner ? "2.4rem" : "2rem",
          color:"#2D5A1A", letterSpacing:"4px",
          marginBottom:"16px",
        }}>
          {current?.answer}
        </div>

        {/* Sermon quote */}
        <div style={{
          background:"#f4efe4", borderRadius:"12px",
          padding:"18px 16px", marginBottom:"22px",
          fontFamily:"Lora,serif",
          fontSize: isEarlyLearner ? "1.15rem" : "1rem",
          lineHeight:"1.75", color:"#2c1a08",
          textAlign:"center",
          fontStyle:"italic",
        }}>
          "{current?.sourceQuote}"
        </div>

        {/* Navigation */}
        <div style={{ display:"flex", gap:"10px" }}>
          {index > 0 && (
            <button
              onClick={() => setIndex(i => i - 1)}
              style={{
                flex:1, padding:"11px",
                background:"transparent", border:"2px solid #c8b888",
                borderRadius:"8px",
                fontFamily:"Lora,serif", fontWeight:600, fontSize:"13px",
                cursor:"pointer", color:"#4a3a18",
              }}
            >
              ← Back
            </button>
          )}
          {index < total - 1 ? (
            <button
              onClick={() => setIndex(i => i + 1)}
              style={{
                flex:1, padding:"12px",
                background:"#2D5A1A", color:"#f0ead8",
                border:"none", borderRadius:"8px",
                fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize: isEarlyLearner ? "15px" : "14px",
                cursor:"pointer", boxShadow:"2px 2px 0 #1a3a0a",
              }}
            >
              {isEarlyLearner ? "Next Word! →" : "Next →"}
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                flex:1, padding:"12px",
                background:"#2D5A1A", color:"#f0ead8",
                border:"none", borderRadius:"8px",
                fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize: isEarlyLearner ? "15px" : "14px",
                cursor:"pointer", boxShadow:"2px 2px 0 #1a3a0a",
              }}
            >
              {isEarlyLearner ? "All done! 🌟" : "Done ✓"}
            </button>
          )}
        </div>

        {/* Skip */}
        <button
          onClick={onClose}
          style={{
            width:"100%", marginTop:"10px",
            background:"none", border:"none",
            color:"#bbb", fontFamily:"Lora,serif", fontSize:"0.85rem",
            cursor:"pointer", textDecoration:"underline",
          }}
        >
          {index < total - 1 ? "Skip all" : "Close"}
        </button>
      </div>
    </div>
  );
}
