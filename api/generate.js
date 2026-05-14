const GRADE_DESCRIPTIONS = {
  k:       "kindergarten level — use only the simplest everyday words a 5-year-old would say out loud. One very short sentence. No complex words.",
  "1":     "first grade level — use short friendly sentences and only simple everyday words a 6-year-old would know. Keep it fun and concrete.",
  "2":     "second grade level — use simple everyday words and short sentences a 7-year-old would understand. No vocabulary above 2nd grade.",
  "3":     "third grade level — clear simple definitions using words an 8-year-old would know. Standard chapter-book vocabulary.",
  "4":     "fourth grade level — use everyday language a 9-year-old would understand. A bit more detail but still simple and direct.",
  "5":     "fifth grade level — slightly richer vocabulary, short descriptive sentences a 10-year-old would appreciate.",
  "6":     "sixth grade level — analytical language, concise definitions appropriate for middle school.",
  "7":     "seventh grade level — sophisticated vocabulary, nuanced clues with context for 7th graders.",
  "8":     "eighth grade level — complex vocabulary, clues that require inference, appropriate for 8th graders.",
  "9-10":  "high school freshman/sophomore level — academic vocabulary, precise literary definitions.",
  "11-12": "high school junior/senior level — advanced vocabulary, AP/college-prep analytical clues.",
  "adult": "adult reader and senior level — rich elegant vocabulary, no grade constraints, clues that reward a lifetime of reading.",
};

