// Sermon puzzle generation — Church Mode
// Detects pastor's own numbered/bulleted points first.
// Anchor words from those points are primary theme words.
// Clue language: 8th-9th grade. 15-20 words max.

const SYSTEM_PROMPT = `You are a crossword puzzle creator specializing in sermon recap puzzles for church congregations.
Your job is to read sermon content, identify the pastor's own key points, extract anchor vocabulary, and write 8th-grade clues that reference specific sermon content.
Return ONLY valid JSON — no markdown fences, no preamble, no explanation of any kind.
The JSON must be parseable by JSON.parse() with no preprocessing.`;

// Detect structured points from sermon text (numbered or bulleted)
function detectSermonPoints(text) {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const patterns = [
    /^(point\s*\d+|#\d+|\d+[\.\):])\s+(.+)/i,
    /^([•\-\*])\s+(.+)/,
    /^(first|second|third|fourth|fifth|sixth|seventh)[,:]?\s+(.+)/i,
  ];
  const points = [];
  for (const line of lines) {
    for (const pat of patterns) {
      const m = line.match(pat);
      if (m) {
        points.push(m[2] || m[0]);
        break;
      }
    }
  }
  return points.slice(0, 8);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    sermonText,       // raw sermon content
    sermonTitle,      // provided by pastor
    pastorName,
    churchName,
    manualPoints,     // array of confirmed points from screen 3
  } = req.body || {};

  if (!sermonText || sermonText.trim().length < 100) {
    return res.status(400).json({ error: "Please provide sermon content — notes, transcript, or text." });
  }

  // Use manual confirmed points if provided, else auto-detect
  const detectedPoints = manualPoints?.length
    ? manualPoints
    : detectSermonPoints(sermonText);

  const pointsContext = detectedPoints.length
    ? `\nThe pastor's own sermon points (HIGHEST PRIORITY — anchor words come from these):\n${detectedPoints.map((p, i) => `Point ${i + 1}: ${p}`).join("\n")}`
    : "";

  const userPrompt = `You are building a Sunday sermon recap crossword puzzle for a church congregation.

SERMON CONTENT:
"""
${sermonText.slice(0, 8000)}
"""

SERMON TITLE: ${sermonTitle || "Untitled Sermon"}
PASTOR: ${pastorName || "Pastor"}
CHURCH: ${churchName || ""}
${pointsContext}

YOUR TASK:

1. SERMON SUMMARY — Summarize the sermon following the pastor's EXACT point structure:
   - If the pastor had numbered/bulleted points, reproduce those EXACT point headings (do not reorganize)
   - Under each point: one anchor word in CAPS + one plain-English sentence summary
   - Extract scripture references if present
   - Extract any action items or application steps the pastor gave

2. CROSSWORD PUZZLE — Generate 15-20 words:
   - REQUIRED: One anchor word per detected pastor point (these are non-negotiable)
   - FILL: Additional vocabulary from the sermon to reach 15-20 total words
   - Difficulty: 8th-9th grade clue language — precise but accessible to a general adult congregation
   - Every clue MUST reference the specific sermon content, NOT generic definitions
   - Format: "[specific sermon reference] — [brief clarifying phrase]"
   - Example: "CONFORM — Pastor's Point 1: what the world pressures us to do, per Romans 12"
   - Words: ALL CAPS, letters A-Z only, 3-15 letters

3. SNEAK PEEK — For each word, identify the sermon passage (sentence or phrase) most relevant to that word so the congregation can find the answer in the sermon text.

Return this EXACT JSON structure (no other text):
{
  "title": "${sermonTitle || "Sermon Recap"}",
  "pastorName": "${pastorName || ""}",
  "churchName": "${churchName || ""}",
  "summary": {
    "points": [
      {
        "number": 1,
        "heading": "EXACT point heading from sermon",
        "anchorWord": "SINGLEWORD",
        "summary": "One plain-English sentence describing this point."
      }
    ],
    "scriptures": ["Romans 12:2", "..."],
    "actionItems": ["Do X", "..."]
  },
  "words": [
    {
      "word": "CONFORM",
      "clue": "Pastor's Point 1: what the world pressures us to do — Romans 12",
      "sneakPeek": "The exact sentence or phrase from the sermon that contains or directly relates to this word",
      "isAnchor": true,
      "pointNumber": 1
    }
  ]
}`;

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
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", await response.text());
      return res.status(500).json({ error: "Could not generate sermon puzzle. Please try again." });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text) return res.status(500).json({ error: "No response from AI. Please try again." });

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return res.status(500).json({ error: "Could not parse sermon puzzle. Please try again." });
    }

    // Sanitize words
    if (parsed.words) {
      parsed.words = parsed.words
        .map(w => ({ ...w, word: String(w.word).toUpperCase().replace(/[^A-Z]/g, "") }))
        .filter(w => w.word.length >= 3 && w.word.length <= 15 && w.clue)
        .slice(0, 20);
    }

    // Include detected points for screen 3 confirmation
    parsed.detectedPoints = detectedPoints;

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("generate-sermon error:", err);
    return res.status(500).json({ error: "Could not generate sermon puzzle. Please try again." });
  }
}
