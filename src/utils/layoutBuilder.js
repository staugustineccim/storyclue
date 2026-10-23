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

// ── Layout quality score ──────────────────────────────────────────────────────
// Placing every word is necessary but not sufficient — a grid where words dangle
// off a single crossing with dead space around them reads as amateur. This
// scores a finished layout the way the handoff's quality gate (§14.2) intends:
// crossing richness (letters checked by a perpendicular word), compactness
// (filled share of the bounding box), and a penalty per dangling word
// (fewer than 2 crossings). Used only to choose BETWEEN layouts that place
// the same number of words — completeness always wins first.
export function scoreLayout(words, rows, cols) {
  const cellDirs = new Map();
  let minR = rows, maxR = -1, minC = cols, maxC = -1, filled = 0;
  for (const w of words) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.orientation === "down" ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      const k = `${r},${c}`;
      if (!cellDirs.has(k)) { cellDirs.set(k, new Set()); filled++; }
      cellDirs.get(k).add(w.orientation);
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (c < minC) minC = c; if (c > maxC) maxC = c;
    }
  }
  let crossings = 0, dangling = 0;
  for (const w of words) {
    let cw = 0;
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.orientation === "down" ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      if (cellDirs.get(`${r},${c}`).size > 1) cw++;
    }
    crossings += cw;
    if (cw < 2) dangling++;
  }
  const avgCrossings = words.length ? crossings / words.length : 0;
  const bbox = maxR >= 0 ? (maxR - minR + 1) * (maxC - minC + 1) : 0;
  const density = bbox ? filled / bbox : 0;
  const score = Math.max(0, Math.min(100, Math.round(avgCrossings * 22 + density * 30 - dangling * 4)));
  return { score, avgCrossings: Math.round(avgCrossings * 100) / 100, density: Math.round(density * 100) / 100, dangling };
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

// ── One greedy attempt (the original strategy + rescue pass) ─────────────────
// Kept as the guaranteed baseline: buildLayout's result is never worse than
// this attempt, because the search attempts below only replace it when they
// place strictly more words in a valid layout.
function greedyAttempt(wordList, rows, cols) {
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

  return placedWords;
}

// ── Backtracking search attempt ───────────────────────────────────────────────
// Greedy placement paints itself into corners: an early word placed at its
// best crossing can block three later words. This search instead picks, at
// every step, the unplaced word with the FEWEST legal placements (most
// constrained first), tries its best few placements, and backs out of choices
// that strand the remaining words. A word with no legal placement is deferred,
// not fatal — the goal is to maximize the number placed. The search is bounded
// by a node budget and a wall-clock deadline, and keeps its best snapshot, so
// it always returns promptly with the best layout it found.
function searchAttempt(sorted, rows, cols, { nodeBudget = 250000, deadline = Infinity, jitter = 0, seedWord = null } = {}) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  const cover = Array.from({ length: rows }, () => Array(cols).fill(0));
  const placedWords = [];
  let nodes = 0;
  let best = null;

  const firstWord = seedWord || sorted[0];
  const startRow = Math.floor(rows / 2);
  const startCol = Math.floor((cols - firstWord.answer.length) / 2);

  function place(w, cand) {
    placedWords.push({ ...w, orientation: cand.orientation, startx: cand.col, starty: cand.row });
    for (let i = 0; i < w.answer.length; i++) {
      const r = cand.orientation === "down" ? cand.row + i : cand.row;
      const c = cand.orientation === "across" ? cand.col + i : cand.col;
      grid[r][c] = w.answer[i];
      cover[r][c]++;
    }
  }
  function unplace(w, cand) {
    placedWords.pop();
    for (let i = 0; i < w.answer.length; i++) {
      const r = cand.orientation === "down" ? cand.row + i : cand.row;
      const c = cand.orientation === "across" ? cand.col + i : cand.col;
      cover[r][c]--;
      if (cover[r][c] === 0) grid[r][c] = null;
    }
  }

  place(firstWord, { orientation: "across", row: startRow, col: startCol });

  function recurse() {
    if (!best || placedWords.length > best.length) {
      best = placedWords.map(w => ({ ...w }));
      if (best.length >= sorted.length) return true;
    }
    if (nodes >= nodeBudget || Date.now() > deadline) return false;

    // Most-constrained-first: the placeable word with the fewest candidates.
    let chosen = null, chosenCands = null;
    for (const w of sorted) {
      if (placedWords.some(p => p.answer === w.answer)) continue;
      const cands = findPlacements(w.answer, grid, rows, cols, placedWords);
      nodes++;
      if (!cands.length) continue;
      if (!chosenCands || cands.length < chosenCands.length ||
          (cands.length === chosenCands.length && w.answer.length > chosen.answer.length)) {
        chosen = w; chosenCands = cands;
        if (cands.length === 1) break;
      }
    }
    if (!chosen) return false; // nothing else can be placed on this branch

    // Try the best few placements (score order, lightly jittered per attempt
    // so repeated searches explore different corners of the space).
    const cands = chosenCands
      .map(c => ({ c, k: c.score + (jitter ? Math.random() * jitter : 0) }))
      .sort((a, b) => b.k - a.k)
      .slice(0, 4)
      .map(x => x.c);

    for (const cand of cands) {
      place(chosen, cand);
      const done = recurse();
      unplace(chosen, cand);
      if (done) return true;
      if (nodes >= nodeBudget || Date.now() > deadline) return false;
    }
    return false;
  }

  recurse();
  return best || placedWords;
}

