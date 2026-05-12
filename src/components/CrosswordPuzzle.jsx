import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { decodePuzzle } from "../utils/urlEncoder";
import { buildGrid, buildNumbering } from "../utils/layoutBuilder";
import FeedbackModal from "./FeedbackModal";
import VocabModal from "./VocabModal";

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const GRADE_LABELS = {
  k:"K", "1":"1st", "2":"2nd", "3":"3rd", "4":"4th", "5":"5th",
  "6":"6th", "7":"7th", "8":"8th", "9-10":"9th–10th",
  "11-12":"11th–12th", "adult":"Reader Mode",
};

const MAX_HINTS = 3;

export default function CrosswordPuzzle() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const puzzleData = (() => {
    const p = searchParams.get("p");
    if (!p) return null;
    return decodePuzzle(p);
  })();

  if (!puzzleData) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#faf7f0", fontFamily:"Georgia,serif" }}>
        <div style={{ fontSize:"48px", marginBottom:"16px" }}>🕷️</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", color:"#2d4a18", marginBottom:"12px" }}>Puzzle not found</div>
        <div style={{ color:"#6a5a30", marginBottom:"24px", fontFamily:"Lora,serif" }}>This puzzle link may be invalid or expired.</div>
        <button onClick={() => navigate("/create")} style={{ background:"#3a6a1a", color:"#f0ead8", border:"none", borderRadius:"4px", padding:"10px 24px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
          Create a New Puzzle
        </button>
      </div>
    );
  }

  return <PuzzleBoard {...puzzleData} />;
}

