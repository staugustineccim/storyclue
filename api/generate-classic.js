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

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Topic word extraction prompt
const TOPIC_EXTRACTION_PROMPT = `You are a crossword puzzle designer for StoryClue. Your task is to extract topic answers from the given source material.

SOURCE MATERIAL:
{source}

Extract a JSON array of 25-40 important topic words from this source. These are the "theme words" that will anchor the crossword puzzle.

Requirements:
- Words must be 3-15 letters long
- Include characters, places, objects, concepts, and vocabulary from the source
- Prefer 6+ letter words (they're the most visible in the grid)
- No repeats
- No proper names (unless they're common enough that solvers would know them)
- Return as uppercase, ASCII-only

Grade level: {grade}

Return ONLY a JSON array of strings:
["WORD1", "WORD2", "WORD3", ...]`;

// Topic-aware clue generation prompt
const CLUE_GENERATION_PROMPT = `You are writing crossword clues in StoryClue's rich, teaching style.

SOURCE MATERIAL:
{source}

GRID: {gridDescription}

TOPIC WORDS (these are the "theme" answers):
{topicWords}

For the answers below, write one clue per answer. Follow these rules:

Rich mode (default): 10–25 words, warm teaching voice, always reference the source material if the answer is a topic word or appears in the source.
- "This Belgian port city on the Scheldt River has been the center of the world's diamond trade for over 500 years" → ANTWERP

Classic mode (optional): 1–6 words, newspaper brevity, tight definition or fill-in-the-blank.
- "Belgian port" → ANTWERP

Grade level: {grade}

Never use the answer word or its root in the clue.
Mark on_topic=true if the answer is a topic word or strongly connected to the source.

ANSWERS (these are already placed in the grid):
{answers}

Return JSON array:
[
  {"num":1,"dir":"A","answer":"WORD","clue_rich":"...","clue_classic":"...","on_topic":true|false},
  ...
]`;

// Step 1: Extract topic answers
async function extractTopicAnswers(source, grade) {
  const prompt = TOPIC_EXTRACTION_PROMPT
    .replace("{source}", source)
    .replace("{grade}", grade);

  const message = await client.messages.create({
    model: "claude-opus-4-1-20250805",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Could not parse topic words from Claude response");

  return JSON.parse(match[0]);
}

// Step 2: Generate pattern
async function generatePattern(seed = 0) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  console.log("[generatePattern] Using baseUrl:", baseUrl);

  try {
    const url = `${baseUrl}/api/pattern-generator`;
    console.log("[generatePattern] Calling:", url);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seed }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pattern generation failed: ${res.status} ${text.slice(0, 150)}`);
    }
    const data = await res.json();
    console.log("[generatePattern] Success:", data.pattern?.length, "rows,", data.slots?.length, "slots");
    return data;
  } catch (err) {
    console.error("[generatePattern] error:", err.message);
    throw err;
  }
}

// Step 3: Fill grid
async function fillGrid(pattern, slots, seed = 0) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  console.log("[fillGrid] Using baseUrl:", baseUrl);

  try {
    const url = `${baseUrl}/api/grid-builder`;
    console.log("[fillGrid] Calling:", url, `with ${slots.length} slots`);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern, slots, seed, timeLimit: 6 }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Grid fill failed: ${res.status} ${text.slice(0, 150)}`);
    }
    const data = await res.json();
    console.log("[fillGrid] Success:", data.across?.length, "across,", data.down?.length, "down");
    return data;
  } catch (err) {
    console.error("[fillGrid] error:", err.message);
    throw err;
  }
}

// Step 4: Generate clues (both Rich and Classic)
async function generateClues(source, grade, topicWords, answers) {
  const gridDesc = `15×15 symmetric crossword with ${answers.across.length + answers.down.length} answers`;
  const answersStr = [...answers.across, ...answers.down]
    .map(a => `${a.num}${a.dir}: ${a.answer}`)
    .join(", ");

  const prompt = CLUE_GENERATION_PROMPT
    .replace("{source}", source)
    .replace("{grade}", grade)
    .replace("{topicWords}", topicWords.join(", "))
    .replace("{gridDescription}", gridDesc)
    .replace("{answers}", answersStr);

  const message = await client.messages.create({
    model: "claude-opus-4-1-20250805",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Could not parse clues from Claude response");

  return JSON.parse(match[0]);
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

  // Extract source from available fields (chapterText > bookRef > urlRef)
  const source = chapterText || bookRef || urlRef;
  if (!source || source.trim().length < 20) {
    return res.status(400).json({ error: "Missing or insufficient source material" });
  }

  try {
    console.log("[generate-classic] Starting Classic crossword generation...");
    console.log(`[generate-classic] Source length: ${source.length}, Grade: ${grade}`);

    // Step 1: Extract topic answers
    console.log("[generate-classic] Extracting topic answers...");
    const topicWords = await extractTopicAnswers(source, grade);
    console.log(`[generate-classic] Extracted ${topicWords.length} topic words: ${topicWords.slice(0, 10).join(", ")}`);
    if (!topicWords || topicWords.length < 5) {
      throw new Error(`Insufficient topic words extracted (got ${topicWords?.length || 0})`);
    }

    // TEMPORARY: Return success with topic words to verify endpoint works
    console.log("[generate-classic] Returning success response...");
    return res.status(200).json({
      success: true,
      puzzle: {
        pattern: Array(15).fill(".".repeat(15)),
        answers: {
          across: [{ num: 1, answer: "TEST" }],
          down: [{ num: 1, answer: "TEST" }],
        },
        clues: [
          { num: 1, dir: "A", clue_rich: "A trial run", clue_classic: "Trial", on_topic: false },
          { num: 1, dir: "D", clue_rich: "A trial run", clue_classic: "Trial", on_topic: false },
        ],
        stats: {
          wordCount: 2,
          blockCount: 50,
          fillTime: 0.1,
          topicRatio: 0,
          onTopicWords: 0,
        },
      },
      topicWords: topicWords.slice(0, 5),
    });
  } catch (error) {
    console.error("[generate-classic] error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
