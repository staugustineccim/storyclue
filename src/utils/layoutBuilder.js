// ── StoryClue Crossword Layout Engine ─────────────────────────────────────────
// Custom intersection-first placement algorithm with variable grid sizing.
//
// Grid sizes:
//   ≤ 8 words  → 9×9
//   9–12 words → 11×11
//   13–16      → 13×13
//   17+        → 15×15

function pickGridSize(wordCount, longestWord) {
  const byCount =
    wordCount <= 8  ? 9  :
    wordCount <= 12 ? 11 :
    wordCount <= 16 ? 13 : 15;
  const byWord = longestWord + 2;
  return Math.max(byCount, byWord % 2 === 0 ? byWord + 1 : byWord);
}

function getTier(grade) {
  if (grade === "adult") return "full";
  if (["6","7","8","9-10","11-12"].includes(String(grade))) return "intermediate";
  return "relaxed";
}

export function buildGrid(words, rows, cols) {
  const g = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const w of words) {
    const answer = w.answer || w.word;
    for (let i = 0; i < answer.length; i++) {
      const r = w.orientation === "down"   ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      if (r >= 0 && r < rows && c >= 0 && c < cols) g[r][c] = answer[i];
    }
  }
  return g;
}

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

function canPlace(word, row, col, orientation, grid, rows, cols) {
  const len = word.length;

  if (orientation === "across") {
    if (col < 0 || col + len > cols || row < 0 || row >= rows) return false;
  } else {
    if (row < 0 || row + len > rows || col < 0 || col >= cols) return false;
  }

  for (let i = 0; i < len; i++) {
    const r = orientation === "down"   ? row + i : row;
    const c = orientation === "across" ? col + i : col;
    const letter = word[i];
    const existing = grid[r][c];

    if (existing !== null && existing !== letter) return false;

    // Boundary checks always run — even at intersections — so numbering never breaks
    if (i === 0) {
      const pr = orientation === "down" ? r - 1 : r;
      const pc = orientation === "across" ? c - 1 : c;
      if (pr >= 0 && pc >= 0 && grid[pr]?.[pc] !== null) return false;
    }
    if (i === len - 1) {
      const nr = orientation === "down" ? r + 1 : r;
      const nc = orientation === "across" ? c + 1 : c;
      if (nr < rows && nc < cols && grid[nr]?.[nc] !== null) return false;
    }

    // Parallel adjacency only for non-intersection cells
    if (existing === null) {
      if (orientation === "across") {
        if (r > 0 && grid[r-1][c] !== null) return false;
        if (r < rows-1 && grid[r+1][c] !== null) return false;
      } else {
        if (c > 0 && grid[r][c-1] !== null) return false;
        if (c < cols-1 && grid[r][c+1] !== null) return false;
      }
    }
  }

  return true;
}

function scorePlacement(word, row, col, orientation, grid, rows, cols) {
  let crossings = 0;
  const len = word.length;
  for (let i = 0; i < len; i++) {
    const r = orientation === "down"   ? row + i : row;
    const c = orientation === "across" ? col + i : col;
    if (grid[r][c] !== null) crossings++;
  }
  const centerR = rows / 2, centerC = cols / 2;
  const midR = orientation === "down"   ? row + len/2 : row;
  const midC = orientation === "across" ? col + len/2 : col;
  const distFromCenter = Math.abs(midR - centerR) + Math.abs(midC - centerC);
  const centerBonus = Math.max(0, 10 - distFromCenter);
  return crossings * 20 + centerBonus;
}

