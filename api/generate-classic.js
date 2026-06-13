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

const TOPIC_EXTRACTION_PROMPT = `You are a crossword puzzle designer. Extract 25-40 important topic words from this source:

{source}

Requirements:
- 3-15 letters each
- Include characters, places, objects, concepts, vocabulary
- Prefer 6+ letter words
- No repeats, no proper names
- Uppercase, ASCII-only

Grade: {grade}

Return ONLY: ["WORD1", "WORD2", ...]`;

async function extractTopicAnswers(source, grade) {
  try {
    const client = new Anthropic(); // Initialize only when needed
    const prompt = TOPIC_EXTRACTION_PROMPT.replace("{source}", source).replace("{grade}", grade);
    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON in response");
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("[extractTopicAnswers]", err.message);
    throw err;
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
    console.log("[generate-classic] Extracting topic words...");
    const topicWords = await extractTopicAnswers(source, grade);
    console.log(`[generate-classic] Extracted ${topicWords.length} words`);

    // TODO: Pattern generation, grid solving, clue generation
    // For now, return test response with real topic words
    return res.status(200).json({
      success: true,
      puzzle: {
        pattern: Array(15).fill(".".repeat(15)),
        answers: {
          across: [{ num: 1, answer: topicWords[0] || "TEST" }],
          down: [{ num: 1, answer: topicWords[1] || "TEST" }],
        },
        clues: [
          { num: 1, dir: "A", clue_rich: `From source: ${topicWords[0]}`, clue_classic: topicWords[0], on_topic: true },
          { num: 1, dir: "D", clue_rich: `From source: ${topicWords[1]}`, clue_classic: topicWords[1], on_topic: true },
        ],
        stats: {
          wordCount: 2,
          blockCount: 50,
          fillTime: 0.1,
          topicRatio: 1,
          onTopicWords: 2,
        },
      },
    });
  } catch (error) {
    console.error("[generate-classic]", error.message);
    return res.status(500).json({ error: error.message });
  }
}
