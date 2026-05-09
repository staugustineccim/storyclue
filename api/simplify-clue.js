export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { word, clue } = req.body || {};
  if (!word || !clue) {
    return res.status(400).json({ error: "Missing word or clue" });
  }

  const prompt = `Rewrite this crossword clue to be simpler and more accessible for a younger student.

Word: ${word}
Current clue: ${clue}

Write a new clue that:
- Uses simpler, more everyday vocabulary
- Is shorter and more direct
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
