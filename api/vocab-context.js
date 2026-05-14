const GRADE_DESC = {
  k:       "kindergarten — very short sentences (5-7 words max) with only the simplest everyday words a 5-year-old knows",
  "1":     "first grade — short simple sentences a 6-year-old would understand",
  "2":     "second grade — clear simple sentences a 7-year-old would enjoy",
  "3":     "third grade — clear sentences an 8-year-old would understand",
  "4":     "fourth grade — sentences a 9-year-old would understand",
  "5":     "fifth grade — slightly richer sentences for a 10-year-old",
  "6":     "sixth grade — middle school level sentences",
  "7":     "seventh grade level",
  "8":     "eighth grade level",
  "9-10":  "high school freshman/sophomore level",
  "11-12": "high school junior/senior level",
  "adult": "adult reader level — rich and engaging sentences",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { words, title, grade } = req.body || {};
  if (!words?.length) return res.status(400).json({ error: "No words provided" });

  const gradeDesc = GRADE_DESC[grade] || GRADE_DESC["3"];
  const wordList  = words
    .map(w => (w.answer || w.word || "").toUpperCase())
    .filter(Boolean)
    .join(", ");

  const prompt = `For the crossword puzzle titled "${title || "Vocabulary Crossword"}", write one short sentence for each vocabulary word that shows the word used naturally in context. Write the vocabulary word IN ALL CAPS inside the sentence so it stands out clearly.

Grade level: ${gradeDesc}

Words: ${wordList}

Rules:
- Each sentence must contain the word written IN ALL CAPS exactly as listed
- Keep each sentence short and meaningful for the grade level
- Show the word in action or context — not just "WORD is a type of..."
- Draw from the story/text context when possible to reinforce meaning

Return ONLY this exact JSON with no other text:
{
  "sentences": [
    { "word": "EXAMPLE", "sentence": "The teacher put a clear EXAMPLE on the board so everyone could understand." }
  ]
}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":           process.env.ANTHROPIC_API_KEY,
        "anthropic-version":   "2023-06-01",
        "content-type":        "application/json",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 2048,
        messages:   [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) return res.status(500).json({ error: "Could not generate context sentences." });

    const data = await r.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text) return res.status(500).json({ error: "Could not generate context sentences." });

    let parsed;
    try { parsed = JSON.parse(text); }
    catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else return res.status(500).json({ error: "Could not generate context sentences." });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("vocab-context error:", err);
    return res.status(500).json({ error: "Could not generate context sentences." });
  }
}
