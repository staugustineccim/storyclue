const GRADE_DESCRIPTIONS = {
  k:   "kindergarten level — very simple, picture-clue style language, one short sentence",
  "1": "first grade level — short friendly sentences, simple words",
  "2": "second grade level — simple definitions a child can understand",
  "3": "third grade level — standard chapter-book level, default difficulty",
  "4": "fourth grade level — more context and detail in clues",
  "5": "fifth grade level — literary vocabulary, richer descriptions",
  "6": "sixth grade level — analytical language, concise definitions",
};

const SYSTEM_PROMPT = `You are a crossword puzzle creator specializing in educational content for children and adults.
Your job is to extract vocabulary from content and write grade-appropriate clues.
Return ONLY valid JSON — no markdown fences, no preamble, no explanation of any kind.
The JSON must be parseable by JSON.parse() with no preprocessing.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { inputMode, bookRef, chapterText, grade = "3", faith, seriesMode, selectedBooks, seriesName } = req.body || {};

  const gradeDesc = GRADE_DESCRIPTIONS[grade] || GRADE_DESCRIPTIONS["3"];

  let faithNote = "";
  if (faith && faith !== "none") {
    const faithLabels = { christian: "Christian", catholic: "Catholic", jewish: "Jewish" };
    faithNote = `\nFaith tradition: ${faithLabels[faith] || faith}. Write all clues with respect for this tradition. Use faith-appropriate language.`;
  }

  let seriesNote = "";
  if (seriesMode && selectedBooks?.length) {
    seriesNote = `\nSpoiler protection: This puzzle is from the "${seriesName}" series. The user has only read: ${selectedBooks.join(", ")}. Do NOT reference events, characters, or vocabulary from books they have NOT read.`;
  }

  let userPrompt;

  if (inputMode === "lookup") {
    // Book/chapter lookup mode — Claude uses its own knowledge
    if (!bookRef || bookRef.trim().length < 3) {
      return res.status(400).json({ error: "Please enter a book name or chapter reference." });
    }

    userPrompt = `Create a crossword puzzle vocabulary list from your knowledge of: "${bookRef}"

Grade level for clues: ${gradeDesc}${faithNote}${seriesNote}

Instructions:
- Use your knowledge of this text, chapter, or topic to identify 20 to 25 important vocabulary words
- Focus on words that are central to the content — characters, settings, key objects, themes, and important terms
- Each word must be ALL CAPS, letters only (A-Z), no spaces, no hyphens, no punctuation
- Word length must be between 3 and 13 letters
- Write every clue at ${gradeDesc}
- The title should specifically name the source (e.g. "Book of Jonah — Vocabulary Crossword")
- For Bible content, use King James Version language in clues
- Do NOT reproduce extended passages of text — only vocabulary words and short clues

Return this exact JSON structure with no other text:
{
  "title": "Specific title naming the source",
  "words": [
    { "word": "EXAMPLE", "clue": "The clue text here" }
  ]
}`;

  } else {
    // Paste mode — user provided their own text
    if (!chapterText || chapterText.trim().length < 50) {
      return res.status(400).json({ error: "Please provide more text — at least a paragraph." });
    }

    userPrompt = `Text to create puzzle from:
"""
${chapterText.slice(0, 6000)}
"""

Grade level for clues: ${gradeDesc}${faithNote}${seriesNote}

Instructions:
- Extract 20 to 25 vocabulary words from the text above
- Each word must be ALL CAPS, letters only (A-Z), no spaces, no hyphens, no punctuation
- Word length must be between 3 and 13 letters
- Write every clue at ${gradeDesc}
- The title should be a short, specific title for this puzzle

Return this exact JSON structure with no other text:
{
  "title": "Short specific title",
  "words": [
    { "word": "EXAMPLE", "clue": "The clue text here" }
  ]
}`;
  }

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
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", await response.text());
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
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return res.status(500).json({ error: "Could not generate puzzle. Please try again." });
    }

    if (!parsed.words || !Array.isArray(parsed.words) || parsed.words.length < 10) {
      return res.status(500).json({ error: "No vocabulary found. Try being more specific — for example: \"Book of Jonah Chapter 1\" or \"Charlotte's Web Chapter 3\"." });
    }

    // Sanitize words
    parsed.words = parsed.words
      .map(w => ({ ...w, word: String(w.word).toUpperCase().replace(/[^A-Z]/g, "") }))
      .filter(w => w.word.length >= 3 && w.word.length <= 13 && w.clue);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Could not generate puzzle. Please try again." });
  }
}
