import CrosswordLayoutGenerator from "crossword-layout-generator";

// ── Grade tier ─────────────────────────────────────────────────────────────
// relaxed     → K–5   (min length 3, no repeats, connectivity, #1 Across)
// intermediate → 6–12  (+ no unchecked end letters, black squares < 20%)
// full         → adult (+ 180° symmetry, all squares checked, black < 16%)
function getTier(grade) {
  if (grade === "adult") return "full";
  if (["6","7","8","9-10","11-12"].includes(String(grade))) return "intermediate";
  return "relaxed";
}

// ── Grid builder ───────────────────────────────────────────────────────────
export function buildGrid(words, rows, cols) {
  const g = Array.from({ length: rows }, () => Array(cols).fill(null));
  words.forEach(({ answer, orientation, startx, starty }) => {
    for (let i = 0; i < answer.length; i++) {
      const r = orientation === "down"   ? starty + i : starty;
      const c = orientation === "across" ? startx + i : startx;
      if (r < rows && c < cols) g[r][c] = answer[i];
    }
  });
  return g;
}

// ── Numbering ──────────────────────────────────────────────────────────────
export function buildNumbering(words, rows, cols) {
  const grid = buildGrid(words, rows, cols);
  const nums = {};
  let n = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const isA = (c === 0 || !grid[r][c - 1]) && c + 1 < cols && grid[r][c + 1];
      const isD = (r === 0 || !grid[r - 1]?.[c]) && r + 1 < rows && grid[r + 1]?.[c];
      if (isA || isD) nums[`${r},${c}`] = n++;
    }
  }
  return nums;
}

// ── Validation helpers ─────────────────────────────────────────────────────

// Count how many words pass through each cell.  cc["r,c"] = 1 → unchecked, 2+ → checked.
function buildCrossCount(words) {
  const cc = {};
  for (const w of words) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.orientation === "down"   ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      const key = `${r},${c}`;
      cc[key] = (cc[key] || 0) + 1;
    }
  }
  return cc;
}

function checkConnected(grid, rows, cols) {
  let start = null;
  outer: for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c]) { start = [r, c]; break outer; }
  if (!start) return true;
  const vis = Array.from({ length: rows }, () => Array(cols).fill(false));
  const q   = [start];
  vis[start[0]][start[1]] = true;
  let count = 1;
  while (q.length) {
    const [r, c] = q.shift();
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] && !vis[nr][nc]) {
        vis[nr][nc] = true; count++; q.push([nr, nc]);
      }
    }
  }
  return count === grid.flat().filter(Boolean).length;
}

function checkNoRepeats(words) {
  const seen = new Set();
  for (const w of words) {
    if (seen.has(w.answer)) return false;
    seen.add(w.answer);
  }
  return true;
}

// Item 10: #1 must be an Across word
function checkNumber1Across(words) {
  const w1 = words.find(w => w.number === 1);
  return !w1 || w1.orientation === "across";
}

// 6th–12th: first AND last letter of every word must be checked
function checkEndLettersChecked(words) {
  const cc = buildCrossCount(words);
  for (const w of words) {
    const firstKey = `${w.starty},${w.startx}`;
    const lr = w.orientation === "down"   ? w.starty + w.answer.length - 1 : w.starty;
    const lc = w.orientation === "across" ? w.startx + w.answer.length - 1 : w.startx;
    if ((cc[firstKey] || 0) < 2 || (cc[`${lr},${lc}`] || 0) < 2) return false;
  }
  return true;
}

function getBlackPct(grid, rows, cols) {
  const filled = grid.flat().filter(Boolean).length;
  return (rows * cols - filled) / (rows * cols);
}

function check180Symmetry(grid, rows, cols) {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (!!grid[r][c] !== !!grid[rows - 1 - r][cols - 1 - c]) return false;
  return true;
}

