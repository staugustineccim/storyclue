import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { decodePuzzle } from "../utils/urlEncoder";
import { buildGrid, buildNumbering } from "../utils/layoutBuilder";
import FeedbackModal from "./FeedbackModal";
import VocabModal from "./VocabModal";
import ContextReviewModal from "./ContextReviewModal";

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const GRADE_LABELS = {
  k:"K", "1":"1st", "2":"2nd", "3":"3rd", "4":"4th", "5":"5th",
  "6":"6th", "7":"7th", "8":"8th", "9-10":"9th–10th",
  "11-12":"11th–12th", "adult":"Reader Mode",
};

const MAX_HINTS = 3;

// ── Smart Web Speech voice picker — no API key needed ─────────────────────────
// Ranks available browser voices to find the warmest/clearest for each grade tier.
// Chrome has "Google US English", iOS has "Samantha", etc. — we pick the best one.
let _voiceCache = null;

function getBestVoice(grade) {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const isEarly = ["k","1","2"].includes(grade);
  const isLower = ["k","1","2","3","4","5"].includes(grade);

  // Scored preference lists — first match wins
  // Prioritise voices known to sound warm and natural, not robotic.
  // Windows 11 "Online (Natural)" voices are significantly better than the old ones.
  const earlyPrefs = [
    "Samantha",                           // iOS/macOS — genuinely warm, not robotic
    "Google US English Female",           // Chrome — clear and natural
    "Microsoft Jenny Online (Natural)",   // Windows 11 — best natural female
    "Microsoft Aria Online (Natural)",    // Windows 11 — warm female
    "Karen",                              // macOS Australian — very clear
    "Moira",                              // macOS Irish
    "Victoria",                           // macOS
    "Google UK English Female",
    "Microsoft Jenny",                    // Windows older
    "Microsoft Zira",                     // Windows last resort
  ];
  const lowerPrefs = [
    "Samantha",
    "Google US English Female",
    "Microsoft Jenny Online (Natural)",
    "Microsoft Aria Online (Natural)",
    "Microsoft Jenny",
    "Google UK English Female",
    "Karen",
    "Microsoft Zira",
  ];
  const upperPrefs = [
    "Google US English",
    "Alex",                               // macOS — very clear
    "Microsoft Guy Online (Natural)",     // Windows 11 natural male
    "Microsoft Davis Online (Natural)",
    "Microsoft David",
    "Google US English Male",
  ];

  const prefs = isEarly ? earlyPrefs : isLower ? lowerPrefs : upperPrefs;

  // Try exact name matches first
  for (const name of prefs) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  // Fall back: any en-US female voice for K-5, any en-US for 6+
  const enUs = voices.filter(v => v.lang?.startsWith("en"));
  if (isLower) {
    const female = enUs.find(v => /female|woman|girl/i.test(v.name));
    if (female) return female;
  }
  return enUs[0] || voices[0] || null;
}

function speakTextGraded(text, grade, muted) {
  if (muted || !text || !window.speechSynthesis) return;
  const gradeStr = String(grade);
  const isEarly  = ["k","1","2"].includes(gradeStr);
  const isLower  = ["k","1","2","3","4","5"].includes(gradeStr);

  window.speechSynthesis.cancel();
  const utt   = new SpeechSynthesisUtterance(text);
  const voice = getBestVoice(gradeStr);
  if (voice) utt.voice = voice;
  utt.lang   = "en-US";
  utt.volume = 0.92;
  // Pitch stays near 1.0 — boosting pitch causes the robotic/squeaky effect.
  // Warmth comes from voice selection + slower, deliberate rate.
  utt.rate  = isEarly ? 0.76 : isLower ? 0.88 : 0.95;
  utt.pitch = isEarly ? 1.02 : isLower ? 1.0  : 1.0;
  window.speechSynthesis.speak(utt);
}

// Alias kept for celebration phrases called without grade context
function speakTextWeb(text, grade) {
  speakTextGraded(text, grade || "3", false);
}
}

// Legacy synchronous helper kept for celebration phrases (no grade/muted context needed)
function speakText(text, rate = 1.0, pitch = 1.0) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate  = rate;
  utt.pitch = pitch;
  window.speechSynthesis.speak(utt);
}

// Web Audio API celebration sounds — no external files needed
function playCelebrationSound(type = "word") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = type === "win"
      ? [{ f:261.63, t:0 }, { f:329.63, t:0.14 }, { f:392, t:0.28 }, { f:523.25, t:0.44 }]
      : [{ f:392, t:0 }, { f:523.25, t:0.14 }, { f:659.25, t:0.28 }];
    notes.forEach(({ f, t }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = f; osc.type = "sine";
      gain.gain.setValueAtTime(0.22, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.48);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.5);
    });
  } catch { /* silently fail — AudioContext may be unavailable */ }
}

// Confetti piece generator
function makeConfetti() {
  const COLORS = ["#ff5252","#ffeb3b","#69f0ae","#448aff","#e91e63","#ff9800","#ab47bc","#26c6da"];
  return Array.from({ length: 28 }, (_, i) => ({
    id:    i + Date.now(),
    left:  Math.random() * 100,
    size:  7 + Math.random() * 9,
    round: Math.random() > 0.45,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    dur:   1.3 + Math.random() * 0.9,
    delay: Math.random() * 0.5,
  }));
}

export default function CrosswordPuzzle() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug } = useParams();

  const [loadState,  setLoadState]  = useState("loading");
  const [puzzleData, setPuzzleData] = useState(null);

  const isTeacher = searchParams.get("t") === "1";

  useEffect(() => {
    if (slug) {
      fetch(`/api/get-puzzle?slug=${encodeURIComponent(slug)}`)
        .then(r => { if (!r.ok) throw Object.assign(new Error(), { status: r.status }); return r.json(); })
        .then(data => { setPuzzleData(data); setLoadState("ready"); })
        .catch(() => setLoadState("error"));
    } else {
      const p = searchParams.get("p");
      const data = p ? decodePuzzle(p) : null;
      if (data) { setPuzzleData(data); setLoadState("ready"); }
      else setLoadState("error");
    }
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loadState === "loading") {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#faf7f0", fontFamily:"Georgia,serif" }}>
        <div style={{ fontSize:"48px", marginBottom:"16px", animation:"spin 1.2s linear infinite" }}>🕷️</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontFamily:"Lora,serif", fontSize:"15px", color:"#6a5a30" }}>Loading puzzle…</div>
      </div>
    );
  }

  if (loadState === "error" || !puzzleData) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#faf7f0", fontFamily:"Georgia,serif" }}>
        <div style={{ fontSize:"48px", marginBottom:"16px" }}>🕷️</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", color:"#2d4a18", marginBottom:"12px" }}>Puzzle not found</div>
        <div style={{ color:"#6a5a30", marginBottom:"24px", fontFamily:"Lora,serif", textAlign:"center", maxWidth:"360px", lineHeight:1.6 }}>
          This puzzle link may be incorrect or the puzzle hasn't been saved yet.
        </div>
        <button onClick={() => navigate("/create")} style={{ background:"#3a6a1a", color:"#f0ead8", border:"none", borderRadius:"4px", padding:"10px 24px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
          Create a New Puzzle
        </button>
      </div>
    );
  }

  return <PuzzleBoard {...puzzleData} isTeacher={isTeacher} />;
}

