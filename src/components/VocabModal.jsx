import { useState, useRef, useEffect } from "react";

const SPEED_MS   = { slow: 8000, normal: 5000, fast: 3000 };
const STUDY_SECS = 45;

/**
 * VocabModal — Vocabulary Study Mode
 *
 * Props:
 *   words            — array of word objects with .answer and .clue
 *   continueAvailable — boolean: true = first reveal (Continue shown), false = 2nd+ reveal (only Restart)
 *   onContinue       — called when student clicks Continue (close modal, keep filled grid)
 *   onRestart        — called when student clicks Restart (close modal, wipe grid)
 *   readerMode       — boolean: no timer, no restrictions, just a browsable word list
 */
export default function VocabModal({ words, continueAvailable, onContinue, onRestart, readerMode = false }) {
  const [phase,     setPhase]     = useState("setup");   // "setup" | "cards"
  const [speed,     setSpeed]     = useState("normal");
  const [cardIndex, setCardIndex] = useState(0);
  const [elapsed,   setElapsed]   = useState(0);         // seconds, 0–45
  const [studyDone, setStudyDone] = useState(readerMode); // reader mode is always "done"

  const autoRef  = useRef(null);  // auto-advance timeout
  const studyRef = useRef(null);  // 45s interval

  // Clean up all timers on unmount
  useEffect(() => () => {
    clearTimeout(autoRef.current);
    clearInterval(studyRef.current);
  }, []);

  // Auto-advance card — resets whenever cardIndex or speed changes while in cards phase
  useEffect(() => {
    if (phase !== "cards") return;
    clearTimeout(autoRef.current);
    autoRef.current = setTimeout(advance, SPEED_MS[speed]);
    return () => clearTimeout(autoRef.current);
  }, [phase, cardIndex, speed]); // eslint-disable-line react-hooks/exhaustive-deps

  function beginStudy() {
    setPhase("cards");
    setCardIndex(0);
    setElapsed(0);
    if (!readerMode) {
      studyRef.current = setInterval(() => {
        setElapsed(e => {
          const next = e + 1;
          if (next >= STUDY_SECS) {
            clearInterval(studyRef.current);
            setStudyDone(true);
            return STUDY_SECS;
          }
          return next;
        });
      }, 1000);
    }
  }

  function advance() {
    clearTimeout(autoRef.current);
    setCardIndex(i => (i + 1) % words.length);
  }

  function handleContinue() {
    clearTimeout(autoRef.current);
    clearInterval(studyRef.current);
    onContinue();
  }

  function handleRestart() {
    clearTimeout(autoRef.current);
    clearInterval(studyRef.current);
    onRestart();
  }

  const word    = words[cardIndex] || words[0];
  const pct     = Math.min(100, (elapsed / STUDY_SECS) * 100);
  const unlocked = studyDone || readerMode;

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,.65)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:9500, padding:"12px",
    }}>
      <div style={{
        background:"#fdfaf4", borderRadius:"16px",
        padding:"24px 22px",
        maxWidth:"440px", width:"100%",
        maxHeight:"92vh", overflowY:"auto",
        fontFamily:"Georgia,serif",
        boxShadow:"0 28px 90px rgba(0,0,0,.45)",
      }}>

        {/* ── SETUP PHASE ─────────────────────────────────────────────── */}
        {phase === "setup" && (
          <>
            <div style={{ textAlign:"center", marginBottom:"20px" }}>
              <div style={{ fontSize:"2.2rem", marginBottom:"8px" }}>📚</div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, color:"#2D5A1A", fontSize:"1.4rem", margin:"0 0 10px" }}>
                {readerMode ? "Word List" : "Vocabulary Study"}
              </h2>
              <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#6a5a30", lineHeight:1.65, margin:0 }}>
                {readerMode
                  ? `Browse all ${words.length} words from this puzzle.`
                  : `Review all ${words.length} vocabulary words from this puzzle.\nA 45‑second minimum study timer runs while you go through the cards.`}
              </p>
            </div>

            {/* Speed selector — K-12 only */}
            {!readerMode && (
              <div style={{ marginBottom:"20px" }}>
                <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#6a5a30", textAlign:"center", marginBottom:"8px", letterSpacing:"0.3px" }}>
                  Study Speed
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  {[
                    ["slow",   "Slow",   "8 sec/card"],
                    ["normal", "Normal", "5 sec/card"],
                    ["fast",   "Fast",   "3 sec/card"],
                  ].map(([key, label, sub]) => (
                    <button
                      key={key}
                      onClick={() => setSpeed(key)}
                      style={{
                        flex:1, padding:"10px 6px",
                        border:`2px solid ${speed === key ? "#2D5A1A" : "#c8b888"}`,
                        borderRadius:"8px",
                        background: speed === key ? "#e8f0d8" : "#fffef5",
                        cursor:"pointer", transition:"all .15s",
                      }}
                    >
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color: speed === key ? "#2D5A1A" : "#4a3a18", fontSize:"13px" }}>
                        {label}
                      </div>
                      <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#8a7a50", marginTop:"3px" }}>
                        {sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={beginStudy}
              style={{
                width:"100%", padding:"13px",
                background:"#2D5A1A", color:"#f0ead8",
                border:"none", borderRadius:"8px",
                fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:"15px", letterSpacing:"0.5px", cursor:"pointer",
                boxShadow:"2px 2px 0 #1a3a0a",
              }}
            >
              {readerMode ? "Browse Words →" : "Begin Study →"}
            </button>
          </>
        )}

        {/* ── CARDS PHASE ─────────────────────────────────────────────── */}
        {phase === "cards" && (
          <>
            {/* Card position indicator */}
            <div style={{ textAlign:"center", fontFamily:"Lora,serif", fontSize:"12px", color:"#8a7a50", marginBottom:"12px", letterSpacing:"0.5px" }}>
              Card {cardIndex + 1} of {words.length}
            </div>

            {/* Flashcard — tap/click to advance */}
            <div
              onClick={advance}
              style={{
                background:"#2D5A1A", borderRadius:"12px",
                padding:"30px 22px 24px",
                textAlign:"center", cursor:"pointer",
                userSelect:"none", WebkitUserSelect:"none",
                marginBottom:"16px",
                minHeight:"180px",
                display:"flex", flexDirection:"column",
                justifyContent:"center", gap:"16px",
                boxShadow:"inset 0 -3px 0 rgba(0,0,0,.2)",
              }}
            >
              {/* Answer word — prominent */}
              <div style={{
                fontFamily:"'Playfair Display',serif", fontWeight:900,
                fontSize:"clamp(1.5rem, 6vw, 2.4rem)",
                color:"#f0ead8", letterSpacing:"5px", lineHeight:1.1,
                wordBreak:"break-word",
              }}>
                {word.answer}
              </div>

              {/* Clue */}
              <div style={{
                fontFamily:"Lora,serif", fontSize:"14px",
                color:"#C8E6C0", lineHeight:1.65,
              }}>
                {word.clue}
              </div>

              {/* Tap hint */}
              <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"rgba(200,230,192,.55)", fontStyle:"italic" }}>
                Tap to advance →
              </div>
            </div>

            {/* 45s study progress bar — K-12 only */}
            {!readerMode && (
              <div style={{ marginBottom:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"Lora,serif", fontSize:"11px", color:"#8a7a50", marginBottom:"5px" }}>
                  <span>Study time</span>
                  <span style={{ color: studyDone ? "#2D5A1A" : "#8a7a50", fontWeight: studyDone ? 700 : 400 }}>
                    {studyDone ? "Complete ✓" : `${STUDY_SECS - elapsed}s remaining`}
                  </span>
                </div>
                <div style={{ height:"7px", background:"#e0d8c8", borderRadius:"4px", overflow:"hidden" }}>
                  <div style={{
                    height:"100%", borderRadius:"4px",
                    width: pct + "%",
                    background: studyDone ? "#2D5A1A" : "#6a9a48",
                    transition:"width 1s linear",
                  }}/>
                </div>
                {!studyDone && (
                  <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#b0a070", textAlign:"center", marginTop:"6px", fontStyle:"italic" }}>
                    Buttons unlock when study time is complete
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:"flex", gap:"10px" }}>
              {/* Continue — only when continueAvailable OR readerMode */}
              {(readerMode || continueAvailable) && (
                <button
                  onClick={unlocked ? handleContinue : undefined}
                  style={{
                    flex:1, padding:"12px 8px",
                    background: unlocked ? "#2D5A1A" : "#ddd6c8",
                    color:      unlocked ? "#f0ead8" : "#a8987a",
                    border:"none", borderRadius:"8px",
                    fontFamily:"Lora,Georgia,serif", fontWeight:600,
                    fontSize:"13px", lineHeight:1.3,
                    cursor: unlocked ? "pointer" : "not-allowed",
                    transition:"all .2s",
                  }}
                >
                  {readerMode ? "Close" : "Continue\n(1 remaining)"}
                </button>
              )}

              {/* Restart — always shown */}
              <button
                onClick={unlocked ? handleRestart : undefined}
                style={{
                  flex:1, padding:"12px 8px",
                  background: unlocked ? "#c0392b" : "#ddd6c8",
                  color:      unlocked ? "#fff"    : "#a8987a",
                  border:"none", borderRadius:"8px",
                  fontFamily:"Lora,Georgia,serif", fontWeight:600,
                  fontSize:"13px",
                  cursor: unlocked ? "pointer" : "not-allowed",
                  transition:"all .2s",
                }}
              >
                Restart
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
