// ── StoryClue Crossword Layout Engine ─────────────────────────────────────────
// Replaces crossword-layout-generator with a proper placement algorithm.
//
// Algorithm:
//   1. Pick grid size based on word count
//   2. Place longest word across the center
//   3. For each remaining word, find all intersections with placed words
//   4. Score each placement (more crossings = better)
//   5. Pick best placement, repeat
//   6. Words that can't be placed are skipped gracefully
//
// Grid sizes:
//   ≤ 8 words  → 9×9
//   9–12 words → 11×11
//   13–16      → 13×13
//   17+        → 15×15

// ── Grid size selector ─────────────────────────────────────────────────────────
function pickGridSize(wordCount, longestWord) {
  const byCount =
    wordCount <= 8  ? 9  :
    wordCount <= 12 ? 11 :
    wordCount <= 16 ? 13 : 15;
  // Grid must fit the longest word with at least 1 cell of padding each side
  const byWord = longestWord + 2;
  return Math.max(byCount, byWord % 2 === 0 ? byWord + 1 : byWord); // keep odd for centering
}

// ── Grade tier ─────────────────────────────────────────────────────────────────
function getTier(grade) {
  if (grade === "adult") return "full";
  if (["6","7","8","9-10","11-12"].includes(String(grade))) return "intermediate";
  return "relaxed";
}

// ── Build letter grid from placed words ───────────────────────────────────────
export function buildGrid(words, rows, cols) {
  const g = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const w of words) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.orientation === "down"   ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      if (r >= 0 && r < rows && c >= 0 && c < cols) g[r][c] = w.answer[i];
    }
  }
  return g;
}

// ── Numbering ──────────────────────────────────────────────────────────────────
export function buildNumbering(words, rows, cols) {
  const grid = buildGrid(words, rows, cols);
  const nums = {};
  let n = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const isA = (c === 0 || !grid[r][c-1]) && c+1 < cols && grid[r][c+1];
      const isD = (r === 0 || !grid[r-1]?.[c]) && r+1 < rows && grid[r+1]?.[c];
      if (isA || isD) nums[`${r},${c}`] = n++;
    }
  }
  return nums;
}

// ── Conflict checker ───────────────────────────────────────────────────────────
// Returns true if placing `word` at (row, col) with orientation is conflict-free
function canPlace(word, row, col, orientation, grid, rows, cols, placedWords) {
  const len = word.length;

  // Bounds check
  if (orientation === "across") {
    if (col < 0 || col + len > cols) return false;
    if (row < 0 || row >= rows) return false;
  } else {
    if (row < 0 || row + len > rows) return false;
    if (col < 0 || col >= cols) return false;
  }

  // Check cell-by-cell
  for (let i = 0; i < len; i++) {
    const r = orientation === "down"   ? row + i : row;
    const c = orientation === "across" ? col + i : col;
    const letter = word[i];
    const existing = grid[r][c];

    if (existing !== null && existing !== letter) return false; // letter conflict

    // For cells we're writing to that are empty, check adjacency rules
    if (existing === null) {
      // No letter should be immediately before the start or after the end
      if (i === 0) {
        const pr = orientation === "down" ? r - 1 : r;
        const pc = orientation === "across" ? c - 1 : c;
        if (pr >= 0 && pc >= 0 && grid[pr][pc] !== null) return false;
      }
      if (i === len - 1) {
        const nr = orientation === "down" ? r + 1 : r;
        const nc = orientation === "across" ? c + 1 : c;
        if (nr < rows && nc < cols && grid[nr][nc] !== null) return false;
      }
      // No parallel adjacent letters (would create unintended words)
      if (orientation === "across") {
        if (r > 0 && grid[r-1][c] !== null) {
          // Only ok if this cell is an intersection (existing !== null) — but existing is null here
          return false;
        }
        if (r < rows-1 && grid[r+1][c] !== null) return false;
      } else {
        if (c > 0 && grid[r][c-1] !== null) return false;
        if (c < cols-1 && grid[r][c+1] !== null) return false;
      }
    }
  }

  return true;
}

// ── Score a placement ──────────────────────────────────────────────────────────
// Higher = better. Rewards intersections, penalizes edge placement.
function scorePlacement(word, row, col, orientation, grid, rows, cols) {
  let crossings = 0;
  const len = word.length;
  for (let i = 0; i < len; i++) {
    const r = orientation === "down"   ? row + i : row;
    const c = orientation === "across" ? col + i : col;
    if (grid[r][c] !== null) crossings++;
  }
  // Prefer placements near the center
  const centerR = rows / 2, centerC = cols / 2;
  const midR = orientation === "down"   ? row + len/2 : row;
  const midC = orientation === "across" ? col + len/2 : col;
  const distFromCenter = Math.abs(midR - centerR) + Math.abs(midC - centerC);
  const centerBonus = Math.max(0, 10 - distFromCenter);

  return crossings * 20 + centerBonus;
}

