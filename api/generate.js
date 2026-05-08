const GRADE_DESCRIPTIONS = {
  k:  "kindergarten level — very simple, picture-clue style language, one short sentence",
  "1": "first grade level — short friendly sentences, simple words",
  "2": "second grade level — simple definitions a child can understand",
  "3": "third grade level — standard chapter-book level, default difficulty",
  "4": "fourth grade level — more context and detail in clues",
  "5": "fifth grade level — literary vocabulary, richer descriptions",
  "6": "sixth grade level — analytical language, concise definitions",
};

const SYSTEM_PROMPT = `You are a crossword puzzle creator specializing in educational content for children and adults.
Your job is to extract vocabulary from the provided text and write grade-appropriate clues.
Return ONLY valid JSON — no markdown fences, no preamble, no explanation of any kind.
The JSON must be parseable by JSON.parse() with no preprocessing.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { chapterText, grade = "3", seriesMode, selectedBooks, seriesName } = req.body || {};

  if (!chapterText || chapterText.trim().length < 50) {
    return res.status(400).json({ error: "Please provide more text — at least a paragraph." });
  }

  const gradeDesc = GRADE_DESCRIPTIONS[grade] || GRADE_DESCRIPTIONS["3"];

  let contextNote = "";
  if (seriesMode && selectedBooks?.length) {
    contextNote = `\nSeries context: This puzzle is from the "${seriesName}" series. The user has read: ${selectedBooks.join(", ")}. Do NOT reference events or vocabulary from books they have NOT read. Stay within the scope of the provided text only.`;
  }

  const userPrompt = `Text to create puzzle from:
"""
${chapterText.slice(0, 6000)}
"""

Grade level for clues: ${gradeDesc}${contextNote}

Instructions:
- Extract 20 to 25 vocabulary words from the text above
- Each word must be ALL CAPS, letters only (A-Z), no spaces, no hyphens, no punctuation
- Word length must be between 3 and 13 letters
- Write every clue at ${gradeDesc}
- For religious or faith-based content, clues must be respectful and faith-appropriate
- Do NOT include proper names longer than 13 letters
- The title should be a short, specific title for this puzzle (e.g., "Charlotte's Web — Chapter 1")

Return this exact JSON structure with no other text:
{
  "title": "Short specific title",
  "words": [
    { "word": "EXAMPLE", "clue": "The clue text here" }
  ]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return res.status(500).json({ error: "Could not generate puzzle. Please try again." });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();

    if (!text) {
      return res.status(500).json({ error: "Could not generate puzzle. Please try again." });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response if there's any surrounding text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return res.status(500).json({ error: "Could not generate puzzle. Please try again." });
      }
    }

    if (!parsed.words || !Array.isArray(parsed.words) || parsed.words.length < 10) {
      return res.status(500).json({ error: "No vocabulary found. Try pasting more chapter content." });
    }

    // Sanitize: ensure words are uppercase letters only, 3-13 chars
    parsed.words = parsed.words
      .map(w => ({ ...w, word: String(w.word).toUpperCase().replace(/[^A-Z]/g, "") }))
      .filter(w => w.word.length >= 3 && w.word.length <= 13 && w.clue);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Could not generate puzzle. Please try again." });
  }
}