// Reader Mode: every white square belongs to both an Across AND a Down word
function checkAllSquaresCrossed(words) {
  const cc = buildCrossCount(words);
  return Object.values(cc).every(v => v >= 2);
}

// Returns array of violation strings — empty array means the layout is valid
function validate(words, grid, rows, cols, tier) {
  const v = [];
  if (!checkNoRepeats(words))           v.push("repeated-words");
  if (!checkConnected(grid, rows, cols)) v.push("disconnected");
  if (!checkNumber1Across(words))       v.push("1-not-across");

  if (tier === "intermediate" || tier === "full") {
    if (!checkEndLettersChecked(words))          v.push("unchecked-end-letters");
    if (getBlackPct(grid, rows, cols) > 0.20)    v.push("black-squares>20%");
  }
  if (tier === "full") {
    if (!check180Symmetry(grid, rows, cols))      v.push("no-180°-symmetry");
    if (!checkAllSquaresCrossed(words))           v.push("unchecked-squares");
    if (getBlackPct(grid, rows, cols) > 0.16)    v.push("black-squares>16%");
  }
  return v;
}

// ── Shuffle ────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── buildLayout — main export ──────────────────────────────────────────────
// Takes words from API: [{word, clue}]  + grade string
// Returns placed puzzle data ready for CrosswordPuzzle, or null if layout fails.
export function buildLayout(apiWords, grade = "3") {
  const tier      = getTier(grade);
  const MAX_TRIES = tier === "full" ? 20 : 8;
  // Preserve all extra fields (emoji, etc.) — only normalise answer casing
  const baseList  = apiWords.map(w => ({ ...w, answer: w.word.toUpperCase(), clue: w.clue }));

  let bestResult    = null;
  let bestViolCount = Infinity;

  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    // Shuffle on every retry to coax different layouts from the generator
    const wordList = attempt === 0 ? baseList : shuffle(baseList);

    let output;
    try { output = CrosswordLayoutGenerator.generateLayout(wordList); }
    catch { continue; }

    let placed = output.result.filter(w => w.orientation !== "none");

    // If too few words placed, retry the generator with a shorter list
    if (placed.length < 15 && wordList.length > 15) {
      try {
        const retry = CrosswordLayoutGenerator.generateLayout(wordList.slice(0, -3));
        const rp    = retry.result.filter(w => w.orientation !== "none");
        if (rp.length >= placed.length) { placed = rp; output = retry; }
      } catch { /* keep original */ }
    }

    if (placed.length < 15) continue;

    const { rows, cols } = output;

    // Library uses 1-indexed startx/starty — convert to 0-indexed
    // Spread all fields first (preserves emoji, phonics hints, etc.)
    // then override the positional fields with 0-indexed values
    const placed0 = placed.map(w => ({
      ...w,
      answer:      w.answer,
      clue:        w.clue,
      orientation: w.orientation,
      startx:      w.startx - 1,
      starty:      w.starty - 1,
    }));

    const numbering = buildNumbering(placed0, rows, cols);
    const words     = placed0.map(w => ({
      ...w,
      number: numbering[`${w.starty},${w.startx}`] || 0,
    }));
    const grid = buildGrid(words, rows, cols);

    const violations = validate(words, grid, rows, cols, tier);

    if (violations.length === 0) {
      console.log(`[StoryClue] ✓ Grade "${grade}" (${tier}) — valid layout on attempt ${attempt + 1}`);
      return { rows, cols, words };
    }

    console.log(
      `[StoryClue] Attempt ${attempt + 1}/${MAX_TRIES} (${tier}) — violations:`,
      violations.join(", ")
    );

    if (violations.length < bestViolCount) {
      bestViolCount = violations.length;
      bestResult    = { rows, cols, words };
    }
  }

  // Fall back to best available layout when perfect standards can't be met
  if (bestResult) {
    console.warn(
      `[StoryClue] ⚠ Best available layout used — ${bestViolCount} rule(s) not fully satisfied`
    );
    return bestResult;
  }
  return null;
}
