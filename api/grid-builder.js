// ── /api/grid-builder ──────────────────────────────────────────────────────────
// POST { pattern, slots, seed }
// Returns: { success, across, down, fillTime }
//
// Constraint-satisfaction solver: least-constraining-value + MRV heuristic

const BLOCKLIST = new Set([
  "CUCK", "STI", "STD", "SEXY", "SEX", "PORN", "NAZI", "RAPE", "DAMN", "HELL",
  "KILL", "KILLS", "KILLED", "DRUG", "DRUGS", "METH", "HEROIN", "VAPE", "BEER",
  "VODKA", "WHISKY", "SMUT", "ASS", "TIT", "ANAL", "ANUS", "DPRK", "HESS", "CUM",
  "GUN", "GUNS", "AMMO", "BOMB", "BOMBS", "PISS", "CRAP", "SLUT", "HOE", "HOES",
  "DIE", "DIED", "DEAD", "DEATH", "MURDER", "SUICIDE", "NUDE", "NAKED", "BUTT",
  "FART", "POOP", "HATE", "RACIST", "KKK", "ISIS", "COCAINE", "OPIOID", "WEED", "BONG"
]);

const BASE_WORDLIST = {
  3: ["THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "TWO", "WAY", "WHO", "BOY", "DID", "ITS", "LET", "MAY", "SAY", "SHE", "TOO", "USE"],
  4: ["THAT", "WITH", "HAVE", "THIS", "WILL", "YOUR", "FROM", "THEY", "KNOW", "WANT", "BEEN", "GOOD", "MUCH", "SOME", "TIME", "VERY", "WHEN", "COME", "HERE", "JUST", "LIKE", "LONG", "MAKE", "MANY", "OVER", "SUCH", "TAKE", "THAN", "THEM", "THEN", "WELL", "WORK", "YEAR"],
  5: ["ABOUT", "AFTER", "AGAIN", "COULD", "EVERY", "FIRST", "GREAT", "HOUSE", "LARGE", "LITTLE", "OTHER", "PLACE", "RIGHT", "SMALL", "STILL", "THEIR", "THERE", "THESE", "THINK", "THREE", "WATER", "WHERE", "WHICH", "WHILE", "WORLD", "WOULD", "WRITE", "YOUNG"],
  6: ["BEFORE", "CHANGE", "CALLED", "SHOULD", "PEOPLE", "NUMBER", "ALWAYS", "AROUND", "BECAME", "BETTER", "FATHER", "FOLLOW", "FRIEND", "MOTHER", "SECOND", "SYSTEM", "THOUGH", "DURING", "THINGS", "TURNED", "LIVING", "TAKING"],
  7: ["ANOTHER", "BETWEEN", "BECAUSE", "THROUGH", "PRESENT", "SEVERAL", "WITHOUT", "AGAINST", "GENERAL", "MORNING", "HIMSELF", "HERSELF", "NOTHING", "WORKING", "PICTURE", "PROBLEM", "SPECIAL", "FEELING", "REQUIRE", "CERTAIN", "ALREADY", "PERHAPS"],
  8: ["TOGETHER", "FINISHED", "BUSINESS", "CHILDREN", "SUDDENLY", "QUESTION", "BUILDING", "YOURSELF", "NATIONAL", "POSITION", "ALTHOUGH", "COMPLETE", "PERSONAL", "THINKING", "STRENGTH", "STRAIGHT", "STANDARD", "INTEREST", "CARRYING"],
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
    const rng = (() => {
      let m_w = 123456 + seed;
      let m_z = 987654 - seed;
      return () => {
        m_z = 36969 * (m_z & 65535) + (m_z >> 16);
        m_w = 18000 * (m_w & 65535) + (m_w >> 16);
        return ((m_z << 16) + (m_w & 65535)) >>> 0) / 4294967296;
      };
    })();

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

    // Build cell->slots mapping
    const cellSlots = {};
    for (let si = 0; si < slots.length; si++) {
      for (let pos = 0; pos < slots[si].length; pos++) {
        const [r, c] = slots[si][pos];
        const key = `${r},${c}`;
        if (!cellSlots[key]) cellSlots[key] = [];
        cellSlots[key].push([si, pos]);
      }
    }

    // Get candidate word IDs for a slot
    const candIds = (si) => {
      const slot = slots[si];
      const L = String(slot.length);
      let sets = [];
      for (let i = 0; i < slot.length; i++) {
        const [r, c] = slot[i];
        const ch = grid[`${r},${c}`];
        if (ch !== null) {
          const key = `${L},${i},${ch}`;
          if (!idx[key]) return new Set();
          sets.push(new Set(idx[key]));
        }
      }
      if (sets.length === 0) return null;
      return sets.reduce((a, b) => new Set([...a].filter(x => b.has(x))));
    };

    const ncand = (si) => {
      const c = candIds(si);
      const L = String(slots[si].length);
      return c === null ? wordsByLength[L].length : c.size;
    };

    const lcvScore = (si, w) => {
      let total = 0;
      for (let i = 0; i < w.length; i++) {
        const [r, c] = slots[si][i];
        const key = `${r},${c}`;
        if (grid[key] === null) {
          const crossings = cellSlots[key] || [];
          for (const [sj, pj] of crossings) {
            if (sj !== si && !assignment.hasOwnProperty(sj)) {
              const L = String(slots[sj].length);
              const idxKey = `${L},${pj},${w[i]}`;
              const f = idx[idxKey] ? idx[idxKey].length : 0;
              if (f === 0) return -1;
              total += f;
            }
          }
        }
      }
      return total + rng();
    };

    const doSolve = () => {
      if (Date.now() - t0 > timeLimit * 1000) return false;

      const unfilled = [];
      for (let si = 0; si < slots.length; si++) {
        if (!assignment.hasOwnProperty(si)) unfilled.push(si);
      }
      if (unfilled.length === 0) return true;

      let si = unfilled[0];
      let minCand = ncand(si);
      for (let i = 1; i < unfilled.length; i++) {
        const c = ncand(unfilled[i]);
        if (c < minCand) {
          si = unfilled[i];
          minCand = c;
        }
      }

      const slot = slots[si];
      const L = String(slot.length);
      const ids = candIds(si);
      const words = wordsByLength[L] || [];
      const pool = ids ? [...ids] : Array.from({length: words.length}, (_, i) => i);

      const scored = [];
      for (const wi of pool) {
        const w = words[wi];
        if (used.has(w)) continue;
        const sc = lcvScore(si, w);
        if (sc >= 0) scored.push([sc, wi]);
      }
      scored.sort((a, b) => b[0] - a[0]);

      for (const [_, wi] of scored.slice(0, 400)) {
        const w = words[wi];
        const saved = {};

        // FIXED: Assign word letters by position, not indexOf
        for (let i = 0; i < slot.length; i++) {
          const [r, c] = slot[i];
          const key = `${r},${c}`;
          saved[key] = grid[key];
          grid[key] = w[i];
        }

        used.add(w);
        assignment[si] = w;

        let ok = true;
        for (const [r, c] of slot) {
          const key = `${r},${c}`;
          for (const [sj] of cellSlots[key]) {
            if (sj !== si && !assignment.hasOwnProperty(sj) && ncand(sj) === 0) {
              ok = false;
              break;
            }
          }
          if (!ok) break;
        }

        if (ok && doSolve()) return true;

        for (const [r, c] of slot) {
          const key = `${r},${c}`;
          grid[key] = saved[key];
        }
        used.delete(w);
        delete assignment[si];
      }

      return false;
    };

    doSolve();

    const fillTime = (Date.now() - t0) / 1000;
    if (Object.keys(assignment).length < slots.length) {
      return { success: false, fillTime };
    }

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
              acrossAns += grid[`${r},${cc}`];
            }
            across.push({ num, dir: "A", answer: acrossAns });
          }
          if (hasDown) {
            for (let rr = r; rr < pattern.length && pattern[rr][c] !== "."; rr++) {
              downAns += grid[`${rr},${c}`];
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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pattern, slots, seed = 0, timeLimit = 6 } = req.body;
  if (!pattern || !slots) {
    return res.status(400).json({ error: "Missing pattern or slots" });
  }

  try {
    const idx = buildIndex(BASE_WORDLIST);
    const solver = makeSolver(BASE_WORDLIST, idx);
    const result = solver(pattern, slots, seed, timeLimit);
    return res.status(200).json(result);
  } catch (e) {
    console.error("[grid-builder] error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
