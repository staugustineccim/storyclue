import CrosswordLayoutGenerator from "crossword-layout-generator";

// Takes words from API: [{word, clue}]
// Returns placed puzzle data ready for CrosswordPuzzle component, or null if layout fails.
export function buildLayout(apiWords) {
  const input = {
    rows: 25,
    cols: 25,
    words: apiWords.map(w => ({ answer: w.word.toUpperCase(), clue: w.clue })),
  };

  let output;
  try {
    output = CrosswordLayoutGenerator.generateLayout(input);
  } catch {
    return null;
  }

  let placed = output.result.filter(w => w.orientation !== "none");

  // Retry with smaller word list if fewer than 15 placed
  if (placed.length < 15 && apiWords.length > 15) {
    const trimmed = { ...input, words: input.words.slice(0, -3) };
    try {
      const retry = CrosswordLayoutGenerator.generateLayout(trimmed);
      const retryPlaced = retry.result.filter(w => w.orientation !== "none");
      if (retryPlaced.length >= placed.length) {
        placed = retryPlaced;
        output = retry;
      }
    } catch { /* keep original */ }
  }

  if (placed.length < 15) return null;
  if (!validateIntersections(placed)) return null;

  const rows = output.rows;
  const cols = output.cols;
  const numbering = buildNumbering(placed, rows, cols);

  const words = placed.map(w => ({
    answer: w.answer,
    clue: w.clue,
    orientation: w.orientation,
    startx: w.startx,
    starty: w.starty,
    number: numbering[`${w.starty},${w.startx}`] || 0,
  }));

  return { rows, cols, words };
}

function validateIntersections(placed) {
  const cellSet = word => {
    const cells = new Set();
    for (let i = 0; i < word.answer.length; i++) {
      const r = word.orientation === "down" ? word.starty + i : word.starty;
      const c = word.orientation === "across" ? word.startx + i : word.startx;
      cells.add(`${r},${c}`);
    }
    return cells;
  };

  for (const word of placed) {
    const mine = cellSet(word);
    const intersects = placed.some(other => {
      if (other === word) return false;
      for (const cell of cellSet(other)) {
        if (mine.has(cell)) return true;
      }
      return false;
    });
    if (!intersects) return false;
  }
  return true;
}

export function buildGrid(words, rows, cols) {
  const g = Array.from({ length: rows }, () => Array(cols).fill(null));
  words.forEach(({ answer, orientation, startx, starty }) => {
    for (let i = 0; i < answer.length; i++) {
      if (orientation === "across" && startx + i < cols) g[starty][startx + i] = answer[i];
      else if (orientation === "down" && starty + i < rows) g[starty + i][startx] = answer[i];
    }
  });
  return g;
}

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
