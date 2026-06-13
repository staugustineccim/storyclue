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

// TESTING: Minimal hardcoded endpoint

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
