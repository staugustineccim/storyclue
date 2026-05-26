export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { word, clue, grade = "3" } = req.body || {};
  if (!word || !clue) {
    return res.status(400).json({ error: "Missing word or clue" });
  }

  const GRADE_VOICE = {
    k:       "a 5-year-old Kindergartner — one very short simple sentence, only words a child says out loud",
    "1":     "a 6-year-old 1st grader — short friendly sentence, simple everyday words",
    "2":     "a 7-year-old 2nd grader — simple sentence, no words above 2nd grade",
    "3":     "a 3rd grader — clear simple definition an 8-year-old would understand",
    "4":     "a 4th grader — everyday language a 9-year-old would understand",
    "5":     "a 5th grader — slightly richer vocabulary, still direct and clear",
    "6":     "a 6th grader — concise middle-school level language",
    "7":     "a 7th grader — clear but more sophisticated vocabulary",
    "8":     "an 8th grader — strong vocabulary, clue requires some inference",
    "9-10":  "a high school freshman or sophomore — academic vocabulary",
    "11-12": "a high school junior or senior — AP-level analytical language",
    "adult": "an adult reader — rich vocabulary, clues that reward a lifetime of reading",
  };
  const voice = GRADE_VOICE[String(grade)] || GRADE_VOICE["3"];

  const prompt = `Rewrite this crossword clue to be simpler and more accessible for ${voice}.

Word: ${word}
Current clue: ${clue}

Write a new clue that:
- Uses vocabulary appropriate for ${voice}
- Is shorter and more direct than the original
- Still accurately describes the word "${word}"
- Does NOT give away the answer word itself

Return ONLY the new clue text — no quotes, no explanation, nothing else.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 120,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Could not simplify clue" });
    }

    const data = await response.json();
    const simplerClue = data.content?.[0]?.text?.trim();

    if (!simplerClue) {
      return res.status(500).json({ error: "Could not simplify clue" });
    }

    return res.status(200).json({ clue: simplerClue });
  } catch (err) {
    console.error("simplify-clue error:", err);
    return res.status(500).json({ error: "Could not simplify clue" });
  }
}
