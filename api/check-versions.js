export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { bookRef, grade } = req.body || {};
  if (!bookRef || bookRef.trim().length < 3) {
    return res.status(400).json({ error: "Missing book reference" });
  }

  const GRADE_LABELS = {
    k:"Kindergarten", "1":"1st grade", "2":"2nd grade", "3":"3rd grade",
    "4":"4th grade", "5":"5th grade", "6":"6th grade", "7":"7th grade",
    "8":"8th grade", "9-10":"9th–10th grade", "11-12":"11th–12th grade",
    "adult":"Adult / Reader Mode",
  };
  const gradeLabel = GRADE_LABELS[grade] || "3rd grade";

  const prompt = `You help teachers pick the right version of a book for a crossword puzzle generator.

Book reference entered: "${bookRef.trim()}"
Student grade level: ${gradeLabel}

TASK: Determine if this book/text exists in multiple SIGNIFICANTLY different versions, translations, or adaptations that would produce meaningfully different vocabulary and clues at this grade level.

Examples of TRUE version ambiguity (return needsSelection: true):
- "Bible" → KJV, NIV, ESV, Children's Bible, The Picture Bible, Beginner's Bible
- "Homer's Odyssey" → original Greek, Fagles translation, Rieu translation, children's retellings
- "Shakespeare" or any Shakespeare play → original, No Fear Shakespeare, Lamb's Tales, graphic novels
- "Cinderella" → Perrault, Grimm, Disney, picture books
- "Aesop's Fables" → many different retellings
- "Greek myths" → many versions at very different reading levels

Examples of FALSE ambiguity (return needsSelection: false):
- "Charlotte's Web Chapter 1" → one well-known version by E.B. White
- "Harry Potter and the Sorcerer's Stone" → one version (don't ask)
- "The Gettysburg Address" → one version
- "Genesis Chapter 1" → (still has versions — return true for Bible content)
- Any modern copyrighted book with one known author and edition → false
- Any specific chapter reference of a single-version book → false

If TRUE: list the most commonly used versions for ${gradeLabel}, ordered most to least popular at this grade. Maximum 6 options plus always include "Other" as the last option.

For gradeMatch, assess how well this version's reading level matches ${gradeLabel}:
- "excellent": perfect match
- "good": slightly above or below but workable
- "slight-mismatch": noticeably off, worth mentioning
- "significant-mismatch": very off, teacher should know

Return ONLY valid JSON, no explanation, no markdown:

If version selection IS needed:
{
  "needsSelection": true,
  "promptFor": "Which version of [BookName] are you using?",
  "versions": [
    {
      "id": "short-id-no-spaces",
      "name": "Full Version Name",
      "description": "One short sentence about this version",
      "popular": true,
      "gradeMatch": "excellent",
      "mismatchNote": "",
      "alternativeName": ""
    },
    {
      "id": "other",
      "name": "Other",
      "description": "Type the specific title of the version you are using",
      "popular": false,
      "gradeMatch": "unknown",
      "mismatchNote": "",
      "alternativeName": ""
    }
  ]
}

If version selection is NOT needed:
{"needsSelection": false}`;

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
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      // Fail silently — just skip version check and proceed to generate
      return res.status(200).json({ needsSelection: false });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text) return res.status(200).json({ needsSelection: false });

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); }
        catch { return res.status(200).json({ needsSelection: false }); }
      } else {
        return res.status(200).json({ needsSelection: false });
      }
    }

    // Validate structure
    if (typeof parsed.needsSelection !== "boolean") {
      return res.status(200).json({ needsSelection: false });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("check-versions error:", err);
    // Always fail silently — skip version check on any error
    return res.status(200).json({ needsSelection: false });
  }
}
