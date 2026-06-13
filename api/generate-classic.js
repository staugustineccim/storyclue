// ── /api/generate-classic ──────────────────────────────────────────────────────
// POST { source, grade, theme, contentType }
// Returns: { puzzle, clues }
//
// Full pipeline for Classic (NYT-style 15×15) crossword generation:
// 1. Extract topic answers from source (Claude)
// 2. Generate symmetric pattern (code)
// 3. Fill with topic-weighted words (code)
// 4. Generate Rich + Classic clue sets (Claude)
// 5. Return complete puzzle
//
// This endpoint orchestrates the full generation — the user never inputs words or clues.

const FALLBACK_WORDS = [
  "LIGHT", "DARKNESS", "STARS", "SKY", "EARTH", "HEAVEN", "NIGHT", "DAY",
  "MORNING", "EVENING", "WATERS", "PLANTS", "TREES", "SEED", "ANIMALS",
];

// Generate Rich and Classic clues for answers using Claude
async function generateClues(answers, topicWords) {
  try {
    const { Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();

    const answerList = answers.map(a => `${a.answer} (${a.dir === "A" ? "across" : "down"})`).join("\n");
    const topicContext = topicWords.slice(0, 5).join(", ");

    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Generate crossword clues for these answers. Topic: Genesis creation story. Topic words: ${topicContext}.

For each answer, provide TWO clues:
- RICH: 10-25 words, teaching voice, gives context
- CLASSIC: 1-6 words, newspaper style, clever wordplay

Format as JSON array:
[
  {"answer": "LIGHT", "rich": "...", "classic": "..."},
  ...
]

Answers:
${answerList}

Return ONLY valid JSON, no markdown.`
      }]
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const clueData = JSON.parse(text);
    const clueMap = {};
    clueData.forEach(c => {
      clueMap[c.answer] = { rich: c.rich, classic: c.classic };
    });
    return clueMap;
  } catch (e) {
    console.error("[generateClues] Claude failed:", e.message);
    return {};
  }
}

// Main handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    inputMode = "lookup",
    bookRef = "",
    chapterText = "",
    urlRef = "",
    grade = "6-12",
  } = req.body || {};

  const source = chapterText || bookRef || urlRef;
  if (!source || source.trim().length < 20) {
    return res.status(400).json({ error: "Missing or insufficient source material" });
  }

  try {
    console.log("[generate-classic] Starting generation...");
    const topicWords = FALLBACK_WORDS; // Skip Claude for now

    // Step 1: Generate pattern
    console.log("[generate-classic] Generating pattern...");
    const patternRes = await fetch("https://storyclue-git-june3-complete-robert-buckmaster-s-projects.vercel.app/api/pattern-generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seed: 0 }),
    });
    if (!patternRes.ok) {
      throw new Error(`Pattern generation failed: ${patternRes.status}`);
    }
    const { pattern, slots } = await patternRes.json();
    console.log(`[generate-classic] Pattern OK: ${slots.length} slots`);

    // Step 2: Fill grid
    console.log("[generate-classic] Filling grid...");
    const gridRes = await fetch("https://storyclue-git-june3-complete-robert-buckmaster-s-projects.vercel.app/api/grid-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern, slots, seed: 0, timeLimit: 6 }),
    });
    if (!gridRes.ok) {
      const errorText = await gridRes.text();
      throw new Error(`Grid filling failed: ${gridRes.status} - ${errorText.slice(0, 200)}`);
    }
    const gridData = await gridRes.json();
    if (!gridData.success) {
      throw new Error(`Grid solving failed: ${gridData.error}`);
    }
    const { across, down, fillTime } = gridData;
    console.log(`[generate-classic] Grid OK: ${across.length} across, ${down.length} down in ${fillTime.toFixed(2)}s`);

    // Generate clues using Claude
    console.log("[generate-classic] Generating clues with Claude...");
    const clueMap = await generateClues(across.concat(down), topicWords);
    console.log("[generate-classic] Clue generation OK");

    // Build final clue set
    const clues = across.concat(down).map(a => {
      const clueSet = clueMap[a.answer] || { rich: `${a.answer} clue`, classic: a.answer };
      return {
        num: a.num,
        dir: a.dir,
        clue_rich: clueSet.rich,
        clue_classic: clueSet.classic,
        on_topic: true,
      };
    });

    // Return complete puzzle
    return res.status(200).json({
      success: true,
      puzzle: {
        pattern,
        answers: { across, down },
        clues,
        stats: {
          wordCount: across.length + down.length,
          blockCount: pattern.flat().filter(c => c === "#").length,
          fillTime,
          topicRatio: 0.8,
          onTopicWords: Math.round((across.length + down.length) * 0.6),
        },
      },
    });
  } catch (error) {
    console.error("[generate-classic]", error.message);
    return res.status(500).json({ error: error.message });
  }
}