// ── Find all valid placements for a word ──────────────────────────────────────
function findPlacements(word, grid, rows, cols, placedWords) {
  const placements = [];

  // Try intersecting with every placed word
  for (const placed of placedWords) {
    for (let pi = 0; pi < placed.answer.length; pi++) {
      const placedLetter = placed.answer[pi];

      for (let wi = 0; wi < word.length; wi++) {
        if (word[wi] !== placedLetter) continue;

        // Try placing perpendicular to placed word at this intersection
        const orientation = placed.orientation === "across" ? "down" : "across";

        let row, col;
        if (placed.orientation === "across") {
          // placed is across → new word is down
          col = placed.startx + pi;
          row = placed.starty - wi;
        } else {
          // placed is down → new word is across
          row = placed.starty + pi;
          col = placed.startx - wi;
        }

        if (canPlace(word, row, col, orientation, grid, rows, cols, placedWords)) {
          const score = scorePlacement(word, row, col, orientation, grid, rows, cols);
          placements.push({ row, col, orientation, score });
        }
      }
    }
  }

  return placements.sort((a, b) => b.score - a.score);
}

// ── Shuffle array ─────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Main export ────────────────────────────────────────────────────────────────
export function buildLayout(apiWords, grade = "3") {
  if (!apiWords?.length) return null;

  // Preserve all extra fields, normalize answer
  const baseList = apiWords.map(w => ({ ...w, answer: w.word.toUpperCase(), clue: w.clue }));

  // Sort longest first — gives the algorithm the best anchor words first
  const sorted = [...baseList].sort((a, b) => b.answer.length - a.answer.length);

  const longestLen = sorted[0].answer.length;
  const SIZE = pickGridSize(sorted.length, longestLen);
  const rows = SIZE, cols = SIZE;

  const MIN_PLACED = Math.max(4, Math.floor(sorted.length * 0.6));
  const MAX_ATTEMPTS = 6;

  let bestResult = null;
  let bestPlacedCount = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Shuffle on retries to get different layouts
    const wordList = attempt === 0 ? sorted : [sorted[0], ...shuffle(sorted.slice(1))];

    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    const placedWords = [];

    // Place first word across the center
    const firstWord = wordList[0];
    const startRow = Math.floor(rows / 2);
    const startCol = Math.floor((cols - firstWord.answer.length) / 2);
    placedWords.push({
      ...firstWord,
      orientation: "across",
      startx: startCol,
      starty: startRow,
    });
    // Write to grid
    for (let i = 0; i < firstWord.answer.length; i++) {
      grid[startRow][startCol + i] = firstWord.answer[i];
    }

    // Place remaining words
    for (let wi = 1; wi < wordList.length; wi++) {
      const word = wordList[wi];
      // Skip duplicates
      if (placedWords.some(p => p.answer === word.answer)) continue;

      const placements = findPlacements(word.answer, grid, rows, cols, placedWords);
      if (!placements.length) continue;

      const best = placements[0];
      placedWords.push({
        ...word,
        orientation: best.orientation,
        startx: best.col,
        starty: best.row,
      });

      // Write to grid
      for (let i = 0; i < word.answer.length; i++) {
        const r = best.orientation === "down"   ? best.row + i : best.row;
        const c = best.orientation === "across" ? best.col + i : best.col;
        grid[r][c] = word.answer[i];
      }
    }

    if (placedWords.length > bestPlacedCount) {
      bestPlacedCount = placedWords.length;
      bestResult = { rows, cols, placedWords, grid };
    }

    if (placedWords.length >= MIN_PLACED) break;
  }

  if (!bestResult || bestResult.placedWords.length < 4) return null;

  const { placedWords, grid } = bestResult;
  const numbering = buildNumbering(placedWords, rows, cols);
  const words = placedWords.map(w => ({
    ...w,
    number: numbering[`${w.starty},${w.startx}`] || 0,
  }));

  console.log(
    `[StoryClue] Grid: ${rows}×${cols} | Words placed: ${words.length}/${sorted.length} | Grade: ${grade}`
  );

  return { rows, cols, words };
}