function PuzzleBoard({ title, grade, language = "english", rows, cols, words }) {
  const navigate = useNavigate();
  const SOLUTION  = buildGrid(words, rows, cols);
  const NUMBERING = buildNumbering(words, rows, cols);

  const ACROSS = words.filter(w => w.orientation === "across").sort((a, b) => a.number - b.number);
  const DOWN   = words.filter(w => w.orientation === "down").sort((a, b) => a.number - b.number);

  // ── Core state ────────────────────────────────────────────────────────────
  const [cells,        setCells]        = useState(() => Array.from({ length: rows }, () => Array(cols).fill("")));
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

  // ── Reveal-confirm state ──────────────────────────────────────────────────
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);

  // ── Vocab study modal state ───────────────────────────────────────────────
  const [showVocabModal,  setShowVocabModal]  = useState(false);
  const [continueUsed,    setContinueUsed]    = useState(false); // persists per session
  const [clueBarExpanded, setClueBarExpanded] = useState(false); // mobile: tap clue bar to expand

  const refs             = useRef({});
  const timerRef         = useRef(null);
  const activeClueRef    = useRef(null);
  const hintMenuRef      = useRef(null);
  const userExitedFsRef  = useRef(false); // true only when user intentionally clicked toggle

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerActive && !won) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerActive, won]);

  // Item 1: fullscreen persistence — auto re-enter if browser exits unexpectedly
  useEffect(() => {
    function onFsChange() {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isFs) {
        // Just entered — clear the intentional-exit flag
        userExitedFsRef.current = false;
      } else if (!userExitedFsRef.current) {
        // Exited without the user clicking the toggle — re-enter
        setTimeout(() => {
          document.documentElement.requestFullscreen?.().catch(() => {});
        }, 50);
      }
    }
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Item 8: reliable scroll — "auto" + "center"
  useEffect(() => {
    activeClueRef.current?.scrollIntoView({ behavior: "auto", block: "center" });
  }, [activeWord]);

  useEffect(() => {
    // Don't show feedback while the vocab modal is open — wait until it closes
    if ((won || revealed) && !feedbackShown && !showVocabModal) {
      const timer = setTimeout(() => { setShowFeedback(true); setFeedbackShown(true); }, 1200);
      return () => clearTimeout(timer);
    }
  }, [won, revealed, feedbackShown, showVocabModal]);

  // Close hint menu on outside click
  useEffect(() => {
    function onOutside(e) {
      if (hintMenuRef.current && !hintMenuRef.current.contains(e.target)) {
        setShowHintMenu(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function wordKey(w) { return `${w.orientation}-${w.number}`; }

  function getClue(w) { return simplerClues[wordKey(w)] || w.clue; }

  // Item 9: word-state helpers for strikethrough
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

  // Returns extra CSS class(es) for a clue row
  function clueStatusClass(w) {
    if (isWordCorrect(w))                        return " chk-ok";   // green strikethrough
    if (checked && isWordFilled(w))              return " chk-err";  // red, no strikethrough
    if (isWordFilled(w))                         return " filled";   // gray strikethrough
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

  // Jump to first empty cell in word, or first cell if all filled
  function focusFirstEmpty(w) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.orientation === "down" ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      if (!cells[r][c]) { setSel({ r, c }); focus(r, c); return; }
    }
    setSel({ r: w.starty, c: w.startx });
    focus(w.starty, w.startx);
  }

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
        if (SOLUTION[nr]?.[nc]) { setSel({ r: nr, c: nc }); focus(nr, nc); }
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
      const next = cells.map(row => [...row]);
      if (next[r][c] && next[r][c] !== letter) setMistakes(m => m + 1);
      next[r][c] = letter;
      setCells(next); setChecked(false);
      if (activeWord) {
        const nr = r + (activeWord.orientation === "down" ? 1 : 0);
        const nc = c + (activeWord.orientation === "across" ? 1 : 0);
        if (SOLUTION[nr]?.[nc]) { setSel({r:nr,c:nc}); setActiveWord(wordAt(nr,nc,activeWord.orientation)); focus(nr,nc); }
      }
    }
  }

  function check() {
    setChecked(true);
    const allOk = SOLUTION.every((row, r) => row.every((cell, c) => !cell || cells[r][c] === cell));
    if (allOk) { setWon(true); setTimerActive(false); }
  }

  function doReveal() {
    setShowRevealConfirm(false);
    setTimerActive(false);
    setChecked(false);
    if (grade === "adult") {
      // Reader Mode: fill grid immediately, mark revealed — no modal
      setCells(SOLUTION.map(row => row.map(c => c || "")));
      setRevealed(true);
    } else {
      // K-12: open vocab study modal first — grid stays untouched until modal resolves
      setShowVocabModal(true);
    }
  }

  function handleVocabContinue() {
    setContinueUsed(true);
    setShowVocabModal(false);
    // Feedback modal will appear after vocab modal closes (handled by effect)
  }

  function handleVocabRestart() {
    setShowVocabModal(false);
    if (continueUsed) {
      // 2nd reveal "last resort" — fill answers now and mark revealed
      setCells(SOLUTION.map(row => row.map(c => c || "")));
      setRevealed(true); setChecked(false);
    } else {
      // 1st reveal → wipe grid, student starts fresh
      reset();
    }
  }

  function reset() {
    setCells(Array.from({ length: rows }, () => Array(cols).fill("")));
    setChecked(false); setRevealed(false); setWon(false);
    setSel(null); setActiveWord(null);
    setSeconds(0); setTimerActive(false); setMistakes(0);
    setShowFeedback(false); setFeedbackShown(false);
    setHintsLeft(MAX_HINTS); setSimplerClues({}); setHintMsg("");
  }

  function share() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setShareMsg("Copied!"); setTimeout(() => setShareMsg(""), 2000);
    }).catch(() => { setShareMsg("Copy URL from browser"); setTimeout(() => setShareMsg(""), 3000); });
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      userExitedFsRef.current = false;
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      userExitedFsRef.current = true; // intentional exit — do NOT re-enter
      document.exitFullscreen?.();
    }
  }

  // ── Hint: reveal one letter ───────────────────────────────────────────────
  function hintRevealLetter() {
    if (hintsLeft <= 0) { setHintMsg("No hints left!"); setShowHintMenu(false); return; }
    if (!activeWord) { setHintMsg("Click a word first."); setShowHintMenu(false); return; }
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
    if (!activeWord) { setHintMsg("Click a word first."); setShowHintMenu(false); return; }
    const key = wordKey(activeWord);
    if (simplerClues[key]) { setHintMsg("Already simplified!"); setShowHintMenu(false); return; }

    setHintLoading(true);
    setShowHintMenu(false);
    setHintMsg("Getting a simpler clue...");

    try {
      const res = await fetch("/api/simplify-clue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ word: activeWord.answer, clue: activeWord.clue, grade }),
      });
      const data = await res.json();
      if (data.clue) {
        setSimplerClues(prev => ({ ...prev, [key]: data.clue }));
        setHintsLeft(h => h - 1);
        setHintMsg(`Clue simplified! (${hintsLeft - 1} hint${hintsLeft - 1 !== 1 ? "s" : ""} left)`);
      } else {
        setHintMsg("Couldn't simplify that clue. Try again.");
      }
    } catch {
      setHintMsg("Couldn't reach the server. Try again.");
    }
    setHintLoading(false);
    setTimeout(() => setHintMsg(""), 4000);
  }

  function cellClass(r, c) {
    const parts = ["ci"];
    const isSel = sel?.r === r && sel?.c === c;
    const aw    = activeWord;
    const inW   = aw && (
      aw.orientation === "across"
        ? aw.starty === r && c >= aw.startx && c < aw.startx + aw.answer.length
        : aw.startx === c && r >= aw.starty && r < aw.starty + aw.answer.length
    );
    // Mutually exclusive priority: selected > word-highlight > revealed > checked
    if      (isSel)                    parts.push("sel");
    else if (inW)                      parts.push("hi");
    else if (revealed)                 parts.push("rev");
    else if (checked && SOLUTION[r][c]) {
      if (!cells[r][c]) parts.push("mt");
      else parts.push(cells[r][c] === SOLUTION[r][c] ? "ok" : "err");
    }
    return parts.join(" ");
  }

  const totalCells  = SOLUTION.flat().filter(Boolean).length;
  const correct     = cells.flat().filter((v, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    return SOLUTION[r][c] && v === SOLUTION[r][c];
  }).length;
  const pct         = totalCells ? Math.round(correct / totalCells * 100) : 0;
  const clueList    = clueTab === "across" ? ACROSS : DOWN;
  const gradeLabel  = GRADE_LABELS[grade] ? `${GRADE_LABELS[grade]} Grade` : "";
  const isSpanish   = language === "spanish" || language?.startsWith("bilingual");

  // Print cell size — fits full grid within letter-page margins
  const PRINT_CS = Math.min(22, Math.floor(540 / cols));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

        /* Item 2 & 4: position:fixed layout — keyboard on iPad/mobile doesn't push content */
        html,body,#root{height:100%;overflow:hidden}
        .puzzle-root{position:fixed;inset:0;display:flex;flex-direction:column;background:#faf7f0;font-family:Georgia,serif;}

        /* Item 6: cell numbers 11px, no mobile reduction */
        :root{--cs:42px;--fs:17px;--ns:11px}
        @media(max-width:480px){:root{--cs:30px;--fs:13px}}

        .ci{width:var(--cs);height:var(--cs);border:1.5px solid #8a7a5a;background:#fffef5;text-align:center;font-size:var(--fs);font-weight:700;font-family:Lora,Georgia,serif;color:#1a1008;text-transform:uppercase;cursor:pointer;outline:none;caret-color:transparent;padding:0;transition:background .1s;}

        /* Item 5 & 7: NYT-style colors */
        .ci.hi{background:#C8E6C0}
        .ci.sel{background:#2D5A1A!important;color:#fff}

        .ci.ok{background:#bff0b0!important;color:#1a6010}
        .ci.err{background:#ffb0b0!important;color:#8b1010}
        .ci.rev{background:#fff3b0!important;color:#7a5500}
        .ci.mt{background:#ffe8a0!important}
        .blk{width:var(--cs);height:var(--cs);background:#2a1a08;display:block}
        .cwrap{position:relative;display:inline-block;width:var(--cs);height:var(--cs)}
        .cnum{position:absolute;top:2px;left:2px;font-size:var(--ns);color:#5a4010;font-weight:700;font-family:Lora,Georgia,serif;pointer-events:none;z-index:2;line-height:1;}

        /* Item 9: clue strikethrough states */
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

        /* ── MOBILE LAYOUT (<768px) ─────────────────────────────────────── */
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

        /* Confirm overlay */
        .confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9000;}
        .confirm-box{background:#fdfaf4;border-radius:12px;padding:2rem;max-width:340px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:Lora,Georgia,serif;}

        /* ── PRINT STYLES ── */
        .print-only{display:none}
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

      {/* ══ PRINT-ONLY WORKSHEET ══════════════════════════════════════════ */}
      <div className="print-only" style={{ fontFamily:"Arial,sans-serif", padding:"0" }}>
        <div style={{ marginBottom:"14px", borderBottom:"2px solid #000", paddingBottom:"10px" }}>
          <div style={{ fontSize:"18px", fontWeight:"bold", fontFamily:"Georgia,serif", marginBottom:"6px" }}>{title}</div>
          <div style={{ fontSize:"11px", color:"#555", marginBottom:"10px" }}>
            {gradeLabel} · {words.length} Words · StoryClue.ai
            {isSpanish && " · AI-generated Spanish content — recommend review by fluent speaker"}
          </div>
          <div style={{ display:"flex", gap:"40px", fontSize:"12px" }}>
            <span>Name: <span style={{ display:"inline-block", width:"180px", borderBottom:"1px solid #000" }}>&nbsp;</span></span>
            <span>Grade: <span style={{ display:"inline-block", width:"60px", borderBottom:"1px solid #000" }}>&nbsp;</span></span>
            <span>Date: <span style={{ display:"inline-block", width:"100px", borderBottom:"1px solid #000" }}>&nbsp;</span></span>
          </div>
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
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:"32px", marginTop:"12px", borderTop:"1px solid #ccc", paddingTop:"10px" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"13px", fontWeight:"bold", fontFamily:"Georgia,serif", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid #ccc", paddingBottom:"4px" }}>Across</div>
            {ACROSS.map(w => (
              <div key={w.number} className="p-clue">
                <span className="p-clue-num">{w.number}.</span>{getClue(w)}
              </div>
            ))}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"13px", fontWeight:"bold", fontFamily:"Georgia,serif", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid #ccc", paddingBottom:"4px" }}>Down</div>
            {DOWN.map(w => (
              <div key={w.number} className="p-clue">
                <span className="p-clue-num">{w.number}.</span>{getClue(w)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ SCREEN UI — Items 1,2,3,4 fixed layout ══════════════════════ */}
      <div className="puzzle-root screen-only">

        {/* TOP BAR */}
        <div className="no-print hdr" style={{ background:"linear-gradient(135deg,#2d4a18,#4a7a22)", padding:"10px 16px", borderBottom:"3px solid #8a7a30", display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
          <button onClick={() => navigate("/")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"26px", padding:0 }} title="StoryClue home">🕷️</button>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="hdr-title" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"17px", color:"#f0ead8", lineHeight:1.2 }}>{title}</div>
            <div className="hdr-sub" style={{ fontSize:"10px", color:"#a8d890", fontStyle:"italic", letterSpacing:"1px" }}>
              {gradeLabel ? `${gradeLabel} · ` : ""}{words.length} Words{isSpanish ? " · 🇪🇸 Spanish" : ""}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
            <div style={{ textAlign:"right", color:"#f0ead8" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"18px", letterSpacing:"2px" }}>{formatTime(seconds)}</div>
              <div className="hdr-mistakes" style={{ fontSize:"10px", color:"#a8d890" }}>{mistakes} mistake{mistakes!==1?"s":""}</div>
            </div>
            {/* Item 1: fullscreen button reflects live state */}
            <button
              onClick={toggleFullscreen}
              style={{ background:"rgba(255,255,255,.15)", border:"1.5px solid rgba(255,255,255,.4)", borderRadius:"6px", color:"#f0ead8", padding:"7px 11px", cursor:"pointer", fontSize:"18px", lineHeight:1, flexShrink:0 }}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >{isFullscreen ? "⛶" : "⛶"}</button>
          </div>
        </div>

        {/* COMPACT TOOLBAR */}
        <div className="no-print toolbar" style={{ background:"#f0ead8", borderBottom:"1px solid #c8b888", padding:"6px 10px", flexShrink:0, display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
          <button className="btn bg" onClick={check} style={{ padding:"5px 14px", fontSize:"12px" }}>Check</button>

          {/* Hint button with dropdown */}
          <div style={{ position:"relative" }} ref={hintMenuRef}>
            <button
              className="btn bh"
              onClick={() => setShowHintMenu(v => !v)}
              disabled={hintLoading}
              style={{ padding:"5px 12px", fontSize:"12px", opacity: hintsLeft === 0 ? 0.5 : 1 }}
            >
              💡 Hint ({hintsLeft})
            </button>
            {showHintMenu && (
              <div className="hint-menu">
                <div
                  className={`hint-item${hintsLeft === 0 || !activeWord ? " disabled" : ""}`}
                  onClick={hintLoading || hintsLeft === 0 || !activeWord ? undefined : hintSimplerClue}
                >
                  <strong>Simpler Clue</strong>
                  <div style={{ fontSize:"11px", color:"#888", marginTop:"2px" }}>Rewrite this clue in plainer language</div>
                </div>
                <div
                  className={`hint-item${hintsLeft === 0 || !activeWord ? " disabled" : ""}`}
                  onClick={hintsLeft === 0 || !activeWord ? undefined : hintRevealLetter}
                >
                  <strong>Reveal a Letter</strong>
                  <div style={{ fontSize:"11px", color:"#888", marginTop:"2px" }}>Show the first empty letter in this word</div>
                </div>
              </div>
            )}
          </div>

          <button className="btn bo" onClick={() => setShowRevealConfirm(true)} style={{ padding:"4px 12px", fontSize:"12px" }}>Show Answer</button>
          <button className="btn bo" onClick={reset} style={{ padding:"4px 12px", fontSize:"12px" }}>Restart</button>
          <button className="btn bo" onClick={() => navigate("/create")} style={{ padding:"4px 12px", fontSize:"12px" }}>New Puzzle</button>
          <button className="btn bo" onClick={() => window.print()} style={{ padding:"4px 10px", fontSize:"12px" }}>🖨️ Print</button>
          <button className="btn bo" onClick={share} style={{ padding:"4px 10px", fontSize:"12px" }}>🔗 Share</button>
          {/* Reader Mode: optional word list after reveal */}
          {revealed && grade === "adult" && (
            <button className="btn bo" onClick={() => setShowVocabModal(true)} style={{ padding:"4px 10px", fontSize:"12px", borderColor:"#3a6a1a", color:"#3a6a1a" }}>📚 Word List</button>
          )}
          {shareMsg   && <span style={{ fontSize:"11px", color:"#3a6a1a", fontFamily:"Lora,serif", fontStyle:"italic" }}>{shareMsg}</span>}
          {hintMsg    && <span style={{ fontSize:"11px", color:"#8a7a30", fontFamily:"Lora,serif", fontStyle:"italic" }}>{hintMsg}</span>}
          {hintLoading && <span style={{ fontSize:"11px", color:"#8a7a30", fontFamily:"Lora,serif", fontStyle:"italic" }}>Getting simpler clue…</span>}
          {checked && !won && !revealed && <span style={{ fontSize:"11px", color:"#7a5a00", fontFamily:"Lora,serif", fontStyle:"italic" }}>🟢 correct · 🔴 wrong · 🟡 empty</span>}
        </div>

        {/* Item 3: ACTIVE CLUE BAR — always visible above the puzzle; tap to expand on mobile */}
        <div
          className={`no-print clue-bar${clueBarExpanded ? " expanded" : ""}`}
          style={{ background:"#2D5A1A", borderBottom:"3px solid #1a3a0a", padding:"8px 14px", flexShrink:0, minHeight:"40px", display:"flex", alignItems:"center", gap:"10px" }}
          onClick={() => setClueBarExpanded(v => !v)}
        >
          {activeWord ? (
            <>
              <span style={{ fontWeight:700, color:"#a8e878", fontFamily:"'Playfair Display',serif", fontSize:"13px", whiteSpace:"nowrap", flexShrink:0 }}>
                {activeWord.number} {activeWord.orientation.toUpperCase()}
              </span>
              <span className="clue-bar-text" style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#f0ead8", lineHeight:1.35, fontWeight:600, flex:1, minWidth:0 }}>
                {getClue(activeWord)}
                {simplerClues[wordKey(activeWord)] && <span style={{ fontSize:"11px", color:"#a8e878", marginLeft:"6px", fontWeight:400 }}>✏️ simplified</span>}
              </span>
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

        {/* WIN BANNER */}
        {won && (
          <div className="win no-print" style={{ background:"linear-gradient(135deg,#2d5a1a,#4a8a2a)", color:"#f0ead8", padding:"10px 20px", textAlign:"center", flexShrink:0 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"18px" }}>🌟 Solved! Time: {formatTime(seconds)} · Mistakes: {mistakes} 🌟</div>
            <div style={{ fontSize:"12px", fontFamily:"Lora,serif", fontStyle:"italic", marginTop:"2px" }}>Well done, good and faithful solver!</div>
          </div>
        )}

        {/* Item 2: THREE-PANE — vertically stacked: grid (55% height) → clues (40% height) */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>

          {/* PANE 2: GRID — 55% of remaining height, scrollable both directions */}
          <div className="grid-pane" style={{ flex:"55", minHeight:0, overflowX:"auto", overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"10px", background:"#faf7f0" }}>
            <div style={{ display:"inline-block", background:"rgba(255,254,245,.98)", border:"2px solid #8a7a5a", borderRadius:"6px", padding:"12px", boxShadow:"3px 4px 0 #c8b870" }}>
              <table style={{ borderCollapse:"collapse" }}>
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

          {/* HORIZONTAL DIVIDER between grid and clue panel */}
          <div className="no-print" style={{ height:"4px", background:"linear-gradient(90deg,#3a6a1a,#8a7a5a,#3a6a1a)", flexShrink:0 }}/>

          {/* PANE 3: CLUE PANEL — 40% of remaining height, independently scrollable */}
          <div className="no-print clue-panel" style={{ flex:"40", display:"flex", flexDirection:"column", background:"#fff", minHeight:0 }}>
            {/* Clue tabs */}
            <div style={{ display:"flex", borderBottom:"2px solid #e0d8c8", flexShrink:0 }}>
              <button className={`ctab${clueTab==="across"?" on":""}`} onClick={() => setClueTab("across")}>Across ({ACROSS.length})</button>
              <button className={`ctab${clueTab==="down"?" on":""}`} onClick={() => setClueTab("down")}>Down ({DOWN.length})</button>
            </div>
            {/* Clue list — Items 8, 9, 10 */}
            <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch", flex:1, minHeight:0, padding:"4px 8px" }}>
              {clueList.map(w => {
                const isActive  = activeWord?.number === w.number && activeWord?.orientation === clueTab;
                const isSimpler = !!simplerClues[wordKey(w)];
                const statusCls = clueStatusClass(w);
                return (
                  <div
                    key={`${clueTab}${w.number}`}
                    ref={isActive ? activeClueRef : null}
                    className={`clue${isActive ? " act" : ""}${isSimpler ? " simpler" : ""}${statusCls}`}
                    onClick={() => {
                      setActiveWord(w);
                      setClueTab(w.orientation);
                      focusFirstEmpty(w);
                    }}
                  >
                    <span className="cn">{w.number}.</span>
                    {getClue(w)}
                    {isSimpler && <span style={{ fontSize:"10px", color:"#8a7a30", marginLeft:"5px" }}>✏️</span>}
                  </div>
                );
              })}
            </div>
          </div>

        </div>{/* end three-pane */}
      </div>{/* end puzzle-root */}

      {/* ══ REVEAL CONFIRMATION ══════════════════════════════════════════ */}
      {showRevealConfirm && (
        <div className="confirm-overlay" onClick={() => setShowRevealConfirm(false)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:"2.2rem", marginBottom:"0.5rem" }}>🤔</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", color:"#2D5A1A", margin:"0 0 0.7rem", fontSize:"1.3rem" }}>
              Are you sure?
            </h2>
            <p style={{ color:"#555", marginBottom:"1.5rem", lineHeight:1.5, fontSize:"0.95rem" }}>
              Showing the answer will end your puzzle session.
            </p>
            <div style={{ display:"flex", gap:"0.8rem", justifyContent:"center" }}>
              <button
                onClick={doReveal}
                style={{ background:"#c0392b", color:"#fff", border:"none", borderRadius:"8px", padding:"0.65rem 1.4rem", fontFamily:"Lora,Georgia,serif", fontWeight:600, fontSize:"0.95rem", cursor:"pointer" }}
              >
                Yes, show the answer
              </button>
              <button
                onClick={() => setShowRevealConfirm(false)}
                style={{ background:"#2D5A1A", color:"#fff", border:"none", borderRadius:"8px", padding:"0.65rem 1.4rem", fontFamily:"Lora,Georgia,serif", fontWeight:600, fontSize:"0.95rem", cursor:"pointer" }}
              >
                No, keep trying
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ VOCAB STUDY MODAL ════════════════════════════════════════════ */}
      {showVocabModal && (
        <VocabModal
          words={words}
          continueAvailable={!continueUsed}
          readerMode={grade === "adult"}
          onContinue={handleVocabContinue}
          onRestart={handleVocabRestart}
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
