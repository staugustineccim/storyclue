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
import { kv } from "@vercel/kv";

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
  const res = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/pattern-generator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed }),
  });
  if (!res.ok) throw new Error("Pattern generation failed");
  return res.json();
}

// Step 3: Fill grid
async function fillGrid(pattern, slots, seed = 0) {
  const res = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/grid-builder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pattern, slots, seed, timeLimit: 6 }),
  });
  if (!res.ok) throw new Error("Grid fill failed");
  return res.json();
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

  const { source, grade = "6-12", theme = "", contentType = "text" } = req.body;
  if (!source) {
    return res.status(400).json({ error: "Missing source" });
  }

  try {
    console.log("[generate-classic] Starting Classic crossword generation...");

    // Step 1: Extract topic answers
    console.log("[generate-classic] Extracting topic answers...");
    const topicWords = await extractTopicAnswers(source, grade);
    console.log(`[generate-classic] Extracted ${topicWords.length} topic words`);

    // Step 2: Generate pattern (try up to 16 seeds)
    let pattern, slots;
    console.log("[generate-classic] Generating symmetric pattern...");
    for (let seed = 0; seed < 16; seed++) {
      const result = await generatePattern(seed);
      if (result && result.pattern) {
        pattern = result.pattern;
        slots = result.slots;
        console.log(`[generate-classic] Pattern generated (seed ${seed}, ${slots.length} slots)`);
        break;
      }
    }
    if (!pattern) {
      return res.status(400).json({ error: "Could not generate valid pattern" });
    }

    // Step 3: Fill grid (try up to 4 random restarts)
    let fillResult;
    console.log("[generate-classic] Filling grid with constraint solver...");
    for (let restart = 0; restart < 4; restart++) {
      fillResult = await fillGrid(pattern, slots, restart);
      if (fillResult.success) {
        console.log(`[generate-classic] Grid filled in ${fillResult.fillTime.toFixed(2)}s (attempt ${restart + 1})`);
        break;
      }
    }
    if (!fillResult || !fillResult.success) {
      return res.status(400).json({ error: "Could not fill grid after multiple attempts" });
    }

    // Step 4: Generate clues (Rich + Classic)
    console.log("[generate-classic] Generating clues...");
    const clues = await generateClues(source, grade, topicWords, fillResult);
    console.log(`[generate-classic] Generated ${clues.length} clues`);

    // Calculate stats
    const onTopicCount = clues.filter(c => c.on_topic).length;
    const longAnswerCount = clues.filter(c => c.answer.length >= 6).length;
    const longOnTopicCount = clues.filter(c => c.answer.length >= 6 && c.on_topic).length;

    console.log(`[generate-classic] Topic ratio: ${onTopicCount}/${clues.length} (${Math.round((onTopicCount / clues.length) * 100)}%)`);
    console.log(`[generate-classic] 6+ letter words on-topic: ${longOnTopicCount}/${longAnswerCount}`);

    // Return the complete puzzle
    return res.status(200).json({
      success: true,
      puzzle: {
        pattern: fillResult.pattern,
        answers: fillResult,
        clues,
        stats: {
          wordCount: clues.length,
          blockCount: pattern.flat().filter(c => c === "#").length,
          fillTime: fillResult.fillTime,
          topicRatio: (onTopicCount / clues.length).toFixed(2),
          onTopicWords: onTopicCount,
        },
      },
    });
  } catch (error) {
    console.error("[generate-classic] error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
