import { useState, useEffect } from "react";
import { trackEvent } from "../utils/analytics";

// ── ClassicCrossword ─────────────────────────────────────────────────────────
// Display and solve a real NYT-style 15×15 crossword puzzle.
//
// Features:
// - Read-only grid display (solved letters visible on toggle)
// - Rich (default) vs Classic (newspaper-style) clue toggle
// - Two-column clue lists (Across / Down)
// - NYT-inspired layout with paper background
// - Mobile-responsive (single column clues on small screens)
//
// Props:
//   puzzle: { pattern, answers: { across, down }, clues, stats }

const CELL_SIZE = "clamp(20px, 2.4vw, 38px)";

export default function ClassicCrossword({ puzzle, onClose }) {
  const [clueMode, setClueMode] = useState("rich"); // "rich" or "classic"
  const [showSolution, setShowSolution] = useState(false);

  if (!puzzle || !puzzle.answers || !puzzle.clues) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
        Loading puzzle...
      </div>
    );
  }

  const { pattern, answers, clues, stats } = puzzle;
  const across = answers.across || [];
  const down = answers.down || [];

  // Build a map of clue numbers to clue content
  const clueMap = {};
  for (const clue of clues) {
    const key = `${clue.num}${clue.dir}`;
    clueMap[key] = clue;
  }

  // Build solution grid from across/down answers
  const rows = pattern.length;
  const cols = pattern[0]?.length || 15;
  const solutionGrid = Array(rows).fill(null).map(() => Array(cols).fill(""));

  // Build numbering map: num → [r, c] and [r,c] → num
  let cellNum = 1;
  const numToCell = {}; // num → [r, c]
  const cellToNum = {}; // "r,c" → num
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pattern[r][c] !== "#") {
        const hasAcross = c === 0 || pattern[r][c - 1] === "#";
        const hasDown = r === 0 || pattern[r - 1]?.[c] === "#";
        if (hasAcross || hasDown) {
          numToCell[cellNum] = [r, c];
          cellToNum[`${r},${c}`] = cellNum;
          cellNum++;
        }
      }
    }
  }

  // Place across words
  for (const word of across) {
    const [r, c] = numToCell[word.num] || [-1, -1];
    if (r >= 0 && c >= 0) {
      for (let i = 0; i < word.answer.length && c + i < cols; i++) {
        solutionGrid[r][c + i] = word.answer[i];
      }
    }
  }

  // Place down words
  for (const word of down) {
    const [r, c] = numToCell[word.num] || [-1, -1];
    if (r >= 0 && c >= 0) {
      for (let i = 0; i < word.answer.length && r + i < rows; i++) {
        solutionGrid[r + i][c] = word.answer[i];
      }
    }
  }

  // Generate grid cells from pattern and solution grid
  const gridCells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const isBlack = pattern[r][c] === "#";
      const num = cellToNum[key];
      const letter = showSolution ? solutionGrid[r][c] || "" : "";

      gridCells.push(
        <div
          key={key}
          style={{
            background: isBlack ? "#17150f" : "#fff",
            aspectRatio: "1",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #17150f",
          }}
        >
          {num && (
            <span
              style={{
                position: "absolute",
                top: "1px",
                left: "2px",
                font: "600 8px/1 Verdana,sans-serif",
                color: "#444",
              }}
            >
              {num}
            </span>
          )}
          {letter && (
            <span
              style={{
                font: "700 clamp(11px,2.4vw,19px)/1 Verdana,sans-serif",
                color: "#17150f",
              }}
            >
              {letter}
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div style={{ background: "#fcfbf7", color: "#17150f", fontFamily: "Georgia,'Times New Roman',serif", padding: "20px 14px 48px", minHeight: "100vh" }}>
      <style>{`
        .cc-header { max-width:920px; margin:0 auto 18px; border-bottom:3px double #17150f; padding-bottom:12px; }
        .cc-eyebrow { font:700 11px/1 Verdana,sans-serif; letter-spacing:.18em; color:#1e4d2b; text-transform:uppercase; }
        .cc-h1 { font-size:clamp(26px,5vw,40px); font-weight:700; letter-spacing:-.01em; margin:6px 0 4px; }
        .cc-specs { font:12px/1.6 Verdana,sans-serif; color:#5a5648; }
        .cc-specs b { color:#1e4d2b; }
        .cc-main { max-width:920px; margin:0 auto; }
        .cc-controls { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin:6px 0 12px; }
        .cc-seg { display:inline-flex; border:2px solid #1e4d2b; border-radius:4px; overflow:hidden; }
        .cc-seg button { font:700 12px Verdana,sans-serif; letter-spacing:.06em; text-transform:uppercase; background:#fff; color:#1e4d2b; border:0; padding:9px 16px; cursor:pointer; transition:.15s; }
        .cc-seg button:hover { background:#f5f3ee; }
        .cc-seg button.on { background:#1e4d2b; color:#fff; }
        .cc-toggle { font:700 12px Verdana,sans-serif; letter-spacing:.08em; text-transform:uppercase; background:#fff; color:#1e4d2b; border:2px solid #1e4d2b; padding:9px 16px; border-radius:4px; cursor:pointer; transition:.15s; }
        .cc-toggle:hover { background:#f5f3ee; }
        .cc-gridwrap { display:flex; justify-content:center; margin:18px 0; }
        .cc-grid { display:grid; grid-template-columns:repeat(15,minmax(20px,38px)); border:2px solid #17150f; background:#17150f; gap:1px; }
        .cc-clues { display:grid; grid-template-columns:1fr 1fr; gap:0 34px; margin-top:24px; }
        @media (max-width:640px) { .cc-clues { grid-template-columns:1fr; } }
        .cc-clues h2 { font:700 13px Verdana,sans-serif; letter-spacing:.14em; text-transform:uppercase; color:#1e4d2b; border-bottom:1px solid #d9d4c5; padding-bottom:5px; margin-bottom:8px; }
        .cc-clues ul { list-style:none; }
        .cc-clues li { padding:5px 0; border-bottom:1px dotted #d9d4c5; font-size:14.5px; }
        .cc-clues li b { font-family:Verdana,sans-serif; font-size:12px; color:#1e4d2b; margin-right:5px; }
        .cc-clue-rich { display:inline; }
        .cc-clue-classic { display:none; }
        body.cc-classic .cc-clue-rich { display:none; }
        body.cc-classic .cc-clue-classic { display:inline; }
        .cc-footer { max-width:920px; margin:30px auto 0; font:11px/1.7 Verdana,sans-serif; color:#7a7466; border-top:1px solid #d9d4c5; padding-top:10px; }
      `}</style>

      {/* Header */}
      <div className="cc-header">
        <div className="cc-eyebrow">StoryClue.ai · Classic Crossword</div>
        <h1 className="cc-h1">{puzzle.title || "Crossword"}</h1>
        <div className="cc-specs">
          15&times;15 &middot; <b>{stats?.wordCount || "—"} words</b> &middot; <b>{stats?.blockCount || "—"} blocks</b> &middot; 180° symmetry &middot;
          every letter checked &middot; filled in <b>{stats?.fillTime?.toFixed(1) || "—"}s</b>
        </div>
      </div>

      {/* Main content */}
      <div className="cc-main">
        {/* Controls */}
        <div className="cc-controls">
          <div className="cc-seg">
            <button
              className={`${clueMode === "rich" ? "on" : ""}`}
              onClick={() => {
                setClueMode("rich");
                trackEvent("clue_mode_toggled", { mode: "rich" });
              }}
            >
              Rich Clues
            </button>
            <button
              className={`${clueMode === "classic" ? "on" : ""}`}
              onClick={() => {
                setClueMode("classic");
                trackEvent("clue_mode_toggled", { mode: "classic" });
              }}
            >
              Classic Clues
            </button>
          </div>
          <button
            className="cc-toggle"
            onClick={() => {
              setShowSolution(!showSolution);
              trackEvent("solution_toggled", { shown: !showSolution });
            }}
          >
            {showSolution ? "Hide Solution" : "Reveal Solution"}
          </button>
        </div>

        {/* Grid */}
        <div className="cc-gridwrap">
          <div className="cc-grid">{gridCells}</div>
        </div>

        {/* Clues */}
        <div className={`cc-clues${clueMode === "classic" ? " cc-classic" : ""}`}>
          <section>
            <h2>Across</h2>
            <ul>
              {across.map((entry) => {
                const clueData = clueMap[`${entry.num}A`];
                return (
                  <li key={`A${entry.num}`}>
                    <b>{entry.num}</b>
                    <span className="cc-clue-rich">{clueData?.clue_rich || "—"}</span>
                    <span className="cc-clue-classic">{clueData?.clue_classic || "—"}</span>
                  </li>
                );
              })}
            </ul>
          </section>
          <section>
            <h2>Down</h2>
            <ul>
              {down.map((entry) => {
                const clueData = clueMap[`${entry.num}D`];
                return (
                  <li key={`D${entry.num}`}>
                    <b>{entry.num}</b>
                    <span className="cc-clue-rich">{clueData?.clue_rich || "—"}</span>
                    <span className="cc-clue-classic">{clueData?.clue_classic || "—"}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="cc-footer">
        Same grid, same answers — only the clue set changes. <strong>Rich</strong> = StoryClue's teaching voice (default).{" "}
        <strong>Classic</strong> = newspaper brevity. Grid built by constraint-satisfaction code; clues written by AI.
      </div>

      {/* Close button (if rendered in modal) */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "10px 20px",
            background: "#1e4d2b",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontFamily: "Georgia,serif",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Close
        </button>
      )}
    </div>
  );
}
