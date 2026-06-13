// ── /api/pattern-generator ─────────────────────────────────────────────────────
// POST { seed }
// Returns: { pattern, slots }
//
// Generates a 15×15 NYT-style symmetric crossword pattern.
// Port of gridfill6.py (greedy symmetric block placement).

function extractSlots(pattern) {
  const slots = [];
  const size = pattern.length;

  // Across
  for (let r = 0; r < size; r++) {
    let start = null;
    for (let c = 0; c <= size; c++) {
      if (c === size || pattern[r][c] === "#") {
        if (start !== null && c - start > 1) {
          const slot = [];
          for (let i = start; i < c; i++) {
            slot.push([r, i]);
          }
          slots.push(slot);
        }
        start = null;
      } else if (start === null) {
        start = c;
      }
    }
  }

  // Down
  for (let c = 0; c < size; c++) {
    let start = null;
    for (let r = 0; r <= size; r++) {
      if (r === size || pattern[r][c] === "#") {
        if (start !== null && r - start > 1) {
          const slot = [];
          for (let i = start; i < r; i++) {
            slot.push([i, c]);
          }
          slots.push(slot);
        }
        start = null;
      } else if (start === null) {
        start = r;
      }
    }
  }

  return slots;
}

// Simple RNG seeded by number
function makeRng(seed) {
  let m_w = 123456 + seed;
  let m_z = 987654 - seed;
  return () => {
    m_z = 36969 * (m_z & 65535) + (m_z >> 16);
    m_w = 18000 * (m_w & 65535) + (m_w >> 16);
    return (((m_z << 16) + (m_w & 65535)) >>> 0) / 4294967296;
  };
}

// Generate one row's block columns with all open segments >= 3
function rowOptions(size, rng) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const nblocks = [0, 1, 1, 2, 2, 2, 3, 3][Math.floor(rng() * 8)];
    const indices = [];
    for (let i = 0; i < size; i++) indices.push(i);
    const cols = [];
    for (let i = 0; i < nblocks && indices.length > 0; i++) {
      const idx = Math.floor(rng() * indices.length);
      cols.push(indices[idx]);
      indices.splice(idx, 1);
    }
    cols.sort((a, b) => a - b);

    let ok = true;
    let prev = -1;
    for (const b of cols) {
      const seg = b - prev - 1;
      if (seg !== 0 && seg < 3) {
        ok = false;
        break;
      }
      prev = b;
    }
    if (ok && size - prev - 1 > 0 && size - prev - 1 < 3) ok = false;

    if (ok) return new Set(cols);
  }
  return new Set();
}

// Generate a symmetric pattern
function genPattern(size = 15, seed = 0, maxWords = 78, maxBlocks = 44) {
  const rng = makeRng(seed);
  const half = Math.floor(size / 2);

  for (let attempt = 0; attempt < 300000; attempt++) {
    const blocks = new Set();

    // Generate symmetric blocks
    for (let r = 0; r < half; r++) {
      const rowOpts = rowOptions(size, rng);
      for (const c of rowOpts) {
        blocks.add(`${r},${c}`);
        blocks.add(`${size - 1 - r},${size - 1 - c}`);
      }
    }

    // Center row (symmetric with itself)
    const centerOpts = rowOptions(size, rng);
    for (const c of centerOpts) {
      blocks.add(`${half},${c}`);
      blocks.add(`${half},${size - 1 - c}`);
    }

    // Build pattern
    const pattern = [];
    for (let r = 0; r < size; r++) {
      let row = "";
      for (let c = 0; c < size; c++) {
        row += blocks.has(`${r},${c}`) ? "#" : ".";
      }
      pattern.push(row);
    }

    // Validate
    let ok = true;
    let slots;
    try {
      slots = extractSlots(pattern);
    } catch {
      continue;
    }

    if (slots.length > maxWords || blocks.size > maxBlocks) continue;

    // Check connectivity
    const opens = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!blocks.has(`${r},${c}`)) {
          opens.push(`${r},${c}`);
        }
      }
    }

    const seen = new Set();
    const queue = [opens[0]];
    seen.add(opens[0]);

    while (queue.length > 0) {
      const key = queue.shift();
      const [r, c] = key.split(",").map(Number);
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        const nkey = `${nr},${nc}`;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !blocks.has(nkey) && !seen.has(nkey)) {
          seen.add(nkey);
          queue.push(nkey);
        }
      }
    }

    if (seen.size !== opens.length) continue;

    return { pattern, slots };
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { seed = 0 } = req.body;

  try {
    const result = genPattern(15, seed);
    if (!result) {
      return res.status(400).json({ error: "Could not generate valid pattern" });
    }
    return res.status(200).json(result);
  } catch (e) {
    console.error("[pattern-generator] error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