const SYSTEM_PROMPT = `You are a crossword puzzle creator specializing in educational content for children and adults.
Your job is to extract vocabulary from content and write grade-appropriate clues.
Return ONLY valid JSON — no markdown fences, no preamble, no explanation of any kind.
The JSON must be parseable by JSON.parse() with no preprocessing.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    inputMode, bookRef, chapterText, urlRef,
    grade = "3", faith, language = "english", bilingualMode,
    seriesMode, selectedBooks, seriesName, currentChapter,
    phonicsMode = false, pictureMode = false,
  } = req.body || {};

  const gradeDesc = GRADE_DESCRIPTIONS[grade] || GRADE_DESCRIPTIONS["3"];

  // ── Faith guidance ──────────────────────────────────────────────────────
  let faithNote = "";
  if (faith && faith !== "none") {
    const faithGuidance = {
      "christian-protestant": "Christian (Protestant) tradition. Write all clues in modern plain English that any Protestant family would understand. Do NOT use King James Version or archaic scripture language. Reference Bible stories, characters, and vocabulary in everyday contemporary language.",
      "christian-catholic":   "Christian (Catholic) tradition. Write all clues in modern plain English appropriate for Catholic families. Do NOT use archaic scripture language. You may reference sacraments, saints, and Catholic vocabulary naturally in everyday language.",
      "jewish":               "Jewish tradition. Write all clues in modern plain English. Reference Torah stories, Hebrew terms (with plain English context), Jewish holidays, and Jewish vocabulary naturally. Do NOT use Christian scripture language.",
      "islamic":              "Islamic tradition. Write all clues in modern plain English respectful of Islamic faith. Reference Quran vocabulary, Islamic stories, Arabic terms (with plain English context), and Islamic concepts naturally.",
      "hindu":                "Hindu tradition. Write all clues in modern plain English respectful of Hindu faith. Reference Sanskrit terms (with plain English context), Hindu stories, deities, and concepts naturally.",
      "buddhist":             "Buddhist tradition. Write all clues in modern plain English respectful of Buddhist faith. Reference Buddhist concepts, Pali or Sanskrit terms (with plain English context), and Buddhist stories naturally.",
      "other":                "faith-inclusive tradition. Write all clues in modern plain English that is respectful and culturally sensitive.",
    };
    const guidance = faithGuidance[faith] || "faith-inclusive tradition. Write all clues in modern plain English.";
    faithNote = `\nFaith tradition: ${guidance} All faith-based content must be culturally respectful. NEVER use archaic or scripture-specific language — always use modern everyday English.`;
  }

  // ── Series + chapter-level spoiler protection ───────────────────────────
  let seriesNote = "";
  if (seriesMode && selectedBooks?.length) {
    seriesNote = `\nSpoiler protection: This puzzle is from the "${seriesName}" series. The user has ONLY read these books: ${selectedBooks.join(", ")}.`;
    if (currentChapter && Number(currentChapter) > 0) {
      seriesNote += ` The user is currently on Chapter ${Number(currentChapter)} and has NOT read beyond it. Do NOT reference any events, character deaths, plot twists, new characters, or vocabulary introduced after Chapter ${Number(currentChapter)}.`;
    }
    seriesNote += ` This spoiler protection is critical — never reference anything from unread books or unread chapters.`;
  }

  // ── Phonics Mode (K-2 only) ─────────────────────────────────────────────
  let phonicsNote = "";
  if (phonicsMode && ["k","1","2"].includes(String(grade))) {
    const pg = {
      k:   "PHONICS CLUES — Kindergarten: Write ALL clues as beginning sounds or rhymes ONLY. Examples: 'Starts with the /fff/ sound', 'Rhymes with PIG', 'Begins like the word FARM'. Use slashes around sounds like /fff/ /sss/ /mmm/. Do NOT use definitions.",
      "1": "PHONICS CLUES — 1st Grade: Write ALL clues using beginning sounds, ending sounds, and simple blends. Examples: 'Starts with the /wuh/ sound and has 6 letters', 'Ends with the /nt/ sound like hunt', 'Starts with the blend /sp/'. Include letter count when helpful.",
      "2": "PHONICS CLUES — 2nd Grade: Write ALL clues using vowel sounds, digraphs, and word patterns. Examples: 'Has the long /ēē/ sound in the middle', 'Contains the /ch/ digraph', 'Follows the silent-e pattern like CAKE'. Include letter count when helpful.",
    };
    phonicsNote = `\n${pg[grade] || pg["2"]} Every single clue must be a phonics/sound hint — absolutely no definition-based clues.`;
  }

  // ── Picture Mode (K-2 only) ──────────────────────────────────────────────
  let pictureNote = "";
  if (pictureMode && ["k","1","2"].includes(String(grade))) {
    pictureNote = `\nPICTURE MODE: For every word, also include an "emoji" field — a single emoji that clearly pictures the word (e.g. BARN→"🏚️", PIG→"🐷", SPIDER→"🕷️", FERN→"🌿", APPLE→"🍎"). Choose the most obvious emoji a 5-7 year old would instantly recognize. If no clear emoji exists, use "🔤". Update the JSON structure to: { "word": "EXAMPLE", "clue": "...", "emoji": "🔤" }`;
  }

  // ── Language / Spanish / Bilingual ──────────────────────────────────────
  let languageNote = "";
  let langFlag = "english";
  if (language === "spanish" && !bilingualMode) {
    langFlag = "spanish";
    languageNote = `\nLanguage: Generate ALL vocabulary WORDS and CLUES entirely in Spanish. Answer words must be Spanish words in ALL CAPS using only the letters A-Z (no accents, tildes, or special characters — use plain ASCII: N for Ñ, etc.). Clues must be in Spanish at the appropriate grade level. After generating, run a secondary validation pass: confirm each Spanish word is correctly spelled, grammatically appropriate for the grade level, and each clue accurately describes its answer word in Spanish. Fix any errors before returning.`;
  } else if (bilingualMode === "en-clue-es-word") {
    langFlag = "bilingual-en-clue-es-word";
    languageNote = `\nBilingual Mode (English clues / Spanish answers): Write all CLUES in English, but the ANSWER WORDS must be their Spanish equivalents in ALL CAPS (A-Z only, no accents). For example, clue "A friendly spider" → answer ARANA (for araña). Each English clue describes what the Spanish word means.`;
  } else if (bilingualMode === "es-clue-en-word") {
    langFlag = "bilingual-es-clue-en-word";
    languageNote = `\nBilingual Mode (Spanish clues / English answers): Write all CLUES in Spanish, but the ANSWER WORDS must be English (ALL CAPS, A-Z only). Each Spanish clue describes the English answer word.`;
  }

  // ── URL mode: fetch and extract text ────────────────────────────────────
  let resolvedText = chapterText;
  if (inputMode === "url") {
    if (!urlRef || !urlRef.trim().startsWith("http")) {
      return res.status(400).json({ error: "Please enter a valid URL starting with http or https." });
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const pageRes = await fetch(urlRef.trim(), {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; StoryClue/1.0; +https://storyclue.ai)" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`);
      const html = await pageRes.text();
      resolvedText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#\d+;/g, " ")
        .replace(/&[a-z0-9]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    } catch {
      return res.status(400).json({ error: "Some websites block outside access. Try copying and pasting the article text directly instead." });
    }
    if (!resolvedText || resolvedText.trim().length < 50) {
      return res.status(400).json({ error: "Some websites block outside access. Try copying and pasting the article text directly instead." });
    }
  }

  // ── Build prompt ─────────────────────────────────────────────────────────
  let userPrompt;

  if (inputMode === "lookup") {
    if (!bookRef || bookRef.trim().length < 3) {
      return res.status(400).json({ error: "Please enter a book name or chapter reference." });
    }

    userPrompt = `Create a crossword puzzle vocabulary list from your knowledge of: "${bookRef}"

Grade level for clues: ${gradeDesc}${faithNote}${seriesNote}${languageNote}${phonicsNote}${pictureNote}

Instructions:
- Use your knowledge of this text, chapter, or topic to identify 20 to 25 important vocabulary words
- Focus on words that are central to the content — characters, settings, key objects, themes, and important terms
- Each word must be ALL CAPS, letters only (A-Z), no spaces, no hyphens, no punctuation
- Word length must be between 3 and 13 letters
- Write every clue at ${gradeDesc}
- Write ALL clues in modern plain everyday English — never use archaic, scriptural, or overly formal language
- The title should specifically name the source (e.g. "Book of Jonah — Vocabulary Crossword")
- Do NOT reproduce extended passages of text — only vocabulary words and short clues

VALIDATION STEP — before returning, review every word-clue pair:
- Each clue must specifically and accurately describe its exact answer word
- A clue for SHEPHERD must describe a shepherd, not a king or a fish
- A clue for ARK must describe an ark, not a whale
- If any clue does not match its word, fix it before returning

Return this exact JSON structure with no other text:
{
  "title": "Specific title naming the source",
  "words": [
    { "word": "EXAMPLE", "clue": "The clue text here" }
  ]
}`;

  } else {
    // paste or url (url text was resolved above)
    if (!resolvedText || resolvedText.trim().length < 50) {
      return res.status(400).json({ error: "Please provide more text — at least a paragraph." });
    }

    userPrompt = `Text to create puzzle from:
"""
${resolvedText.slice(0, 6000)}
"""

Grade level for clues: ${gradeDesc}${faithNote}${seriesNote}${languageNote}${phonicsNote}${pictureNote}

Instructions:
- Extract 20 to 25 vocabulary words from the text above
- Each word must be ALL CAPS, letters only (A-Z), no spaces, no hyphens, no punctuation
- Word length must be between 3 and 13 letters
- Write every clue at ${gradeDesc}
- Write ALL clues in modern plain everyday English — never use archaic, scriptural, or overly formal language
- The title should be a short, specific title for this puzzle

VALIDATION STEP — before returning, review every word-clue pair:
- Each clue must specifically and accurately describe its exact answer word
- If any clue does not match its word, fix it before returning

Return this exact JSON structure with no other text:
{
  "title": "Short specific title",
  "words": [
    { "word": "EXAMPLE", "clue": "The clue text here" }
  ]
}`;
  }

  // ── Call Claude ──────────────────────────────────────────────────────────
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

    // Pass language flag through so the puzzle player can show disclaimer
    parsed.language = langFlag;

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Could not generate puzzle. Please try again." });
  }
}
