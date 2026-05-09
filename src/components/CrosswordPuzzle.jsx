import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { decodePuzzle } from "../utils/urlEncoder";
import { buildGrid, buildNumbering } from "../utils/layoutBuilder";
import FeedbackModal from "./FeedbackModal";

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const GRADE_LABELS = {
  k:"K", "1":"1st", "2":"2nd", "3":"3rd", "4":"4th", "5":"5th",
  "6":"6th", "7":"7th", "8":"8th", "9-10":"9th–10th",
  "11-12":"11th–12th", "adult":"Reader Mode",
};

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

function PuzzleBoard({ title, grade, rows, cols, words }) {
  const navigate = useNavigate();
  const SOLUTION = buildGrid(words, rows, cols);
  const NUMBERING = buildNumbering(words, rows, cols);

  const ACROSS = words.filter(w => w.orientation === "across").sort((a, b) => a.number - b.number);
  const DOWN   = words.filter(w => w.orientation === "down").sort((a, b) => a.number - b.number);

  const [cells, setCells] = useState(() => Array.from({ length: rows }, () => Array(cols).fill("")));
  const [sel, setSel] = useState(null);
  const [activeWord, setActiveWord] = useState(null);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [won, setWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [clueTab, setClueTab] = useState("across");
  const [shareMsg, setShareMsg] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackShown, setFeedbackShown] = useState(false);
  const refs = useRef({});
  const timerRef = useRef(null);
  const activeClueRef = useRef(null);

  useEffect(() => {
    if (timerActive && !won) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerActive, won]);

  useEffect(() => {
    activeClueRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeWord]);

  // Show feedback after win or reveal (once per session)
  useEffect(() => {
    if ((won || revealed) && !feedbackShown) {
      const timer = setTimeout(() => { setShowFeedback(true); setFeedbackShown(true); }, 1200);
      return () => clearTimeout(timer);
    }
  }, [won, revealed]);

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

  function clickCell(r, c) {
    if (!SOLUTION[r][c]) return;
    if (!timerActive) setTimerActive(true);
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
    if (!timerActive) setTimerActive(true);
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

  function reveal() {
    setCells(SOLUTION.map(row => row.map(c => c || "")));
    setRevealed(true); setChecked(false); setTimerActive(false);
  }

  function reset() {
    setCells(Array.from({ length: rows }, () => Array(cols).fill("")));
    setChecked(false); setRevealed(false); setWon(false);
    setSel(null); setActiveWord(null);
    setSeconds(0); setTimerActive(false); setMistakes(0);
    setShowFeedback(false); setFeedbackShown(false);
  }

  function share() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setShareMsg("Copied!"); setTimeout(() => setShareMsg(""), 2000);
    }).catch(() => { setShareMsg("Copy URL from browser"); setTimeout(() => setShareMsg(""), 3000); });
  }

  function cellClass(r, c) {
    const parts = ["ci"];
    if (sel?.r === r && sel?.c === c) parts.push("sel");
    else if (activeWord) {
      const aw = activeWord;
      const inW = aw.orientation === "across"
        ? aw.starty === r && c >= aw.startx && c < aw.startx + aw.answer.length
        : aw.startx === c && r >= aw.starty && r < aw.starty + aw.answer.length;
      if (inW) parts.push("hi");
    }
    if (revealed) parts.push("rev");
    else if (checked && SOLUTION[r][c]) {
      if (!cells[r][c]) parts.push("mt");
      else parts.push(cells[r][c] === SOLUTION[r][c] ? "ok" : "err");
    }
    return parts.join(" ");
  }

  const totalCells = SOLUTION.flat().filter(Boolean).length;
  const correct = cells.flat().filter((v, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    return SOLUTION[r][c] && v === SOLUTION[r][c];
  }).length;
  const pct = totalCells ? Math.round(correct / totalCells * 100) : 0;

  const clueList = clueTab === "across" ? ACROSS : DOWN;
  const gradeLabel = GRADE_LABELS[grade] ? `${GRADE_LABELS[grade]} Grade` : "";

  // Print cell size (px) — keeps full grid within letter-page margins
  const PRINT_CS = Math.min(22, Math.floor(540 / cols));

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:"#faf7f0", fontFamily:"Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;overflow:hidden}
        :root{--cs:42px;--fs:17px;--ns:9px}
        @media(max-width:480px){:root{--cs:30px;--fs:13px;--ns:7px}}
        .ci{width:var(--cs);height:var(--cs);border:1.5px solid #8a7a5a;background:#fffef5;text-align:center;font-size:var(--fs);font-weight:700;font-family:Lora,Georgia,serif;color:#1a1008;text-transform:uppercase;cursor:pointer;outline:none;caret-color:transparent;padding:0;transition:background .1s;}
        .ci.hi{background:#e8f0d8}
        .ci.sel{background:#5a8a2a!important;color:#fff}
        .ci.ok{background:#bff0b0!important;color:#1a6010}
        .ci.err{background:#ffb0b0!important;color:#8b1010}
        .ci.rev{background:#fff3b0!important;color:#7a5500}
        .ci.mt{background:#ffe8a0!important}
        .blk{width:var(--cs);height:var(--cs);background:#2a1a08;display:block}
        .cwrap{position:relative;display:inline-block;width:var(--cs);height:var(--cs)}
        .cnum{position:absolute;top:2px;left:2px;font-size:var(--ns);color:#5a4010;font-weight:700;font-family:Lora,Georgia,serif;pointer-events:none;z-index:2;line-height:1;}
        .clue{padding:8px 10px;border-radius:5px;font-size:14px;line-height:1.55;cursor:pointer;transition:background .1s;font-family:Lora,Georgia,serif;color:#2c1a08;border-left:3px solid transparent;}
        .clue:hover{background:#ede0c0}
        .clue.act{background:#e8f0d8;font-weight:600;border-left-color:#5a8a2a}
        .cn{font-weight:700;color:#6a4a10;margin-right:5px;font-size:13px}
        .btn{font-family:'Playfair Display',Georgia,serif;font-weight:700;border:none;border-radius:4px;cursor:pointer;transition:all .15s;font-size:13px;}
        .bg{background:#3a6a1a;color:#f0ead8;padding:9px 18px;box-shadow:2px 2px 0 #1a3a08}
        .bg:hover{background:#5a8a2a;transform:translateY(-1px)}
        .bo{background:transparent;color:#4a3a18;border:1.5px solid #8a7a5a;padding:8px 14px}
        .bo:hover{background:#e8e0cc}
        .ctab{flex:1;padding:10px;border:none;border-bottom:3px solid transparent;background:transparent;font-family:'Playfair Display',serif;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#6a5a30;cursor:pointer;transition:all .15s;}
        .ctab.on{border-bottom-color:#3a6a1a;color:#3a6a1a}
        .ptrack{height:6px;background:#e0d8c8;border-radius:3px;overflow:hidden}
        .pfill{height:100%;background:#3a6a1a;border-radius:3px;transition:width .4s ease}
        @keyframes pop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
        .win{animation:pop .45s cubic-bezier(.175,.885,.32,1.275)}

        /* ── PRINT STYLES ── */
        .print-only{display:none}
        @media print{
          html,body,#root{height:auto!important;overflow:visible!important}
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

      {/* ══════════════════════════════════════════
          PRINT-ONLY WORKSHEET (hidden on screen)
      ══════════════════════════════════════════ */}
      <div className="print-only" style={{ fontFamily:"Arial,sans-serif", padding:"0" }}>
        {/* Worksheet header */}
        <div style={{ marginBottom:"14px", borderBottom:"2px solid #000", paddingBottom:"10px" }}>
          <div style={{ fontSize:"18px", fontWeight:"bold", fontFamily:"Georgia,serif", marginBottom:"6px" }}>{title}</div>
          <div style={{ fontSize:"11px", color:"#555", marginBottom:"10px" }}>
            {gradeLabel} · {words.length} Words · StoryClue.ai
          </div>
          <div style={{ display:"flex", gap:"40px", fontSize:"12px" }}>
            <span>Name: <span style={{ display:"inline-block", width:"180px", borderBottom:"1px solid #000" }}>&nbsp;</span></span>
            <span>Grade: <span style={{ display:"inline-block", width:"60px", borderBottom:"1px solid #000" }}>&nbsp;</span></span>
            <span>Date: <span style={{ display:"inline-block", width:"100px", borderBottom:"1px solid #000" }}>&nbsp;</span></span>
          </div>
        </div>

        {/* Print grid — static cells, no inputs */}
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

        {/* Two-column clues */}
        <div style={{ display:"flex", gap:"32px", marginTop:"12px", borderTop:"1px solid #ccc", paddingTop:"10px" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"13px", fontWeight:"bold", fontFamily:"Georgia,serif", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid #ccc", paddingBottom:"4px" }}>Across</div>
            {ACROSS.map(w => (
              <div key={w.number} className="p-clue">
                <span className="p-clue-num">{w.number}.</span>{w.clue}
              </div>
            ))}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"13px", fontWeight:"bold", fontFamily:"Georgia,serif", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid #ccc", paddingBottom:"4px" }}>Down</div>
            {DOWN.map(w => (
              <div key={w.number} className="p-clue">
                <span className="p-clue-num">{w.number}.</span>{w.clue}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SCREEN UI (hidden during print)
      ══════════════════════════════════════════ */}
      <div className="screen-only" style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>

        {/* TOP BAR */}
        <div className="no-print" style={{ background:"linear-gradient(135deg,#2d4a18,#4a7a22)", padding:"10px 16px", borderBottom:"3px solid #8a7a30", display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
          <button onClick={() => navigate("/")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"26px", padding:0 }} title="StoryClue home">🕷️</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"17px", color:"#f0ead8", lineHeight:1.2 }}>{title}</div>
            <div style={{ fontSize:"10px", color:"#a8d890", fontStyle:"italic", letterSpacing:"1px" }}>
              {gradeLabel ? `${gradeLabel} · ` : ""}{words.length} Words
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
            <div style={{ textAlign:"right", color:"#f0ead8" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"18px", letterSpacing:"2px" }}>{formatTime(seconds)}</div>
              <div style={{ fontSize:"10px", color:"#a8d890" }}>{mistakes} mistake{mistakes!==1?"s":""}</div>
            </div>
            <button
              onClick={() => { if(!document.fullscreenElement){document.documentElement.requestFullscreen?.()}else{document.exitFullscreen?.()} }}
              style={{ background:"rgba(255,255,255,.15)", border:"1.5px solid rgba(255,255,255,.4)", borderRadius:"6px", color:"#f0ead8", padding:"7px 11px", cursor:"pointer", fontSize:"18px", lineHeight:1, flexShrink:0 }}
              title="Toggle fullscreen"
            >⛶</button>
          </div>
        </div>

        {/* COMPACT TOOLBAR */}
        <div className="no-print" style={{ background:"#f0ead8", borderBottom:"1px solid #c8b888", padding:"6px 10px", flexShrink:0, display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
          <button className="btn bg" onClick={check} style={{ padding:"5px 14px", fontSize:"12px" }}>Check</button>
          <button className="btn bo" onClick={reveal} style={{ padding:"4px 12px", fontSize:"12px" }}>Reveal</button>
          <button className="btn bo" onClick={reset} style={{ padding:"4px 12px", fontSize:"12px" }}>Restart</button>
          <button className="btn bo" onClick={() => navigate("/create")} style={{ padding:"4px 12px", fontSize:"12px" }}>New Puzzle</button>
          <button className="btn bo" onClick={() => window.print()} style={{ padding:"4px 10px", fontSize:"12px" }}>🖨️ Print</button>
          <button className="btn bo" onClick={share} style={{ padding:"4px 10px", fontSize:"12px" }}>🔗 Share</button>
          {shareMsg && <span style={{ fontSize:"11px", color:"#3a6a1a", fontFamily:"Lora,serif", fontStyle:"italic" }}>{shareMsg}</span>}
          {checked && !won && !revealed && <span style={{ fontSize:"11px", color:"#7a5a00", fontFamily:"Lora,serif", fontStyle:"italic" }}>🟢 correct · 🔴 wrong · 🟡 empty</span>}
        </div>

        {/* PROGRESS BAR */}
        <div className="no-print" style={{ padding:"6px 14px", background:"#f0ead8", borderBottom:"1px solid #c8b888", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:"#6a5a30", fontFamily:"Lora,serif", marginBottom:"3px" }}>
            <span>Progress</span><span>{pct}%</span>
          </div>
          <div className="ptrack"><div className="pfill" style={{ width:pct+"%" }}/></div>
        </div>

        {/* WIN BANNER */}
        {won && (
          <div className="win no-print" style={{ background:"linear-gradient(135deg,#2d5a1a,#4a8a2a)", color:"#f0ead8", padding:"12px 20px", textAlign:"center", flexShrink:0 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"20px" }}>🌟 Solved! Time: {formatTime(seconds)} · Mistakes: {mistakes} 🌟</div>
            <div style={{ fontSize:"12px", fontFamily:"Lora,serif", fontStyle:"italic", marginTop:"3px" }}>Well done, good and faithful solver!</div>
          </div>
        )}

        {/* GRID PANEL */}
        <div className="grid-scroll" style={{ flex:"1 1 60%", minHeight:0, overflowX:"auto", overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"10px", background:"#faf7f0" }}>
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

        {/* DIVIDER */}
        <div className="no-print" style={{ height:"4px", background:"linear-gradient(90deg,#3a6a1a,#8a7a5a,#3a6a1a)", flexShrink:0 }}/>

        {/* CLUE PANEL */}
        <div className="no-print" style={{ flex:"0 0 35%", display:"flex", flexDirection:"column", background:"#fff", minHeight:0 }}>
          {activeWord && (
            <div style={{ background:"#e8f0d8", borderBottom:"1px solid #c8d8a8", padding:"8px 14px", flexShrink:0 }}>
              <span style={{ fontWeight:700, color:"#6a4a10", fontFamily:"'Playfair Display',serif", fontSize:"13px", marginRight:"6px" }}>
                {activeWord.number} {activeWord.orientation.toUpperCase()}
              </span>
              <span style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#2c1a08" }}>{activeWord.clue}</span>
            </div>
          )}
          <div style={{ display:"flex", borderBottom:"2px solid #e0d8c8", flexShrink:0 }}>
            <button className={`ctab${clueTab==="across"?" on":""}`} onClick={() => setClueTab("across")}>Across ({ACROSS.length})</button>
            <button className={`ctab${clueTab==="down"?" on":""}`} onClick={() => setClueTab("down")}>Down ({DOWN.length})</button>
          </div>
          <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch", flex:1, padding:"4px 8px" }}>
            {clueList.map(w => {
              const isActive = activeWord?.number === w.number && activeWord?.orientation === clueTab;
              return (
                <div
                  key={`${clueTab}${w.number}`}
                  ref={isActive ? activeClueRef : null}
                  className={`clue${isActive ? " act" : ""}`}
                  onClick={() => { setSel({ r:w.starty, c:w.startx }); setActiveWord(w); focus(w.starty, w.startx); }}
                >
                  <span className="cn">{w.number}.</span>{w.clue}
                </div>
              );
            })}
          </div>
        </div>

      </div>{/* end screen-only */}

      {/* FEEDBACK MODAL */}
      {showFeedback && (
        <FeedbackModal
          puzzleTitle={title}
          grade={grade}
          wasRevealed={revealed}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
