// ── /api/grid-builder ──────────────────────────────────────────────────────────
// POST { pattern, slots, topicWords, seed }
// Returns: { success, across, down, fillTime }
//
// Proper crossword solver: backtracking placement of curated topic words + filler

const BASE_FILLER = {
  3: ["THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "TWO", "WAY", "WHO", "BOY", "DID", "ITS", "LET", "MAY", "SAY", "SHE", "TOO", "USE"],
  4: ["THAT", "WITH", "HAVE", "THIS", "WILL", "YOUR", "FROM", "THEY", "KNOW", "WANT", "BEEN", "GOOD", "MUCH", "SOME", "TIME", "VERY", "WHEN", "COME", "HERE", "JUST", "LIKE", "LONG", "MAKE", "MANY", "OVER", "SUCH", "TAKE", "THAN", "THEM", "THEN", "WELL", "WORK", "YEAR"],
  5: ["ABOUT", "AFTER", "AGAIN", "COULD", "EVERY", "FIRST", "GREAT", "HOUSE", "LARGE", "LITTLE", "OTHER", "PLACE", "RIGHT", "SMALL", "STILL", "THEIR", "THERE", "THESE", "THINK", "THREE", "WATER", "WHERE", "WHICH", "WHILE", "WORLD", "WOULD", "WRITE", "YOUNG"],
  6: ["BEFORE", "CHANGE", "CALLED", "SHOULD", "PEOPLE", "NUMBER", "ALWAYS", "AROUND", "BECAME", "BETTER", "FATHER", "FOLLOW", "FRIEND", "MOTHER", "SECOND", "SYSTEM", "THOUGH", "DURING", "THINGS", "TURNED"],
  7: ["ANOTHER", "BETWEEN", "BECAUSE", "THROUGH", "PRESENT", "SEVERAL", "WITHOUT", "AGAINST", "GENERAL", "MORNING", "HIMSELF", "HERSELF", "NOTHING", "WORKING", "PICTURE", "PROBLEM", "SPECIAL"],
  8: ["TOGETHER", "FINISHED", "BUSINESS", "CHILDREN", "SUDDENLY", "QUESTION", "BUILDING", "NATIONAL", "POSITION", "PERSONAL"],
};

function buildWordList(topicWords) {
  const wordsByLength = {};
  for (let len = 3; len <= 8; len++) {
    wordsByLength[len] = [];
  }

  // Add topic words first (prioritized)
  for (const word of topicWords) {
    const len = word.length;
    if (len >= 3 && len <= 8 && !wordsByLength[len].includes(word)) {
      wordsByLength[len].unshift(word);
    }
  }

  // Add filler words
  for (let len = 3; len <= 8; len++) {
    for (const word of BASE_FILLER[len]) {
      if (!wordsByLength[len].includes(word)) {
        wordsByLength[len].push(word);
      }
    }
  }

  return wordsByLength;
}

function solve(pattern, slots, wordsByLength, seed = 0, timeLimit = 6) {
  const t0 = Date.now();
  const grid = {};
  const assignment = {};
  const used = new Set();

  // Initialize grid
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] === ".") {
        grid[`${r},${c}`] = null;
      }
    }
  }

  // Build cell→slots map
  const cellSlots = {};
  for (let si = 0; si < slots.length; si++) {
    for (let pos = 0; pos < slots[si].length; pos++) {
      const [r, c] = slots[si][pos];
      const key = `${r},${c}`;
      if (!cellSlots[key]) cellSlots[key] = [];
      cellSlots[key].push([si, pos]);
    }
  }

  // Backtracking solver
  function backtrack(slotIdx) {
    if (Date.now() - t0 > timeLimit * 1000) return false;
    if (slotIdx === slots.length) return true;

    const slot = slots[slotIdx];
    const len = slot.length;
    const words = wordsByLength[len] || [];

    // Find candidates that match existing letters
    for (const word of words) {
      if (used.has(word)) continue;

      let matches = true;
      for (let i = 0; i < len; i++) {
        const [r, c] = slot[i];
        const ch = grid[`${r},${c}`];
        if (ch !== null && ch !== word[i]) {
          matches = false;
          break;
        }
      }

      if (!matches) continue;

      // Place word
      const saved = {};
      for (let i = 0; i < len; i++) {
        const [r, c] = slot[i];
        const key = `${r},${c}`;
        saved[key] = grid[key];
        grid[key] = word[i];
      }

      used.add(word);
      assignment[slotIdx] = word;

      // Check forward: any intersecting slot must have candidates
      let ok = true;
      for (const [r, c] of slot) {
        const key = `${r},${c}`;
        for (const [sj, pj] of cellSlots[key] || []) {
          if (sj !== slotIdx && !assignment.hasOwnProperty(sj)) {
            const sj_len = slots[sj].length;
            const sj_words = wordsByLength[sj_len] || [];
            let has_cand = false;
            for (const w of sj_words) {
              if (used.has(w)) continue;
              let fits = true;
              for (let i = 0; i < sj_len; i++) {
                const [rr, cc] = slots[sj][i];
                const ch = grid[`${rr},${cc}`];
                if (ch !== null && ch !== w[i]) {
                  fits = false;
                  break;
                }
              }
              if (fits) {
                has_cand = true;
                break;
              }
            }
            if (!has_cand) {
              ok = false;
              break;
            }
          }
        }
        if (!ok) break;
      }

      if (ok && backtrack(slotIdx + 1)) return true;

      // Backtrack
      for (const [r, c] of slot) {
        grid[`${r},${c}`] = saved[`${r},${c}`];
      }
      used.delete(word);
      delete assignment[slotIdx];
    }

    return false;
  }

  backtrack(0);

  const fillTime = (Date.now() - t0) / 1000;
  if (Object.keys(assignment).length < slots.length) {
    return { success: false, fillTime, error: "Incomplete fill" };
  }

  // Extract answers
  const across = [], down = [];
  let num = 1;
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] === ".") continue;
      const hasAcross = c === 0 || pattern[r][c - 1] === ".";
      const hasDown = r === 0 || pattern[r - 1]?.[c] === ".";
      if (hasAcross || hasDown) {
        if (hasAcross) {
          let ans = "";
          for (let cc = c; cc < pattern[r].length && pattern[r][cc] !== "."; cc++) {
            ans += grid[`${r},${cc}`];
          }
          across.push({ num, dir: "A", answer: ans });
        }
        if (hasDown) {
          let ans = "";
          for (let rr = r; rr < pattern.length && pattern[rr][c] !== "."; rr++) {
            ans += grid[`${rr},${c}`];
          }
          down.push({ num, dir: "D", answer: ans });
        }
        num++;
      }
    }
  }

  return { success: true, pattern, across, down, fillTime };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Not allowed" });
  const { pattern, slots, topicWords = [], seed = 0, timeLimit = 6 } = req.body;
  if (!pattern || !slots) return res.status(400).json({ error: "Missing data" });

  try {
    const wordsByLength = buildWordList(topicWords);
    const result = solve(pattern, slots, wordsByLength, seed, timeLimit);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