// ── Rescue completion ─────────────────────────────────────────────────────────
// Rebuilds the grid from a finished (or best-effort) placement set and greedily
// retries any leftover words against it — the search's leftovers sometimes fit
// once the full picture exists. Can only add words, never removes any.
function completeWithRescue(placedWords, sorted, rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  const result = placedWords.map(w => ({ ...w }));
  for (const w of result) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.orientation === "down" ? w.starty + i : w.starty;
      const c = w.orientation === "across" ? w.startx + i : w.startx;
      grid[r][c] = w.answer[i];
    }
  }
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const word of sorted) {
      if (result.some(p => p.answer === word.answer)) continue;
      const placements = findPlacements(word.answer, grid, rows, cols, result);
      if (!placements.length) continue;
      placeWord(word, placements[0], grid, result);
      progressed = true;
    }
  }
  return result;
}

// ── Randomized swarm attempt ──────────────────────────────────────────────────
// The search above is deep but narrow: this engine only lets a word join the
// grid by crossing the existing component, so a component whose exposed
// letters can't reach the leftover words is a dead end no backtracking fixes.
// The way out is width — many cheap, diverse components. Each swarm attempt
// seeds a different long word at a jittered position, grows it in shuffled
// order with randomized placement picks, and finishes with the rescue pass.
// Individually weaker than the search; in a swarm, one of them usually finds
// the component that reaches almost everything.
function swarmAttempt(sorted, rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  const placedWords = [];

  const seedPool = sorted.slice(0, Math.min(5, sorted.length));
  const seed = seedPool[Math.floor(Math.random() * seedPool.length)];
  const startRow = Math.max(0, Math.min(rows - 1, Math.floor(rows / 2) + (Math.floor(Math.random() * 5) - 2)));
  const startCol = Math.max(0, Math.min(cols - seed.answer.length,
    Math.floor((cols - seed.answer.length) / 2) + (Math.floor(Math.random() * 5) - 2)));
  placedWords.push({ ...seed, orientation: "across", startx: startCol, starty: startRow });
  for (let i = 0; i < seed.answer.length; i++) {
    grid[startRow][startCol + i] = seed.answer[i];
  }

  const rest = shuffle(sorted.filter(w => w.answer !== seed.answer));
  for (const word of rest) {
    const placements = findPlacements(word.answer, grid, rows, cols, placedWords);
    if (!placements.length) continue;
    const pick = placements[Math.floor(Math.random() * Math.min(3, placements.length))];
    placeWord(word, pick, grid, placedWords);
  }

  return completeWithRescue(placedWords, sorted, rows, cols);
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

  let bestResult = null;
  let bestPlacedCount = 0;
  let bestValidResult = null;
  let bestValidPlacedCount = 0;

  let bestValidScore = -1;
  let lastGainAt = Date.now();
  const consider = (placedWords) => {
    if (placedWords.length > bestPlacedCount) {
      bestPlacedCount = placedWords.length;
      bestResult = { rows, cols, placedWords };
    }
    const check = validateLayout(placedWords, rows, cols);
    if (!check.ok) return;
    // Completeness first; quality score breaks ties between full layouts.
    const q = scoreLayout(placedWords, rows, cols).score;
    if (placedWords.length > bestValidPlacedCount ||
        (placedWords.length === bestValidPlacedCount && q > bestValidScore)) {
      bestValidPlacedCount = placedWords.length;
      bestValidResult = { rows, cols, placedWords };
      bestValidScore = q;
      lastGainAt = Date.now();
    }
  };

  // Attempt 0: the original greedy strategy (sorted, then shuffled retries) —
  // the baseline the search must beat, kept so results can never regress.
  for (let attempt = 0; attempt < 6; attempt++) {
    const wordList = attempt === 0 ? sorted : [sorted[0], ...shuffle(sorted.slice(1))];
    consider(greedyAttempt(wordList, rows, cols));
    if (bestValidPlacedCount >= sorted.length) break;
  }

  // Then the backtracking search, while time remains in the budget. A teacher
  // is waiting on this call, so the whole layout build stays snappy: the
  // search shares one ~2.5s deadline across its attempts and returns its best.
  const needsWords = bestValidPlacedCount < sorted.length;
  const needsPolish = !needsWords && bestValidScore < 70;
  if (needsWords || needsPolish) {
    // The improvement phase shares a ~1.2s budget (the AI call before this
    // already takes seconds; layout must not add a long tail) — or ~0.4s when
    // every word is already placed and only grid quality is being polished.
    // The swarm stops early once it goes 600ms without a better layout —
    // some leftover words are letter-starved and no amount of hunting helps.
    const deadline = Date.now() + (needsWords ? 1200 : 400);
    if (needsWords) {
      for (let s = 0; s < 6 && bestValidPlacedCount < sorted.length && Date.now() < deadline; s++) {
        const found = searchAttempt(sorted, rows, cols, {
          nodeBudget: 250000,
          deadline,
          jitter: s * 2,
          seedWord: sorted[s % Math.min(3, sorted.length)],
        });
        consider(completeWithRescue(found, sorted, rows, cols));
      }
    }

    // Swarm phase: spend whatever time remains on diverse randomized
    // components — the starvation problem is width, not depth.
    while (Date.now() < deadline && Date.now() - lastGainAt < 600) {
      if (bestValidPlacedCount >= sorted.length && bestValidScore >= 85) break;
      consider(swarmAttempt(sorted, rows, cols));
    }
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
