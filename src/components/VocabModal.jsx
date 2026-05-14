import { useState, useRef, useEffect } from "react";

const SPEED_MS   = { slow: 8000, normal: 5000, fast: 3000 };
const STUDY_SECS = 45;

const isEarlyGrade   = g => ["k","1","2","3","4","5"].includes(String(g));
const isEarlyLearner = g => ["k","1","2"].includes(String(g));

// ── Web Speech API helper ───────────────────────────────────────────────────
function speakText(text, grade) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate  = isEarlyLearner(grade) ? 0.82 : 1.0;
  utt.pitch = isEarlyLearner(grade) ? 1.1  : 1.0;
  window.speechSynthesis.speak(utt);
}

/**
 * VocabModal — Vocabulary Study Mode
 *
 * Props:
 *   words             — [{answer, clue, emoji?}]
 *   continueAvailable — true = first reveal (Continue shown), false = 2nd+ (only Restart)
 *   readerMode        — no timer or requirement; pure browse
 *   grade             — grade string, used for timer logic + audio
 *   phonicsMode       — affects audio phrasing for K-2
 *   onContinue / onRestart
 */
export default function VocabModal({
  words,
  continueAvailable,
  onContinue,
  onRestart,
  readerMode   = false,
  grade        = "3",
  phonicsMode  = false,
}) {
  const early   = isEarlyLearner(grade);
  const lower   = isEarlyGrade(grade);   // K–5

  // ── phase: "setup" | "cards" ────────────────────────────────────────────
  const [phase,         setPhase]         = useState("setup");
  const [speed,         setSpeed]         = useState(early ? "slow" : "normal");
  const [cardIndex,     setCardIndex]     = useState(0);

  // ── K-5: "viewed all cards" requirement ─────────────────────────────────
  const [viewedSet,     setViewedSet]     = useState(() => new Set());

  // ── 6th-12th: optional challenge timer ──────────────────────────────────
  const [challengeMode, setChallengeMode] = useState(false);
  const [elapsed,       setElapsed]       = useState(0);

  // studyDone: true when buttons should unlock
  const [studyDone, setStudyDone] = useState(() => {
    if (readerMode)    return true;
    if (!lower)        return true;  // 6th+ always unlocked unless challenge mode
    return false;                    // K-5 must view all cards
  });

  const autoRef  = useRef(null);
  const studyRef = useRef(null);

  // cleanup on unmount
  useEffect(() => () => {
    clearTimeout(autoRef.current);
    clearInterval(studyRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  // auto-advance card
  useEffect(() => {
    if (phase !== "cards") return;
    clearTimeout(autoRef.current);
    autoRef.current = setTimeout(advance, SPEED_MS[speed]);
    return () => clearTimeout(autoRef.current);
  }, [phase, cardIndex, speed]); // eslint-disable-line

  // K-2: auto-speak when card changes
  useEffect(() => {
    if (phase !== "cards" || !early) return;
    const w = words[cardIndex];
    if (!w) return;
    const text = `${w.answer}. ${w.clue}`;
    const t = setTimeout(() => speakText(text, grade), 350);
    return () => clearTimeout(t);
  }, [cardIndex, phase]); // eslint-disable-line

  // 6th-12th: toggle challenge mode — reset timer state
  useEffect(() => {
    if (lower || readerMode) return;
    if (challengeMode) {
      setStudyDone(false);
      setElapsed(0);
    } else {
      setStudyDone(true);
      clearInterval(studyRef.current);
    }
  }, [challengeMode]); // eslint-disable-line

  // ── Actions ─────────────────────────────────────────────────────────────
  function beginStudy() {
    const initialSet = new Set([0]);
    setPhase("cards");
    setCardIndex(0);
    setElapsed(0);
    setViewedSet(initialSet);

    // K-5: check if only 1 word (edge case)
    if (lower && !readerMode && words.length <= 1) {
      setStudyDone(true);
    }

    // 6th-12th challenge: start 45s timer
    if (!lower && !readerMode && challengeMode) {
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
    const next = (cardIndex + 1) % words.length;
    setCardIndex(next);

    // K-5: mark card viewed, check completion
    if (lower && !readerMode) {
      setViewedSet(prev => {
        const updated = new Set(prev);
        updated.add(next);
        if (updated.size >= words.length) setStudyDone(true);
        return updated;
      });
    }
  }

  function handleContinue() {
    clearTimeout(autoRef.current);
    clearInterval(studyRef.current);
    window.speechSynthesis?.cancel();
    onContinue();
  }

  function handleRestart() {
    clearTimeout(autoRef.current);
    clearInterval(studyRef.current);
    window.speechSynthesis?.cancel();
    onRestart();
  }

  function speakCurrent() {
    const w = words[cardIndex];
    if (!w) return;
    speakText(`${w.answer}. ${w.clue}`, grade);
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const word      = words[cardIndex] || words[0];
  const unlocked  = studyDone;
  const viewedCnt = viewedSet.size;
  const allViewed = viewedCnt >= words.length;
  const viewPct   = Math.min(100, (viewedCnt / words.length) * 100);
  const timerPct  = Math.min(100, (elapsed / STUDY_SECS) * 100);

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

        {/* ══ SETUP PHASE ═══════════════════════════════════════════════════ */}
        {phase === "setup" && (
          <>
            <div style={{ textAlign:"center", marginBottom:"20px" }}>
              <div style={{ fontSize:"2.2rem", marginBottom:"8px" }}>
                {early ? "📚✨" : "📚"}
              </div>
              <h2 style={{
                fontFamily:"'Playfair Display',serif", fontWeight:900,
                color:"#2D5A1A",
                fontSize: early ? "1.6rem" : "1.4rem",
                margin:"0 0 10px",
              }}>
                {readerMode ? "Word List" : early ? "Let's Learn Words!" : "Vocabulary Study"}
              </h2>
              <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#6a5a30", lineHeight:1.65, margin:0 }}>
                {readerMode
                  ? `Browse all ${words.length} words from this puzzle.`
                  : lower
                    ? `Look at all ${words.length} vocabulary words. You need to see every card before you can continue!`
                    : `Review all ${words.length} vocabulary words from this puzzle.`}
              </p>
            </div>

            {/* Speed selector */}
            {!readerMode && (
              <div style={{ marginBottom:"20px" }}>
                <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#6a5a30", textAlign:"center", marginBottom:"8px" }}>
                  Study Speed
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  {[["slow","Slow","8 sec"],["normal","Normal","5 sec"],["fast","Fast","3 sec"]].map(([key,lbl,sub]) => (
                    <button key={key} onClick={() => setSpeed(key)} style={{
                      flex:1, padding:"10px 6px",
                      border:`2px solid ${speed===key?"#2D5A1A":"#c8b888"}`,
                      borderRadius:"8px",
                      background: speed===key?"#e8f0d8":"#fffef5",
                      cursor:"pointer",
                    }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:speed===key?"#2D5A1A":"#4a3a18", fontSize:"13px" }}>{lbl}</div>
                      <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#8a7a50", marginTop:"3px" }}>{sub}/card</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6th-12th: optional challenge mode toggle */}
            {!readerMode && !lower && (
              <div style={{ marginBottom:"20px", background:"#f4efe4", border:"1.5px solid #c8b888", borderRadius:"8px", padding:"12px 14px" }}>
                <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }}>
                  <input type="checkbox" checked={challengeMode} onChange={e => setChallengeMode(e.target.checked)}
                    style={{ accentColor:"#3a6a1a", width:"16px", height:"16px", cursor:"pointer" }} />
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:"#4a3a18" }}>
                      ⏱ Challenge Mode
                    </div>
                    <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#8a7a50", marginTop:"2px" }}>
                      Study for 45 seconds before continuing
                    </div>
                  </div>
                </label>
              </div>
            )}

            <button onClick={beginStudy} style={{
              width:"100%", padding:"13px",
              background:"#2D5A1A", color:"#f0ead8",
              border:"none", borderRadius:"8px",
              fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize: early ? "17px" : "15px",
              letterSpacing:"0.5px", cursor:"pointer",
              boxShadow:"2px 2px 0 #1a3a0a",
            }}>
              {readerMode ? "Browse Words →" : early ? "Let's Start! 🌟" : "Begin Study →"}
            </button>
          </>
        )}

        {/* ══ CARDS PHASE ═══════════════════════════════════════════════════ */}
        {phase === "cards" && (
          <>
            {/* Card counter + speaker button */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#8a7a50", letterSpacing:"0.5px" }}>
                Card {cardIndex + 1} of {words.length}
              </div>
              {/* Speaker button — always available but style differs by grade */}
              <button
                onClick={speakCurrent}
                title="Read aloud"
                style={{
                  background:"none",
                  border:`1.5px solid ${early?"#66bb6a":"#c8b888"}`,
                  borderRadius:"6px", padding:"4px 10px",
                  cursor:"pointer", fontSize:"16px", lineHeight:1,
                }}
              >
                🔊
              </button>
            </div>

            {/* Flashcard */}
            <div onClick={advance} style={{
              background: early
                ? "linear-gradient(135deg,#2D5A1A,#4a8a2a)"
                : "#2D5A1A",
              borderRadius: early ? "20px" : "12px",
              padding:"28px 22px 22px", textAlign:"center",
              cursor:"pointer", userSelect:"none", WebkitUserSelect:"none",
              marginBottom:"16px",
              minHeight: early ? "200px" : "180px",
              display:"flex", flexDirection:"column", justifyContent:"center", gap:"14px",
              boxShadow: early ? "0 6px 0 rgba(0,0,0,.2)" : "inset 0 -3px 0 rgba(0,0,0,.2)",
            }}>
              {/* Word */}
              <div style={{
                fontFamily:"'Playfair Display',serif", fontWeight:900,
                fontSize: early ? "clamp(2rem,8vw,3rem)" : "clamp(1.5rem,6vw,2.4rem)",
                color:"#f0ead8", letterSpacing:"5px", lineHeight:1.1,
                wordBreak:"break-word",
              }}>
                {word.answer}
              </div>

              {/* Emoji (picture mode) */}
              {word.emoji && word.emoji !== "🔤" && (
                <div style={{ fontSize: early ? "3.5rem" : "2.5rem", lineHeight:1 }}>
                  {word.emoji}
                </div>
              )}

              {/* Clue */}
              <div style={{
                fontFamily:"Lora,serif",
                fontSize: early ? "16px" : "14px",
                color:"#C8E6C0", lineHeight:1.65,
              }}>
                {word.clue}
              </div>

              <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"rgba(200,230,192,.55)", fontStyle:"italic" }}>
                {early ? "Tap for next word →" : "Tap to advance →"}
              </div>
            </div>

            {/* Progress indicator */}
            {!readerMode && (
              <div style={{ marginBottom:"16px" }}>
                {lower ? (
                  /* K-5: viewed-cards progress bar */
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"Lora,serif", fontSize:"11px", color:"#8a7a50", marginBottom:"5px" }}>
                      <span>{early ? "Cards seen 👀" : "Cards viewed"}</span>
                      <span style={{ color: allViewed ? "#2D5A1A" : "#8a7a50", fontWeight: allViewed ? 700 : 400 }}>
                        {allViewed ? "All done ✓" : `${viewedCnt} of ${words.length}`}
                      </span>
                    </div>
                    <div style={{ height:"7px", background:"#e0d8c8", borderRadius:"4px", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:"4px", width:viewPct+"%", background: allViewed ? "#2D5A1A" : "#6a9a48", transition:"width .3s ease" }}/>
                    </div>
                    {!allViewed && (
                      <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#b0a070", textAlign:"center", marginTop:"6px", fontStyle:"italic" }}>
                        {early ? "See all the cards first! 🌟" : "View all cards to continue"}
                      </div>
                    )}
                  </>
                ) : challengeMode ? (
                  /* 6th-12th challenge: 45s timer */
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"Lora,serif", fontSize:"11px", color:"#8a7a50", marginBottom:"5px" }}>
                      <span>Study time</span>
                      <span style={{ color: studyDone ? "#2D5A1A" : "#8a7a50", fontWeight: studyDone ? 700 : 400 }}>
                        {studyDone ? "Complete ✓" : `${STUDY_SECS - elapsed}s remaining`}
                      </span>
                    </div>
                    <div style={{ height:"7px", background:"#e0d8c8", borderRadius:"4px", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:"4px", width:timerPct+"%", background: studyDone ? "#2D5A1A" : "#6a9a48", transition:"width 1s linear" }}/>
                    </div>
                    {!studyDone && (
                      <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#b0a070", textAlign:"center", marginTop:"6px", fontStyle:"italic" }}>
                        Buttons unlock when study time is complete
                      </div>
                    )}
                  </>
                ) : null /* 6th-12th no challenge: no bar needed */}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:"flex", gap:"10px" }}>
              {(readerMode || continueAvailable) && (
                <button onClick={unlocked ? handleContinue : undefined} style={{
                  flex:1, padding: early ? "14px 8px" : "12px 8px",
                  background: unlocked ? "#2D5A1A" : "#ddd6c8",
                  color:      unlocked ? "#f0ead8" : "#a8987a",
                  border:"none",
                  borderRadius: early ? "12px" : "8px",
                  fontFamily:"Lora,Georgia,serif", fontWeight:600,
                  fontSize: early ? "15px" : "13px", lineHeight:1.3,
                  cursor: unlocked ? "pointer" : "not-allowed",
                  transition:"all .2s",
                }}>
                  {readerMode ? "Close" : early ? "Continue! 🎉" : "Continue\n(1 remaining)"}
                </button>
              )}
              <button onClick={unlocked ? handleRestart : undefined} style={{
                flex:1, padding: early ? "14px 8px" : "12px 8px",
                background: unlocked ? "#c0392b" : "#ddd6c8",
                color:      unlocked ? "#fff"    : "#a8987a",
                border:"none",
                borderRadius: early ? "12px" : "8px",
                fontFamily:"Lora,Georgia,serif", fontWeight:600,
                fontSize: early ? "15px" : "13px",
                cursor: unlocked ? "pointer" : "not-allowed",
                transition:"all .2s",
              }}>
                {early ? "Try Again! 🔄" : "Restart"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
