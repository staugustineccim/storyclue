const BASE_WORDLIST = {
  3: ["THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "TWO", "WAY", "WHO", "BOY", "DID"],
  4: ["THAT", "WITH", "HAVE", "THIS", "WILL", "YOUR", "FROM", "THEY", "KNOW", "WANT", "BEEN", "GOOD", "MUCH", "SOME", "TIME", "VERY", "WHEN", "COME", "HERE", "JUST", "LIKE", "LONG", "MAKE", "MANY"],
  5: ["ABOUT", "AFTER", "AGAIN", "COULD", "EVERY", "FIRST", "GREAT", "HOUSE", "LARGE", "LITTLE", "OTHER", "PLACE", "RIGHT", "SMALL", "STILL", "THEIR", "THERE", "THESE", "THINK", "THREE"],
  6: ["BEFORE", "CHANGE", "CALLED", "SHOULD", "PEOPLE", "NUMBER", "ALWAYS", "AROUND", "BECAME", "BETTER"],
  7: ["ANOTHER", "BETWEEN", "BECAUSE", "THROUGH", "PRESENT", "SEVERAL", "WITHOUT", "AGAINST"],
  8: ["TOGETHER", "FINISHED", "BUSINESS", "CHILDREN", "SUDDENLY", "QUESTION"],
};

function buildIndex(wordsByLength) {
  const idx = {};
  for (const [len, words] of Object.entries(wordsByLength)) {
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      for (let pos = 0; pos < w.length; pos++) {
        const key = `${len},${pos},${w[pos]}`;
        if (!idx[key]) idx[key] = [];
        idx[key].push(i);
      }
    }
  }
  return idx;
}

function makeSolver(wordsByLength, idx) {
  return function solve(pattern, slots, seed = 0, timeLimit = 6) {
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

    // Greedy fill: left-to-right, pick first matching word
    for (let si = 0; si < slots.length; si++) {
      if (Date.now() - t0 > timeLimit * 1000) break;

      const slot = slots[si];
      const L = String(slot.length);
      const words = wordsByLength[L] || [];

      // Find constraints from already-assigned cells
      let candidates = [];
      for (let wi = 0; wi < words.length; wi++) {
        const w = words[wi];
        if (used.has(w)) continue;

        let matches = true;
        for (let i = 0; i < slot.length; i++) {
          const [r, c] = slot[i];
          const ch = grid[`${r},${c}`];
          if (ch !== null && ch !== w[i]) {
            matches = false;
            break;
          }
        }
        if (matches) candidates.push(wi);
      }

      // Pick first candidate
      if (candidates.length > 0) {
        const wi = candidates[0];
        const w = words[wi];
        for (let i = 0; i < slot.length; i++) {
          const [r, c] = slot[i];
          grid[`${r},${c}`] = w[i];
        }
        used.add(w);
        assignment[si] = w;
      }
    }

    const fillTime = (Date.now() - t0) / 1000;

    // Extract answers
    const across = [], down = [];
    let num = 1;
    for (let r = 0; r < pattern.length; r++) {
      for (let c = 0; c < pattern[r].length; c++) {
        if (pattern[r][c] === ".") continue;
        const hasAcross = c === 0 || pattern[r][c - 1] === ".";
        const hasDown = r === 0 || pattern[r - 1][c] === ".";
        if (hasAcross || hasDown) {
          let acrossAns = "", downAns = "";
          if (hasAcross) {
            for (let cc = c; cc < pattern[r].length && pattern[r][cc] !== "."; cc++) {
              acrossAns += grid[`${r},${cc}`] || "?";
            }
            across.push({ num, dir: "A", answer: acrossAns });
          }
          if (hasDown) {
            for (let rr = r; rr < pattern.length && pattern[rr][c] !== "."; rr++) {
              downAns += grid[`${rr},${c}`] || "?";
            }
            down.push({ num, dir: "D", answer: downAns });
          }
          num++;
        }
      }
    }

    return { success: true, pattern, across, down, fillTime };
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Not allowed" });
  const { pattern, slots, seed = 0, timeLimit = 6 } = req.body;
  if (!pattern || !slots) return res.status(400).json({ error: "Missing data" });

  try {
    const idx = buildIndex(BASE_WORDLIST);
    const solver = makeSolver(BASE_WORDLIST, idx);
    const result = solver(pattern, slots, seed, timeLimit);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