function PuzzleBoard({
  title, grade, language = "english", rows, cols, words, isTeacher = false,
  phonicsMode = false, pictureMode = false,
}) {
  const navigate   = useNavigate();
  const SOLUTION   = buildGrid(words, rows, cols);
  const NUMBERING  = buildNumbering(words, rows, cols);

  const ACROSS = words.filter(w => w.orientation === "across").sort((a,b) => a.number - b.number);
  const DOWN   = words.filter(w => w.orientation === "down").sort((a,b) => a.number - b.number);

  // Grade helpers
  const isEarlyLearner = ["k","1","2"].includes(String(grade));
  const isLowerGrade   = ["k","1","2","3","4","5"].includes(String(grade));

  // ── Core state ────────────────────────────────────────────────────────────
  const [cells,        setCells]        = useState(() => Array.from({ length:rows }, () => Array(cols).fill("")));
  const [sel,          setSel]          = useState(null);
  const [activeWord,   setActiveWord]   = useState(null);
  const [checked,      setChecked]      = useState(false);
  const [revealed,     setRevealed]     = useState(false);
  const [won,          setWon]          = useState(false);
  const [seconds,      setSeconds]      = useState(0);
  const [timerActive,  setTimerActive]  = useState(false);
  const [mistakes,     setMistakes]     = useState(0);
  const [clueTab,      setClueTab]      = useState("across");
  const [shareMsg,     setShareMsg]     = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackShown,setFeedbackShown]= useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Hint state ────────────────────────────────────────────────────────────
  const [hintsLeft,    setHintsLeft]    = useState(MAX_HINTS);
  const [showHintMenu, setShowHintMenu] = useState(false);
  const [simplerClues, setSimplerClues] = useState({});
  const [hintLoading,  setHintLoading]  = useState(false);
  const [hintMsg,      setHintMsg]      = useState("");

  // ── Reveal / print / vocab state ──────────────────────────────────────────
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);
  const [printMode,         setPrintMode]         = useState(null);
  const [showPrintDialog,   setShowPrintDialog]   = useState(false);
  const [showVocabModal,    setShowVocabModal]     = useState(false);
  const [continueUsed,      setContinueUsed]      = useState(false);
  const [clueBarExpanded,   setClueBarExpanded]   = useState(false);

  // ── K-2 Early Learner state ───────────────────────────────────────────────
  const [burstCells,     setBurstCells]     = useState(() => new Set());
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [mascotMood,     setMascotMood]     = useState("idle"); // "idle"|"happy"|"encouraging"

  // ── Audio / mute ──────────────────────────────────────────────────────────
  const [muted, setMuted] = useState(() => localStorage.getItem("sc-muted") === "1");

  // ── Picture mode: Wikipedia images ───────────────────────────────────────
  const [wordImages, setWordImages] = useState({}); // { "WORD": "https://..." }

  // ── Context review (Item 6) ───────────────────────────────────────────────
  const [showContextReview, setShowContextReview] = useState(false);
  const [contextSentences,  setContextSentences]  = useState(null);
  const [contextLoading,    setContextLoading]    = useState(false);
  const [contextAutoShown,  setContextAutoShown]  = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const refs              = useRef({});
  const timerRef          = useRef(null);
  const activeClueRef     = useRef(null);
  const hintMenuRef       = useRef(null);
  const userExitedFsRef   = useRef(false);
  const mascotTimerRef    = useRef(null);
  const completedWordsRef = useRef(new Set());
  const mutedRef          = useRef(muted);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Keep muted ref in sync so closure-based effects always see current value
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Picture mode: fetch Wikipedia thumbnail images for vocabulary words
  useEffect(() => {
    if (!pictureMode || !words.length) return;
    fetch("/api/get-images", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ words: words.map(w => w.answer) }),
    })
      .then(r => r.json())
      .then(data => { if (data.images) setWordImages(data.images); })
      .catch(() => { /* silently fail — emoji is the fallback */ });
  }, []); // eslint-disable-line

  // Puzzle timer
  useEffect(() => {
    if (timerActive && !won) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerActive, won]);

  // Fullscreen persistence
  useEffect(() => {
    function onFsChange() {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isFs) {
        userExitedFsRef.current = false;
      } else if (!userExitedFsRef.current) {
        setTimeout(() => { document.documentElement.requestFullscreen?.().catch(() => {}); }, 50);
      }
    }
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Scroll active clue into view
  useEffect(() => {
    activeClueRef.current?.scrollIntoView({ behavior:"auto", block:"center" });
  }, [activeWord]);

  // ── Auto-win detection ────────────────────────────────────────────────────
  // Fires immediately when the last correct letter is entered — no need to
  // click Check. Guards: not already won, not revealed, timer must be running
  // (timer starts on first keypress, so this never fires on initial load).
  useEffect(() => {
    if (won || revealed || !timerActive) return;
    const allSolved = SOLUTION.every((row, r) =>
      row.every((cell, c) => !cell || cells[r][c] === cell)
    );
    if (allSolved) {
      setWon(true);
      setTimerActive(false);
    }
  }, [cells]); // eslint-disable-line

  // Feedback modal timing
  useEffect(() => {
    if ((won || revealed) && !feedbackShown && !showVocabModal) {
      const t = setTimeout(() => { setShowFeedback(true); setFeedbackShown(true); }, 1200);
      return () => clearTimeout(t);
    }
  }, [won, revealed, feedbackShown, showVocabModal]);

  // Print trigger
  useEffect(() => {
    if (!printMode) return;
    const t = setTimeout(() => { window.print(); setTimeout(() => setPrintMode(null), 300); }, 80);
    return () => clearTimeout(t);
  }, [printMode]);

  // Close hint menu on outside click
  useEffect(() => {
    function onOutside(e) {
      if (hintMenuRef.current && !hintMenuRef.current.contains(e.target)) setShowHintMenu(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // K-2: detect word completion → confetti + audio celebration
  useEffect(() => {
    if (!isEarlyLearner || won) return;
    let newCompletion = false;
    for (const w of words) {
      const key = `${w.orientation}-${w.number}`;
      if (!completedWordsRef.current.has(key) && isWordCorrect(w)) {
        completedWordsRef.current.add(key);
        newCompletion = true;
      }
    }
    if (newCompletion) {
      triggerConfetti();
      playCelebrationSound("word");
      const phrases = ["Great job!", "You got it!", "Wonderful!", "Keep going!"];
      setTimeout(() => {
        if (!mutedRef.current) speakText(phrases[Math.floor(Math.random() * phrases.length)], 0.9, 1.2);
      }, 200);
    }
  }, [cells]); // eslint-disable-line

  // K-2: full win celebration audio
  useEffect(() => {
    if (won && isEarlyLearner) {
      triggerConfetti();
      playCelebrationSound("win");
      setTimeout(() => {
        if (!mutedRef.current) speakText("You did it! Amazing work! You solved the puzzle!", 0.85, 1.2);
      }, 600);
    }
  }, [won]); // eslint-disable-line

  // Context review: K-5 auto-show after feedback closes; 6th+ button only
  useEffect(() => {
    if (!contextAutoShown && feedbackShown && !showFeedback && (won || revealed) && isLowerGrade) {
      setContextAutoShown(true);
      loadContext();
    }
  }, [showFeedback, feedbackShown]); // eslint-disable-line

  // ── Helpers ───────────────────────────────────────────────────────────────
  function wordKey(w) { return `${w.orientation}-${w.number}`; }

  function getClue(w) { return simplerClues[wordKey(w)] || w.clue; }

  function isWordFilled(w) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.orientation === "down" ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      if (!cells[r][c]) return false;
    }
    return true;
  }

  function isWordCorrect(w) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.orientation === "down" ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      if (cells[r][c] !== SOLUTION[r][c]) return false;
    }
    return true;
  }

  function clueStatusClass(w) {
    if (isWordCorrect(w))              return " chk-ok";
    if (checked && isWordFilled(w))    return " chk-err";
    if (isWordFilled(w))               return " filled";
    return "";
  }

  function wordAt(r, c, prefDir) {
    const hits = words.filter(w =>
      w.orientation === "across"
        ? w.starty === r && c >= w.startx && c < w.startx + w.answer.length
        : w.startx === c && r >= w.starty && r < w.starty + w.answer.length
    );
    if (!hits.length) return null;
    if (hits.length === 1) return hits[0];
    return hits.find(h => h.orientation === prefDir) || hits[0];
  }

  function focus(r, c) { refs.current[`${r},${c}`]?.focus(); }

  function focusFirstEmpty(w) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.orientation === "down" ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      if (!cells[r][c]) { setSel({ r, c }); focus(r, c); return; }
    }
    setSel({ r:w.starty, c:w.startx }); focus(w.starty, w.startx);
  }

  function triggerConfetti() {
    setConfettiPieces(makeConfetti());
    setTimeout(() => setConfettiPieces([]), 2600);
  }

  async function loadContext() {
    if (contextSentences) { setShowContextReview(true); return; }
    setContextLoading(true);
    try {
      const r = await fetch("/api/vocab-context", {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({ words, title, grade }),
      });
      const data = await r.json();
      if (data.sentences?.length) {
        setContextSentences(data.sentences);
        setShowContextReview(true);
      }
    } catch { /* silently fail — context review is optional */ }
    setContextLoading(false);
  }

  // ── Interactions ──────────────────────────────────────────────────────────
  function clickCell(r, c) {
    if (!SOLUTION[r][c]) return;
    if (!timerActive && !revealed && !won) setTimerActive(true);
    if (sel?.r === r && sel?.c === c && activeWord) {
      const other = words.find(w => w !== activeWord && (
        w.orientation === "across"
          ? w.starty === r && c >= w.startx && c < w.startx + w.answer.length
          : w.startx === c && r >= w.starty && r < w.starty + w.answer.length
      ));
      if (other) { setActiveWord(other); setClueTab(other.orientation); }
    } else {
      setSel({ r, c });
      const w = wordAt(r, c, activeWord?.orientation || "across");
      setActiveWord(w);
      if (w) setClueTab(w.orientation);
    }
    focus(r, c);
  }

  function keyDown(r, c, e) {
    if (!timerActive && !revealed && !won) setTimerActive(true);

    if (e.key === "Backspace") {
      e.preventDefault();
      const next = cells.map(row => [...row]);
      if (next[r][c]) { next[r][c] = ""; setCells(next); setChecked(false); }
      else if (activeWord) {
        const nr = r + (activeWord.orientation === "down" ? -1 : 0);
        const nc = c + (activeWord.orientation === "across" ? -1 : 0);
        if (SOLUTION[nr]?.[nc]) { setSel({ r:nr, c:nc }); focus(nr, nc); }
      }
      return;
    }

    const arrows = { ArrowRight:[0,1,"across"], ArrowLeft:[0,-1,"across"], ArrowDown:[1,0,"down"], ArrowUp:[-1,0,"down"] };
    if (arrows[e.key]) {
      e.preventDefault();
      const [dr, dc, d] = arrows[e.key];
      const nr = r+dr, nc = c+dc;
      if (SOLUTION[nr]?.[nc]) { setSel({r:nr,c:nc}); setActiveWord(wordAt(nr,nc,d)); focus(nr,nc); }
      return;
    }

    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      const next   = cells.map(row => [...row]);
      if (next[r][c] && next[r][c] !== letter) setMistakes(m => m + 1);
      next[r][c] = letter;
      setCells(next); setChecked(false);

      // K-2: mascot + burst animation
      if (isEarlyLearner) {
        const correct = letter === SOLUTION[r][c];
        clearTimeout(mascotTimerRef.current);
        setMascotMood(correct ? "happy" : "encouraging");
        mascotTimerRef.current = setTimeout(() => setMascotMood("idle"), 1500);

        if (correct) {
          // starburst on this cell
          const cellKey = `${r},${c}`;
          setBurstCells(prev => new Set([...prev, cellKey]));
          setTimeout(() => setBurstCells(prev => { const n = new Set(prev); n.delete(cellKey); return n; }), 500);
        }
      }

      // advance cursor
      if (activeWord) {
        const nr = r + (activeWord.orientation === "down" ? 1 : 0);
        const nc = c + (activeWord.orientation === "across" ? 1 : 0);
        if (SOLUTION[nr]?.[nc]) { setSel({r:nr,c:nc}); setActiveWord(wordAt(nr,nc,activeWord.orientation)); focus(nr,nc); }
      }
    }
  }

  function check() {
    setChecked(true);
    const allOk = SOLUTION.every((row,r) => row.every((cell,c) => !cell || cells[r][c] === cell));
    if (allOk) { setWon(true); setTimerActive(false); }
  }

  function doReveal() {
    setShowRevealConfirm(false);
    setTimerActive(false);
    setChecked(false);
    if (grade === "adult") {
      setCells(SOLUTION.map(row => row.map(c => c || "")));
      setRevealed(true);
    } else {
      setShowVocabModal(true);
    }
  }

  function handleVocabContinue() {
    setContinueUsed(true);
    setShowVocabModal(false);
  }

  function handleVocabRestart() {
    setShowVocabModal(false);
    if (continueUsed) {
      setCells(SOLUTION.map(row => row.map(c => c || "")));
      setRevealed(true); setChecked(false);
    } else {
      reset();
    }
  }

  function reset() {
    setCells(Array.from({ length:rows }, () => Array(cols).fill("")));
    setChecked(false); setRevealed(false); setWon(false);
    setSel(null); setActiveWord(null);
    setSeconds(0); setTimerActive(false); setMistakes(0);
    setShowFeedback(false); setFeedbackShown(false);
    setHintsLeft(MAX_HINTS); setSimplerClues({}); setHintMsg("");
    setBurstCells(new Set()); setConfettiPieces([]);
    setMascotMood("idle");
    setShowContextReview(false);
    setContextAutoShown(false);
    completedWordsRef.current = new Set();
  }

  function toggleMute() {
    setMuted(m => {
      const next = !m;
      localStorage.setItem("sc-muted", next ? "1" : "0");
      if (next) window.speechSynthesis?.cancel();
      return next;
    });
  }

  function share() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setShareMsg("Copied!"); setTimeout(() => setShareMsg(""), 2000);
    }).catch(() => { setShareMsg("Copy URL from browser"); setTimeout(() => setShareMsg(""), 3000); });
  }

  function triggerPrint(mode) { setPrintMode(mode); }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      userExitedFsRef.current = false;
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      userExitedFsRef.current = true;
      document.exitFullscreen?.();
    }
  }

  // ── Hint: reveal one letter ───────────────────────────────────────────────
  function hintRevealLetter() {
    if (hintsLeft <= 0) { setHintMsg("No hints left!"); setShowHintMenu(false); return; }
    if (!activeWord)    { setHintMsg("Click a word first."); setShowHintMenu(false); return; }
    for (let i = 0; i < activeWord.answer.length; i++) {
      const r = activeWord.orientation === "down" ? activeWord.starty + i : activeWord.starty;
      const c = activeWord.orientation === "across" ? activeWord.startx + i : activeWord.startx;
      if (!cells[r][c] || cells[r][c] !== SOLUTION[r][c]) {
        const next = cells.map(row => [...row]);
        next[r][c] = SOLUTION[r][c];
        setCells(next); setChecked(false);
        setHintsLeft(h => h - 1);
        setHintMsg(`Letter revealed! (${hintsLeft - 1} hint${hintsLeft - 1 !== 1 ? "s" : ""} left)`);
        setTimeout(() => setHintMsg(""), 3000);
        setShowHintMenu(false);
        return;
      }
    }
    setHintMsg("All letters in this word are already correct!");
    setShowHintMenu(false);
  }

  // ── Hint: simpler clue ────────────────────────────────────────────────────
  async function hintSimplerClue() {
    if (hintsLeft <= 0) { setHintMsg("No hints left!"); setShowHintMenu(false); return; }
    if (!activeWord)    { setHintMsg("Click a word first."); setShowHintMenu(false); return; }
    const key = wordKey(activeWord);
    if (simplerClues[key]) { setHintMsg("Already simplified!"); setShowHintMenu(false); return; }

    setHintLoading(true); setShowHintMenu(false);
    setHintMsg("Getting a simpler clue...");
    try {
      const res  = await fetch("/api/simplify-clue", {
        method:"POST", headers:{ "content-type":"application/json" },
        body: JSON.stringify({ word:activeWord.answer, clue:activeWord.clue, grade }),
      });
      const data = await res.json();
      if (data.clue) {
        setSimplerClues(prev => ({ ...prev, [key]: data.clue }));
        setHintsLeft(h => h - 1);
        setHintMsg(`Clue simplified! (${hintsLeft - 1} hint${hintsLeft - 1 !== 1 ? "s" : ""} left)`);
      } else { setHintMsg("Couldn't simplify that clue. Try again."); }
    } catch { setHintMsg("Couldn't reach the server. Try again."); }
    setHintLoading(false);
    setTimeout(() => setHintMsg(""), 4000);
  }

  // ── Cell class ────────────────────────────────────────────────────────────
  function cellClass(r, c) {
    const parts = ["ci"];
    const isSel = sel?.r === r && sel?.c === c;
    const aw    = activeWord;
    const inW   = aw && (
      aw.orientation === "across"
        ? aw.starty === r && c >= aw.startx && c < aw.startx + aw.answer.length
        : aw.startx === c && r >= aw.starty && r < aw.starty + aw.answer.length
    );
    if      (isSel)                    parts.push("sel");
    else if (inW)                      parts.push("hi");
    else if (revealed)                 parts.push("rev");
    else if (checked && SOLUTION[r][c]) {
      if (!cells[r][c]) parts.push("mt");
      else parts.push(cells[r][c] === SOLUTION[r][c] ? "ok" : "err");
    }
    if (burstCells.has(`${r},${c}`)) parts.push("burst");
    return parts.join(" ");
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const totalCells = SOLUTION.flat().filter(Boolean).length;
  const correct    = cells.flat().filter((v,i) => {
    const r = Math.floor(i/cols), c = i%cols;
    return SOLUTION[r][c] && v === SOLUTION[r][c];
  }).length;
  const pct       = totalCells ? Math.round(correct / totalCells * 100) : 0;
  const clueList  = clueTab === "across" ? ACROSS : DOWN;
  const gradeLabel= GRADE_LABELS[grade] ? `${GRADE_LABELS[grade]} Grade` : "";
  const isSpanish = language === "spanish" || language?.startsWith("bilingual");
  const PRINT_CS  = Math.min(22, Math.floor(540 / cols));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

        html,body,#root{height:100%;overflow:hidden}
        .puzzle-root{position:fixed;inset:0;display:flex;flex-direction:column;background:#faf7f0;font-family:Georgia,serif;}

        :root{--cs:42px;--fs:17px;--ns:11px}
        @media(max-width:480px){:root{--cs:30px;--fs:13px}}

        .ci{width:var(--cs);height:var(--cs);border:1.5px solid #8a7a5a;background:#fffef5;text-align:center;font-size:var(--fs);font-weight:700;font-family:Lora,Georgia,serif;color:#1a1008;text-transform:uppercase;cursor:pointer;outline:none;caret-color:transparent;padding:0;transition:background .1s;}
        .ci.hi{background:#C8E6C0}
        .ci.sel{background:#2D5A1A!important;color:#fff}
        .ci.ok{background:#bff0b0!important;color:#1a6010}
        .ci.err{background:#ffb0b0!important;color:#8b1010}
        .ci.rev{background:#fff3b0!important;color:#7a5500}
        .ci.mt{background:#ffe8a0!important}
        .blk{width:var(--cs);height:var(--cs);background:#2a1a08;display:block}
        .cwrap{position:relative;display:inline-block;width:var(--cs);height:var(--cs)}
        .cnum{position:absolute;top:2px;left:2px;font-size:var(--ns);color:#5a4010;font-weight:700;font-family:Lora,Georgia,serif;pointer-events:none;z-index:2;line-height:1;}

        /* ── K-2 Early Learner overrides ─────────────────────────────────── */
        .el-grid{--cs:50px;--fs:22px;--ns:12px}
        @media(max-width:480px){.el-grid{--cs:38px;--fs:18px}}
        .el-grid .ci{border-radius:10px!important;border:2.5px solid #81c784!important;background:#f1f8e9!important;}
        .el-grid .cwrap{border-radius:10px!important;overflow:visible}
        .el-grid .blk{border-radius:10px!important;background:#a5d6a7!important;}
        .el-grid .ci.sel{background:#e91e63!important;color:#fff!important;border-color:#ad1457!important;}
        .el-grid .ci.hi{background:#fff59d!important;border-color:#f9a825!important;}
        .el-grid .ci.ok{background:#69f0ae!important;color:#1b5e20!important;border-color:#43a047!important;}
        .el-grid .ci.err{background:#ff5252!important;color:#fff!important;border-color:#c62828!important;}
        .el-grid .ci.rev{background:#fff9c4!important;}

        /* Starburst on correct cell in K-2 */
        @keyframes cellBurst{0%{transform:scale(1);box-shadow:0 0 0 0 rgba(76,175,80,.85);}45%{transform:scale(1.3);box-shadow:0 0 0 12px rgba(76,175,80,0);}100%{transform:scale(1);box-shadow:none;}}
        .ci.burst{animation:cellBurst .45s ease-out!important;z-index:3;position:relative;}

        /* Confetti fall */
        @keyframes confettiFall{from{transform:translateY(0) rotate(0deg);opacity:1;}to{transform:translateY(100vh) rotate(720deg);opacity:0;}}

        /* K-2 win celebration bounce */
        @keyframes celebBounce{from{transform:translateY(0) scale(1);}to{transform:translateY(-18px) scale(1.08);}}
        @keyframes celebSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

        /* Clue styles */
        .clue{padding:8px 10px;border-radius:5px;font-size:14px;line-height:1.55;cursor:pointer;transition:background .1s;font-family:Lora,Georgia,serif;color:#2c1a08;border-left:3px solid transparent;}
        .clue:hover{background:#ede0c0}
        .clue.act{background:#e8f0d8;font-weight:600;border-left-color:#2D5A1A}
        .clue.simpler{border-left-color:#8a7a30;font-style:italic;}
        .clue.filled{color:#999;text-decoration:line-through}
        .clue.chk-ok{color:#2a6a10;text-decoration:line-through;opacity:.75}
        .clue.chk-err{color:#c03010;text-decoration:none}
        .cn{font-weight:700;color:#6a4a10;margin-right:5px;font-size:13px}

        .btn{font-family:'Playfair Display',Georgia,serif;font-weight:700;border:none;border-radius:4px;cursor:pointer;transition:all .15s;font-size:13px;}
        .bg{background:#3a6a1a;color:#f0ead8;padding:9px 18px;box-shadow:2px 2px 0 #1a3a08}
        .bg:hover{background:#5a8a2a;transform:translateY(-1px)}
        .bo{background:transparent;color:#4a3a18;border:1.5px solid #8a7a5a;padding:8px 14px}
        .bo:hover{background:#e8e0cc}
        .bh{background:#8a7a30;color:#fff;border:none;padding:5px 12px;box-shadow:1px 1px 0 #5a4a10}
        .bh:hover{background:#aa9a40}
        .ctab{flex:1;padding:10px;border:none;border-bottom:3px solid transparent;background:transparent;font-family:'Playfair Display',serif;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#6a5a30;cursor:pointer;transition:all .15s;}
        .ctab.on{border-bottom-color:#3a6a1a;color:#3a6a1a}
        .ptrack{height:6px;background:#e0d8c8;border-radius:3px;overflow:hidden}
        .pfill{height:100%;background:#3a6a1a;border-radius:3px;transition:width .4s ease}
        @keyframes pop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
        .win{animation:pop .45s cubic-bezier(.175,.885,.32,1.275)}

        /* ── MOBILE ─────────────────────────────────────────────────────── */
        @media(max-width:767px){
          .puzzle-root{height:100dvh}
          .hdr{padding:6px 10px!important;max-height:50px!important}
          .hdr-title{font-size:14px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:calc(100vw - 130px)}
          .hdr-sub{display:none!important}
          .hdr-mistakes{display:none!important}
          .toolbar{padding:4px 8px!important;height:44px!important;overflow-x:auto!important;overflow-y:hidden!important;flex-wrap:nowrap!important;scrollbar-width:none;-webkit-overflow-scrolling:touch}
          .toolbar::-webkit-scrollbar{display:none}
          .clue-bar{cursor:pointer;transition:max-height .25s ease}
          .clue-bar:not(.expanded){min-height:36px!important;max-height:36px!important;overflow:hidden!important;padding-top:0!important;padding-bottom:0!important}
          .clue-bar.expanded{max-height:120px!important;height:auto!important}
          .clue-bar-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
          .clue-bar.expanded .clue-bar-text{white-space:normal;overflow:visible;text-overflow:clip}
          .pbar-wrap{padding:2px 10px!important}
          .pbar-label{display:none!important}
          .pbar-wrap .ptrack{height:4px!important}
          .grid-pane{min-height:40dvh!important}
          .clue-panel{flex:none!important;height:35dvh!important}
        }

        /* Hint menu */
        .hint-menu{position:absolute;top:calc(100% + 4px);left:0;background:#fff;border:1.5px solid #c8b888;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.15);z-index:200;min-width:210px;overflow:hidden;}
        .hint-item{padding:11px 14px;font-family:Lora,Georgia,serif;font-size:13px;cursor:pointer;color:#2c1a08;border-bottom:1px solid #f0e8d8;transition:background .1s;}
        .hint-item:last-child{border-bottom:none}
        .hint-item:hover{background:#e8f0d8}
        .hint-item.disabled{color:#bbb;cursor:not-allowed}
        .hint-item.disabled:hover{background:#fff}

        .confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9000;}
        .confirm-box{background:#fdfaf4;border-radius:12px;padding:2rem;max-width:340px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:Lora,Georgia,serif;}

        /* ── PRINT ──────────────────────────────────────────────────────── */
        .print-only{display:none}
        .print-wm{display:none}
        @media print{
          .print-wm{display:block;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-40deg);font-size:72px;font-weight:900;font-family:Arial,sans-serif;opacity:.06;color:#000;white-space:nowrap;z-index:9999;pointer-events:none;letter-spacing:4px}
        }
        @media print{
          html,body,#root{height:auto!important;overflow:visible!important}
          .puzzle-root{position:static!important}
          .no-print{display:none!important}
          .print-only{display:block!important}
          .screen-only{display:none!important}
          .p-cell{width:${PRINT_CS}px;height:${PRINT_CS}px;border:1px solid #333;display:inline-flex;align-items:center;justify-content:center;position:relative;background:#fff;vertical-align:top;}
          .p-blk{width:${PRINT_CS}px;height:${PRINT_CS}px;background:#000;display:inline-block;vertical-align:top;}
          .p-num{position:absolute;top:1px;left:1px;font-size:${Math.max(6, PRINT_CS/4)}px;line-height:1;font-family:Arial,sans-serif;}
          .p-clue{font-size:11px;line-height:1.5;font-family:Arial,sans-serif;margin-bottom:3px;}
          .p-clue-num{font-weight:bold;margin-right:4px;}
          @page{margin:0.6in 0.6in 0.6in 0.6in;size:letter portrait}
        }
      `}</style>

      {/* ══ CONFETTI (K-2) ══════════════════════════════════════════════════ */}
      {confettiPieces.length > 0 && (
        <div style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:8000, overflow:"hidden" }}>
          {confettiPieces.map(p => (
            <div key={p.id} style={{
              position:"absolute",
              left: p.left + "%",
              top: "-20px",
              width: p.size + "px",
              height: p.size + "px",
              background: p.color,
              borderRadius: p.round ? "50%" : "2px",
              animation: `confettiFall ${p.dur}s ${p.delay}s linear forwards`,
            }}/>
          ))}
        </div>
      )}

      {/* ══ K-2 MASCOT ════════════════════════════════════════════════════ */}
      {isEarlyLearner && !won && (
        <div style={{
          position:"fixed",
          bottom:"100px", right:"16px",
          zIndex:7000,
          fontSize:"2.4rem", lineHeight:1,
          transition:"transform .25s ease, filter .25s ease",
          transform:
            mascotMood === "happy"       ? "scale(1.45) rotate(-12deg)" :
            mascotMood === "encouraging" ? "scale(1.15) rotate(8deg)" :
            "scale(1)",
          filter: mascotMood === "happy" ? "drop-shadow(0 0 8px #ffeb3b)" : "none",
          pointerEvents:"none", userSelect:"none",
        }}>
          🕷️
          {mascotMood === "happy"       && <span style={{ position:"absolute", top:"-6px", right:"-6px", fontSize:"1rem" }}>⭐</span>}
          {mascotMood === "encouraging" && <span style={{ position:"absolute", top:"-6px", right:"-6px", fontSize:"1rem" }}>💪</span>}
        </div>
      )}

      {/* ══ PRINT-ONLY WORKSHEET ══════════════════════════════════════════ */}
      <div className="print-wm">
        {printMode === "answer-key" ? "ANSWER KEY" : "STUDENT"}
      </div>

      <div className="print-only" style={{ fontFamily:"Arial,sans-serif", padding:"0" }}>
        <div style={{ marginBottom:"14px", borderBottom:"2px solid #000", paddingBottom:"10px" }}>
          {printMode === "answer-key" ? (
            <>
              <div style={{ fontSize:"20px", fontWeight:"bold", fontFamily:"Georgia,serif", marginBottom:"4px" }}>{title} — Answer Key</div>
              <div style={{ fontSize:"11px", color:"#555" }}>{gradeLabel} · {words.length} Words · StoryClue.ai{isSpanish && " · AI-generated Spanish content"}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:"18px", fontWeight:"bold", fontFamily:"Georgia,serif", marginBottom:"6px" }}>{title}</div>
              <div style={{ fontSize:"11px", color:"#555", marginBottom:"10px" }}>{gradeLabel} · {words.length} Words · StoryClue.ai{isSpanish && " · AI-generated Spanish content — recommend review by fluent speaker"}</div>
              <div style={{ display:"flex", gap:"40px", fontSize:"12px" }}>
                <span>Name: <span style={{ display:"inline-block", width:"180px", borderBottom:"1px solid #000" }}>&nbsp;</span></span>
                <span>Grade: <span style={{ display:"inline-block", width:"60px", borderBottom:"1px solid #000" }}>&nbsp;</span></span>
                <span>Date: <span style={{ display:"inline-block", width:"100px", borderBottom:"1px solid #000" }}>&nbsp;</span></span>
              </div>
            </>
          )}
        </div>
        <div style={{ marginBottom:"16px", lineHeight:0 }}>
          {Array.from({ length:rows }, (_,r) => (
            <div key={r} style={{ display:"flex", lineHeight:0 }}>
              {Array.from({ length:cols }, (_,c) => {
                const letter = SOLUTION[r][c];
                if (!letter) return <div key={c} className="p-blk"/>;
                const num = NUMBERING[`${r},${c}`];
                return (
                  <div key={c} className="p-cell">
                    {num && <span className="p-num">{num}</span>}
                    {printMode === "answer-key" && (
                      <span style={{ fontSize:`${Math.max(7, PRINT_CS/2.5)}px`, fontWeight:"bold", fontFamily:"Arial,sans-serif", position:"relative", zIndex:1 }}>{letter}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:"32px", marginTop:"12px", borderTop:"1px solid #ccc", paddingTop:"10px" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"13px", fontWeight:"bold", fontFamily:"Georgia,serif", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid #ccc", paddingBottom:"4px" }}>Across</div>
            {ACROSS.map(w => <div key={w.number} className="p-clue"><span className="p-clue-num">{w.number}.</span>{getClue(w)}</div>)}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"13px", fontWeight:"bold", fontFamily:"Georgia,serif", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid #ccc", paddingBottom:"4px" }}>Down</div>
            {DOWN.map(w => <div key={w.number} className="p-clue"><span className="p-clue-num">{w.number}.</span>{getClue(w)}</div>)}
          </div>
        </div>
      </div>

      {/* ══ SCREEN UI ══════════════════════════════════════════════════════ */}
      <div className="puzzle-root screen-only">

        {/* TOP BAR */}
        <div className="no-print hdr" style={{
          background: isEarlyLearner
            ? "linear-gradient(135deg,#1b5e20,#388e3c)"
            : "linear-gradient(135deg,#2d4a18,#4a7a22)",
          padding:"10px 16px",
          borderBottom: isEarlyLearner ? "3px solid #66bb6a" : "3px solid #8a7a30",
          display:"flex", alignItems:"center", gap:"12px", flexShrink:0,
        }}>
          <button onClick={() => navigate("/")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"26px", padding:0 }} title="StoryClue home">🕷️</button>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="hdr-title" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize: isEarlyLearner ? "18px" : "17px", color:"#f0ead8", lineHeight:1.2 }}>
              {title}
              {phonicsMode && <span style={{ marginLeft:"8px", fontSize:"11px", background:"rgba(255,255,255,.2)", borderRadius:"10px", padding:"1px 7px" }}>🔤 Phonics</span>}
              {pictureMode && <span style={{ marginLeft:"6px", fontSize:"11px", background:"rgba(255,255,255,.2)", borderRadius:"10px", padding:"1px 7px" }}>🖼️ Pictures</span>}
            </div>
            <div className="hdr-sub" style={{ fontSize:"10px", color: isEarlyLearner ? "#a5d6a7" : "#a8d890", fontStyle:"italic", letterSpacing:"1px" }}>
              {gradeLabel ? `${gradeLabel} · ` : ""}{words.length} Words{isSpanish ? " · 🇪🇸 Spanish" : ""}{" · "}
              <span style={{ color:"#81c784" }}>🛡️ Safe for K-12</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
            <div style={{ textAlign:"right", color:"#f0ead8" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"18px", letterSpacing:"2px" }}>{formatTime(seconds)}</div>
              <div className="hdr-mistakes" style={{ fontSize:"10px", color: isEarlyLearner ? "#a5d6a7" : "#a8d890" }}>{mistakes} mistake{mistakes!==1?"s":""}</div>
            </div>
            <button onClick={toggleFullscreen} style={{ background:"rgba(255,255,255,.15)", border:"1.5px solid rgba(255,255,255,.4)", borderRadius:"6px", color:"#f0ead8", padding:"7px 11px", cursor:"pointer", fontSize:"18px", lineHeight:1, flexShrink:0 }} title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>⛶</button>
          </div>
        </div>

        {/* COMPACT TOOLBAR */}
        <div className="no-print toolbar" style={{ background:"#f0ead8", borderBottom:"1px solid #c8b888", padding:"6px 10px", flexShrink:0, display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
          <button className="btn bg" onClick={check} style={{ padding:"5px 14px", fontSize:"12px" }}>Check</button>

          <div style={{ position:"relative" }} ref={hintMenuRef}>
            <button className="btn bh" onClick={() => setShowHintMenu(v => !v)} disabled={hintLoading}
              style={{ padding:"5px 12px", fontSize:"12px", opacity:hintsLeft===0?0.5:1 }}>
              💡 Hint ({hintsLeft})
            </button>
            {showHintMenu && (
              <div className="hint-menu">
                <div className={`hint-item${hintsLeft===0||!activeWord?" disabled":""}`}
                  onClick={hintLoading||hintsLeft===0||!activeWord?undefined:hintSimplerClue}>
                  <strong>Simpler Clue</strong>
                  <div style={{ fontSize:"11px", color:"#888", marginTop:"2px" }}>Rewrite this clue in plainer language</div>
                </div>
                <div className={`hint-item${hintsLeft===0||!activeWord?" disabled":""}`}
                  onClick={hintsLeft===0||!activeWord?undefined:hintRevealLetter}>
                  <strong>Reveal a Letter</strong>
                  <div style={{ fontSize:"11px", color:"#888", marginTop:"2px" }}>Show the first empty letter in this word</div>
                </div>
              </div>
            )}
          </div>

          <button className="btn bo" onClick={() => setShowRevealConfirm(true)} style={{ padding:"4px 12px", fontSize:"12px" }}>Show Answer</button>
          <button className="btn bo" onClick={reset} style={{ padding:"4px 12px", fontSize:"12px" }}>Restart</button>
          <button className="btn bo" onClick={() => navigate("/create")} style={{ padding:"4px 12px", fontSize:"12px" }}>New Puzzle</button>
          <button className="btn bo" onClick={() => isTeacher ? setShowPrintDialog(true) : triggerPrint("student")}
            style={{ padding:"4px 10px", fontSize:"12px" }}>🖨️ Print</button>
          <button className="btn bo" onClick={share} style={{ padding:"4px 10px", fontSize:"12px" }}>🔗 Share</button>
          <button className="btn bo" onClick={toggleMute} style={{ padding:"4px 10px", fontSize:"14px" }} title={muted ? "Unmute audio" : "Mute audio"}>
            {muted ? "🔇" : "🔊"}
          </button>

          {/* Reader Mode: optional word list after reveal */}
          {revealed && grade === "adult" && (
            <button className="btn bo" onClick={() => setShowVocabModal(true)} style={{ padding:"4px 10px", fontSize:"12px", borderColor:"#3a6a1a", color:"#3a6a1a" }}>📚 Word List</button>
          )}

          {/* 6th+: Context Review button after win/reveal */}
          {(won || revealed) && !isLowerGrade && (
            <button className="btn bo" onClick={loadContext} disabled={contextLoading}
              style={{ padding:"4px 10px", fontSize:"12px", borderColor:"#3a6a1a", color:"#3a6a1a", opacity:contextLoading?0.6:1 }}>
              {contextLoading ? "Loading…" : "📖 Context Review"}
            </button>
          )}

          {shareMsg    && <span style={{ fontSize:"11px", color:"#3a6a1a", fontFamily:"Lora,serif", fontStyle:"italic" }}>{shareMsg}</span>}
          {hintMsg     && <span style={{ fontSize:"11px", color:"#8a7a30", fontFamily:"Lora,serif", fontStyle:"italic" }}>{hintMsg}</span>}
          {hintLoading && <span style={{ fontSize:"11px", color:"#8a7a30", fontFamily:"Lora,serif", fontStyle:"italic" }}>Getting simpler clue…</span>}
          {checked && !won && !revealed && <span style={{ fontSize:"11px", color:"#7a5a00", fontFamily:"Lora,serif", fontStyle:"italic" }}>🟢 correct · 🔴 wrong · 🟡 empty</span>}
        </div>

        {/* ACTIVE CLUE BAR */}
        <div
          className={`no-print clue-bar${clueBarExpanded?" expanded":""}`}
          style={{ background:"#2D5A1A", borderBottom:"3px solid #1a3a0a", padding:"8px 14px", flexShrink:0, minHeight:"40px", display:"flex", alignItems:"center", gap:"10px" }}
          onClick={() => setClueBarExpanded(v => !v)}
        >
          {activeWord ? (
            <>
              <span style={{ fontWeight:700, color:"#a8e878", fontFamily:"'Playfair Display',serif", fontSize:"13px", whiteSpace:"nowrap", flexShrink:0 }}>
                {activeWord.number} {activeWord.orientation.toUpperCase()}
              </span>

              {/* Picture mode: Wikipedia image with emoji fallback */}
              {pictureMode && (
                wordImages[activeWord.answer]
                  ? <img src={wordImages[activeWord.answer]} alt={activeWord.answer}
                      style={{ width:"44px", height:"44px", objectFit:"cover", borderRadius:"6px", flexShrink:0, border:"1.5px solid rgba(255,255,255,.3)" }} />
                  : activeWord.emoji && activeWord.emoji !== "🔤"
                    ? <span style={{ fontSize:"1.6rem", flexShrink:0 }}>{activeWord.emoji}</span>
                    : null
              )}

              <span className="clue-bar-text" style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#f0ead8", lineHeight:1.35, fontWeight:600, flex:1, minWidth:0 }}>
                {getClue(activeWord)}
                {simplerClues[wordKey(activeWord)] && <span style={{ fontSize:"11px", color:"#a8e878", marginLeft:"6px", fontWeight:400 }}>✏️ simplified</span>}
              </span>

              {/* Audio button — always visible, auto-played for K-2 via VocabModal; here it's on-demand */}
              <button
                onClick={e => { e.stopPropagation(); speakTextGraded(getClue(activeWord), grade, muted); }}
                title="Read clue aloud"
                style={{ background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.35)", borderRadius:"5px", padding:"3px 8px", cursor:"pointer", fontSize:"14px", lineHeight:1, flexShrink:0 }}
              >
                🔊
              </button>
            </>
          ) : (
            <span style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#a8c890", fontStyle:"italic" }}>
              ← Click any cell or clue to start
            </span>
          )}
        </div>

        {/* Spanish disclaimer */}
        {isSpanish && (
          <div className="no-print" style={{ background:"#fff8e8", borderBottom:"1px solid #e0c860", padding:"5px 14px", flexShrink:0 }}>
            <span style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#7a5500" }}>
              ⚠️ AI-generated Spanish content. We recommend review by a fluent Spanish speaker for classroom use.
            </span>
          </div>
        )}

        {/* PROGRESS BAR */}
        <div className="no-print pbar-wrap" style={{ padding:"5px 14px", background:"#f0ead8", borderBottom:"1px solid #c8b888", flexShrink:0 }}>
          <div className="pbar-label" style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:"#6a5a30", fontFamily:"Lora,serif", marginBottom:"3px" }}>
            <span>Progress</span><span>{pct}%</span>
          </div>
          <div className="ptrack"><div className="pfill" style={{ width:pct+"%" }}/></div>
        </div>

        {/* WIN BANNER — 3rd grade and above only */}
        {won && !isEarlyLearner && (
          <div className="win no-print" style={{ background:"linear-gradient(135deg,#2d5a1a,#4a8a2a)", color:"#f0ead8", padding:"10px 20px", textAlign:"center", flexShrink:0 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"18px" }}>🌟 Solved! Time: {formatTime(seconds)} · Mistakes: {mistakes} 🌟</div>
            <div style={{ fontSize:"12px", fontFamily:"Lora,serif", fontStyle:"italic", marginTop:"2px" }}>Well done, good and faithful solver!</div>
          </div>
        )}

        {/* THREE-PANE LAYOUT */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>

          {/* GRID PANE */}
          <div className="grid-pane" style={{ flex:"55", minHeight:0, overflowX:"auto", overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"10px", background:"#faf7f0" }}>
            <div style={{
              display:"inline-block",
              background:"rgba(255,254,245,.98)",
              border: isEarlyLearner ? "3px solid #66bb6a" : "2px solid #8a7a5a",
              borderRadius: isEarlyLearner ? "16px" : "6px",
              padding: isEarlyLearner ? "14px" : "12px",
              boxShadow: isEarlyLearner ? "4px 6px 0 #a5d6a7" : "3px 4px 0 #c8b870",
            }}>
              <table className={isEarlyLearner ? "el-grid" : ""} style={{ borderCollapse:"collapse" }}>
                <tbody>
                  {Array.from({ length:rows }, (_,r) => (
                    <tr key={r}>
                      {Array.from({ length:cols }, (_,c) => {
                        const letter = SOLUTION[r][c];
                        if (!letter) return <td key={c} style={{ padding:0 }}><div className="blk"/></td>;
                        const num = NUMBERING[`${r},${c}`];
                        const val = revealed ? letter : (cells[r][c] || "");
                        return (
                          <td key={c} style={{ padding:0 }}>
                            <div className="cwrap">
                              {num && <span className="cnum">{num}</span>}
                              <input
                                ref={el => { refs.current[`${r},${c}`] = el; }}
                                type="text" maxLength={1}
                                className={cellClass(r,c)}
                                value={val}
                                readOnly={revealed}
                                onChange={() => {}}
                                onClick={() => clickCell(r,c)}
                                onKeyDown={e => keyDown(r,c,e)}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="no-print" style={{ height:"4px", background:"linear-gradient(90deg,#3a6a1a,#8a7a5a,#3a6a1a)", flexShrink:0 }}/>

          {/* CLUE PANEL */}
          <div className="no-print clue-panel" style={{ flex:"40", display:"flex", flexDirection:"column", background:"#fff", minHeight:0 }}>
            <div style={{ display:"flex", borderBottom:"2px solid #e0d8c8", flexShrink:0 }}>
              <button className={`ctab${clueTab==="across"?" on":""}`} onClick={() => setClueTab("across")}>Across ({ACROSS.length})</button>
              <button className={`ctab${clueTab==="down"?" on":""}`}   onClick={() => setClueTab("down")}>Down ({DOWN.length})</button>
            </div>
            <div style={{
              overflowY:"auto", WebkitOverflowScrolling:"touch", flex:1, minHeight:0,
              padding: pictureMode && isEarlyLearner ? "8px 4px" : "4px 8px",
              display: pictureMode && isEarlyLearner ? "flex" : "block",
              flexWrap: "wrap",
              alignContent: "flex-start",
              gap: pictureMode && isEarlyLearner ? "4px" : "0",
            }}>
              {clueList.map(w => {
                const isActive  = activeWord?.number === w.number && activeWord?.orientation === clueTab;
                const isSimpler = !!simplerClues[wordKey(w)];
                const isK2Pic   = pictureMode && isEarlyLearner;
                const imgSrc    = wordImages[w.answer];
                const emoji     = w.emoji && w.emoji !== "🔤" ? w.emoji : null;

                if (isK2Pic) {
                  // ── K-2 Picture Mode: large picture AS the clue, no text ──────
                  return (
                    <div
                      key={`${clueTab}${w.number}`}
                      ref={isActive ? activeClueRef : null}
                      style={{
                        display:"flex", flexDirection:"column", alignItems:"center",
                        padding:"8px 4px", cursor:"pointer", borderRadius:"8px",
                        background: isActive ? "#e8f0d8" : "transparent",
                        border: `2px solid ${isActive ? "#2D5A1A" : "transparent"}`,
                        margin:"4px 2px", transition:"all .15s",
                      }}
                      onClick={() => { setActiveWord(w); setClueTab(w.orientation); focusFirstEmpty(w); }}
                    >
                      {imgSrc ? (
                        <img src={imgSrc} alt=""
                          style={{ width:"72px", height:"72px", objectFit:"cover", borderRadius:"8px",
                            border: isActive ? "2px solid #2D5A1A" : "2px solid #c8b888",
                            boxShadow: isActive ? "0 2px 8px rgba(45,90,26,.3)" : "none" }} />
                      ) : emoji ? (
                        <div style={{ fontSize:"3.2rem", lineHeight:1 }}>{emoji}</div>
                      ) : (
                        <div style={{ fontSize:"11px", color:"#8a7a50", fontFamily:"Lora,serif",
                          textAlign:"center", padding:"4px", lineHeight:1.4 }}>{getClue(w)}</div>
                      )}
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                        fontSize:"11px", color: isActive ? "#2D5A1A" : "#6a5a30", marginTop:"4px" }}>
                        {w.number}. {w.orientation === "across" ? "→" : "↓"}
                      </div>
                    </div>
                  );
                }

                // ── Standard clue display ──────────────────────────────────────
                return (
                  <div
                    key={`${clueTab}${w.number}`}
                    ref={isActive ? activeClueRef : null}
                    className={`clue${isActive?" act":""}${isSimpler?" simpler":""}${clueStatusClass(w)}`}
                    onClick={() => { setActiveWord(w); setClueTab(w.orientation); focusFirstEmpty(w); }}
                  >
                    <span className="cn">{w.number}.</span>
                    {/* Picture mode: Wikipedia image thumbnail with emoji fallback */}
                    {pictureMode && (
                      imgSrc
                        ? <img src={imgSrc} alt={w.answer}
                            style={{ width:"26px", height:"26px", objectFit:"cover", borderRadius:"4px", marginRight:"6px", verticalAlign:"middle", border:"1px solid #c8b888" }} />
                        : emoji
                          ? <span style={{ fontSize:"1.4rem", marginRight:"6px", verticalAlign:"middle" }}>{emoji}</span>
                          : null
                    )}
                    {getClue(w)}
                    {isSimpler && <span style={{ fontSize:"10px", color:"#8a7a30", marginLeft:"5px" }}>✏️</span>}
                  </div>
                );
              })}
            </div>
          </div>

        </div>{/* end three-pane */}
      </div>{/* end puzzle-root */}

      {/* ══ K-2 WIN CELEBRATION (full screen) ════════════════════════════ */}
      {won && isEarlyLearner && (
        <div style={{
          position:"fixed", inset:0,
          background:"linear-gradient(135deg,rgba(27,94,32,.96),rgba(56,142,60,.92))",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          zIndex:9100, textAlign:"center", padding:"20px",
        }}>
          <div style={{ fontSize:"5rem", marginBottom:"12px", animation:"celebBounce .7s ease-in-out infinite alternate" }}>🎉</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(2rem,8vw,3.5rem)", color:"#f0ead8", marginBottom:"10px" }}>
            You Did It! 🌟
          </div>
          <div style={{ fontFamily:"Lora,serif", fontSize:"17px", color:"#a5d6a7", marginBottom:"18px" }}>
            Amazing work! You solved the whole puzzle!
          </div>
          <div style={{ fontSize:"3rem", marginBottom:"18px" }}>⭐🕷️⭐</div>
          <div style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#81c784", marginBottom:"24px" }}>
            Time: {formatTime(seconds)} · Mistakes: {mistakes}
          </div>
          <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", justifyContent:"center" }}>
            <button onClick={() => navigate("/create")} style={{ padding:"14px 28px", background:"#f0ead8", color:"#1b5e20", border:"none", borderRadius:"12px", fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"16px", cursor:"pointer", boxShadow:"3px 3px 0 rgba(0,0,0,.25)" }}>
              New Puzzle! →
            </button>
            <button onClick={() => { setWon(false); setShowFeedback(false); }} style={{ padding:"14px 20px", background:"transparent", color:"#f0ead8", border:"2px solid rgba(255,255,255,.5)", borderRadius:"12px", fontFamily:"Lora,serif", fontWeight:600, fontSize:"14px", cursor:"pointer" }}>
              See Puzzle
            </button>
          </div>
        </div>
      )}

      {/* ══ REVEAL CONFIRMATION ══════════════════════════════════════════ */}
      {showRevealConfirm && (
        <div className="confirm-overlay" onClick={() => setShowRevealConfirm(false)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:"2.2rem", marginBottom:"0.5rem" }}>🤔</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", color:"#2D5A1A", margin:"0 0 0.7rem", fontSize:"1.3rem" }}>Are you sure?</h2>
            <p style={{ color:"#555", marginBottom:"1.5rem", lineHeight:1.5, fontSize:"0.95rem" }}>Showing the answer will end your puzzle session.</p>
            <div style={{ display:"flex", gap:"0.8rem", justifyContent:"center" }}>
              <button onClick={doReveal} style={{ background:"#c0392b", color:"#fff", border:"none", borderRadius:"8px", padding:"0.65rem 1.4rem", fontFamily:"Lora,Georgia,serif", fontWeight:600, fontSize:"0.95rem", cursor:"pointer" }}>Yes, show the answer</button>
              <button onClick={() => setShowRevealConfirm(false)} style={{ background:"#2D5A1A", color:"#fff", border:"none", borderRadius:"8px", padding:"0.65rem 1.4rem", fontFamily:"Lora,Georgia,serif", fontWeight:600, fontSize:"0.95rem", cursor:"pointer" }}>No, keep trying</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ VOCAB STUDY MODAL ════════════════════════════════════════════ */}
      {showVocabModal && (
        <VocabModal
          words={words}
          grade={grade}
          phonicsMode={phonicsMode}
          muted={muted}
          continueAvailable={!continueUsed}
          readerMode={grade === "adult"}
          onContinue={handleVocabContinue}
          onRestart={handleVocabRestart}
        />
      )}

      {/* ══ PRINT DIALOG ═════════════════════════════════════════════════ */}
      {showPrintDialog && (
        <div className="confirm-overlay" onClick={() => setShowPrintDialog(false)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()} style={{ maxWidth:"380px" }}>
            <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>🖨️</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", color:"#2D5A1A", margin:"0 0 0.5rem", fontSize:"1.3rem" }}>Print Options</h2>
            <p style={{ color:"#666", marginBottom:"1.5rem", fontFamily:"Lora,serif", fontSize:"0.9rem", lineHeight:1.5 }}>Choose what to print:</p>
            <div style={{ display:"flex", gap:"12px" }}>
              <button onClick={() => { setShowPrintDialog(false); triggerPrint("student"); }}
                style={{ flex:1, padding:"16px 10px", background:"#f4efe4", border:"2px solid #c8b888", borderRadius:"8px", cursor:"pointer", fontFamily:"Lora,Georgia,serif", textAlign:"center" }}>
                <div style={{ fontSize:"1.6rem", marginBottom:"6px" }}>📄</div>
                <div style={{ fontWeight:700, fontSize:"0.95rem", color:"#2c1a08", marginBottom:"4px" }}>Student Worksheet</div>
                <div style={{ fontSize:"0.78rem", color:"#8a7a50" }}>Blank grid + clues<br/>STUDENT watermark</div>
              </button>
              <button onClick={() => { setShowPrintDialog(false); triggerPrint("answer-key"); }}
                style={{ flex:1, padding:"16px 10px", background:"#fffbe8", border:"2px solid #d4a020", borderRadius:"8px", cursor:"pointer", fontFamily:"Lora,Georgia,serif", textAlign:"center" }}>
                <div style={{ fontSize:"1.6rem", marginBottom:"6px" }}>🔑</div>
                <div style={{ fontWeight:700, fontSize:"0.95rem", color:"#7a5000", marginBottom:"4px" }}>Answer Key</div>
                <div style={{ fontSize:"0.78rem", color:"#9a7030" }}>Filled grid + clues<br/>ANSWER KEY watermark</div>
              </button>
            </div>
            <button onClick={() => setShowPrintDialog(false)}
              style={{ marginTop:"1rem", background:"none", border:"none", color:"#888", fontFamily:"Lora,serif", fontSize:"0.9rem", cursor:"pointer", textDecoration:"underline" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ══ CONTEXT REVIEW MODAL (Item 6) ════════════════════════════════ */}
      {showContextReview && contextSentences && (
        <ContextReviewModal
          sentences={contextSentences}
          grade={grade}
          onClose={() => setShowContextReview(false)}
        />
      )}

      {/* ══ FEEDBACK MODAL ═══════════════════════════════════════════════ */}
      {showFeedback && (
        <FeedbackModal
          puzzleTitle={title}
          grade={grade}
          wasRevealed={revealed}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </>
  );
}