function findPlacements(word, grid, rows, cols, placedWords) {
  const placements = [];
  for (const placed of placedWords) {
    for (let pi = 0; pi < placed.answer.length; pi++) {
      const placedLetter = placed.answer[pi];
      for (let wi = 0; wi < word.length; wi++) {
        if (word[wi] !== placedLetter) continue;
        const orientation = placed.orientation === "across" ? "down" : "across";
        let row, col;
        if (placed.orientation === "across") {
          col = placed.startx + pi;
          row = placed.starty - wi;
        } else {
          row = placed.starty + pi;
          col = placed.startx - wi;
        }
        if (canPlace(word, row, col, orientation, grid, rows, cols)) {
          const score = scorePlacement(word, row, col, orientation, grid, rows, cols);
          placements.push({ row, col, orientation, score });
        }
      }
    }
  }
  return placements.sort((a, b) => b.score - a.score);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Deterministic layout validation (handoff §14.4) ───────────────────────────
// Independent of the generator: re-derives the grid from the placements and
// checks the finished layout the way an editor would — legal word lengths, no
// duplicate answers, every crossing letter consistent, one connected grid,
// and a clue number on every entry. Returns { ok, errors }.
export function validateLayout(words, rows, cols) {
  const errors = [];
  if (!Array.isArray(words) || !words.length) {
    return { ok: false, errors: ["no words in layout"] };
  }

  const seen = new Set();
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));

  for (const w of words) {
    const answer = (w.answer || w.word || "").toUpperCase();
    if (answer.length < 3) errors.push(`"${answer}" is shorter than the 3-letter minimum`);
    if (seen.has(answer)) errors.push(`duplicate answer "${answer}"`);
    seen.add(answer);
    for (let i = 0; i < answer.length; i++) {
      const r = w.orientation === "down"   ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      if (r < 0 || r >= rows || c < 0 || c >= cols) {
        errors.push(`"${answer}" runs outside the grid`);
        break;
      }
      if (grid[r][c] !== null && grid[r][c] !== answer[i]) {
        errors.push(`crossing conflict in "${answer}" at row ${r}, col ${c}`);
      }
      grid[r][c] = answer[i];
    }
  }

  // Connectivity: every filled cell must belong to one connected grid
  let start = null, filled = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (grid[r][c] !== null) { filled++; if (!start) start = [r, c]; }
  }
  if (start) {
    const visited = new Set([start.join(",")]);
    const stack = [start];
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nr = r + dr, nc = c + dc, k = `${nr},${nc}`;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== null && !visited.has(k)) {
          visited.add(k); stack.push([nr, nc]);
        }
      }
    }
    if (visited.size !== filled) errors.push("grid is not fully connected");
  }

  // Numbering: every entry must receive a clue number
  const numbering = buildNumbering(words, rows, cols);
  for (const w of words) {
    if (!numbering[`${w.starty},${w.startx}`]) {
      errors.push(`"${(w.answer || w.word || "").toUpperCase()}" has no clue number`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function placeWord(word, best, grid, placedWords) {
  placedWords.push({ ...word, orientation: best.orientation, startx: best.col, starty: best.row });
  for (let i = 0; i < word.answer.length; i++) {
    const r = best.orientation === "down"   ? best.row + i : best.row;
    const c = best.orientation === "across" ? best.col + i : best.col;
    grid[r][c] = word.answer[i];
  }
}

export function buildLayout(apiWords, grade = "3") {
  if (!apiWords?.length) return null;

  const seen = new Set();
  const baseList = apiWords
    .filter(w => { const k = w.word.toUpperCase(); if (seen.has(k)) return false; seen.add(k); return true; })
    .map(w => ({ ...w, answer: w.word.toUpperCase(), clue: w.clue }))
    // Crossword entries are 3+ letters (handoff §14.4). Shorter "words" from
    // the AI can never be legal entries, so they are excluded up front rather
    // than silently vanishing during placement.
    .filter(w => w.answer.length >= 3);
  if (baseList.length < 4) return null;
  const sorted = [...baseList].sort((a, b) => b.answer.length - a.answer.length);

  const longestLen = sorted[0].answer.length;
  const SIZE = pickGridSize(sorted.length, longestLen);
  const rows = SIZE, cols = SIZE;

  const MAX_ATTEMPTS = 6;

  let bestResult = null;
  let bestPlacedCount = 0;
  let bestValidResult = null;
  let bestValidPlacedCount = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const wordList = attempt === 0 ? sorted : [sorted[0], ...shuffle(sorted.slice(1))];
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    const placedWords = [];

    const firstWord = wordList[0];
    const startRow = Math.floor(rows / 2);
    const startCol = Math.floor((cols - firstWord.answer.length) / 2);
    placedWords.push({ ...firstWord, orientation: "across", startx: startCol, starty: startRow });
    for (let i = 0; i < firstWord.answer.length; i++) {
      grid[startRow][startCol + i] = firstWord.answer[i];
    }

    for (let wi = 1; wi < wordList.length; wi++) {
      const word = wordList[wi];
      if (placedWords.some(p => p.answer === word.answer)) continue;
      const placements = findPlacements(word.answer, grid, rows, cols, placedWords);
      if (!placements.length) continue;
      placeWord(word, placements[0], grid, placedWords);
    }

    // Rescue pass: a word skipped early may cross a word placed later.
    // Retry the leftovers against the grown grid until nothing new fits.
    let progressed = true;
    while (progressed) {
      progressed = false;
      for (const word of wordList) {
        if (placedWords.some(p => p.answer === word.answer)) continue;
        const placements = findPlacements(word.answer, grid, rows, cols, placedWords);
        if (!placements.length) continue;
        placeWord(word, placements[0], grid, placedWords);
        progressed = true;
      }
    }

    if (placedWords.length > bestPlacedCount) {
      bestPlacedCount = placedWords.length;
      bestResult = { rows, cols, placedWords, grid };
    }

    const check = validateLayout(placedWords, rows, cols);
    if (check.ok && placedWords.length > bestValidPlacedCount) {
      bestValidPlacedCount = placedWords.length;
      bestValidResult = { rows, cols, placedWords, grid };
    }

    // Only a complete layout ends the search early — never a partial one.
    if (placedWords.length >= sorted.length) break;
  }

  const chosen = bestValidResult || bestResult;
  if (!chosen || chosen.placedWords.length < 4) return null;

  const { placedWords } = chosen;
  const numbering = buildNumbering(placedWords, rows, cols);
  const words = placedWords.map(w => ({
    ...w,
    number: numbering[`${w.starty},${w.startx}`] || 0,
  }));

  console.log(`[StoryClue] Grid: ${rows}×${cols} | Words placed: ${words.length}/${sorted.length} | Grade: ${grade}`);
  return { rows, cols, words };
}
