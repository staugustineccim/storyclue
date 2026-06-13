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

// Note: generatePattern, fillGrid, and generateClues functions removed for testing

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

  // HARDCODED TEST: Just return success without any processing
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
  });
}
