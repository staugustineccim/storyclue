import { kv } from "@vercel/kv";

// ── Grade descriptions for clue language ──────────────────────────────────────
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

// ── Grade-specific word count and length limits ────────────────────────────────
const GRADE_LIMITS = {
  k:       { wordCount: 8,  minLen: 3, maxLen: 5  },
  "1":     { wordCount: 10, minLen: 3, maxLen: 6  },
  "2":     { wordCount: 12, minLen: 3, maxLen: 7  },
  "3":     { wordCount: 15, minLen: 3, maxLen: 10 },
  "4":     { wordCount: 16, minLen: 3, maxLen: 11 },
  "5":     { wordCount: 18, minLen: 3, maxLen: 12 },
  "6":     { wordCount: 18, minLen: 3, maxLen: 13 },
  "7":     { wordCount: 20, minLen: 3, maxLen: 13 },
  "8":     { wordCount: 20, minLen: 3, maxLen: 13 },
  "9-10":  { wordCount: 22, minLen: 3, maxLen: 13 },
  "11-12": { wordCount: 25, minLen: 3, maxLen: 13 },
  "adult": { wordCount: 25, minLen: 3, maxLen: 13 },
};

const SYSTEM_PROMPT = `You are a crossword puzzle creator specializing in educational content for children and adults.
Your job is to extract vocabulary from content and write grade-appropriate clues.
Return ONLY valid JSON — no markdown fences, no preamble, no explanation of any kind.
The JSON must be parseable by JSON.parse() with no preprocessing.`;

// ── Content safety check ──────────────────────────────────────────────────────
// Intent-aware, context-aware. Never blocks based on surface-level dramatic keywords.
// Biblical narratives, faith stories, and historical content are pre-approved when
// the faith tradition is set. The filter asks ONE question: does this content
// glorify or instruct harmful behavior with no redemptive educational purpose?
async function checkContentSafety(inputText, grade, inputMode, faith) {
  const sample = String(inputText).slice(0, 700);

  // ── Faith-tradition fast-pass ─────────────────────────────────────────────
  // Standard Biblical/Torah/Quran narratives are unconditionally approved when
  // a faith tradition is selected. Fire, flood, death, battles, plagues —
  // all standard elements of sacred texts — must never be blocked.
  const faithTraditions = ["christian-protestant","christian-catholic","jewish","islamic","hindu","buddhist","other"];
  if (faith && faithTraditions.includes(faith) && faith !== "none") {
    // For named faith traditions, pre-approve all standard scriptural/religious
    // content. Grade-appropriate presentation is handled by the clue generator.
    return { safe: true };
  }

  // ── Hard-block pass — only unambiguously non-educational content ──────────
  // These patterns match content that has no plausible educational redemptive
  // purpose in ANY faith tradition or grade level.
  // Intentionally narrow: Biblical/historical violence, war, death, fire,
  // destruction, plagues, floods, imprisonment are NOT in this list.
  const HARD_BLOCKS = [
    // Sexual exploitation — no educational context
    /\b(pornography|pornographic|child\s+porn|onlyfans|explicit\s+sexual)\b/i,
    // Step-by-step self-harm instructions (not mentions of the topic, but instructions)
    /\b(how\s+to\s+(kill|cut|harm)\s+(yourself|myself)|step.by.step.*(suicide|self.harm))\b/i,
    // Actual drug synthesis instructions
    /\b(how\s+to\s+(make|cook|synthesize)\s+(meth|heroin|fentanyl|crack\s+cocaine))\b/i,
    // Terrorist recruitment/propaganda
    /\b(join\s+(isis|isil|al.?qaeda)|recruitment\s+video\s+for\s+terror)\b/i,
  ];
  for (const pattern of HARD_BLOCKS) {
    if (pattern.test(sample)) {
      await logBlock(sample, grade, "Hard-block: non-educational content");
      return { safe: false, reason: "hard-block" };
    }
  }

  // ── Claude intent-aware pass ───────────────────────────────────────────────
  // Evaluates PURPOSE and INTENT, not keywords. The question is not
  // "does this mention difficult topics" but "does this glorify harm."
  const gradeLabel = grade === "k" ? "Kindergarten" : grade === "adult" ? "Adult Reader" : `Grade ${grade}`;
  const safetyPrompt = `You are a content safety reviewer for an educational crossword puzzle app serving K-12 students and adult learners.

CRITICAL INSTRUCTION: Your job is to identify content that GLORIFIES or INSTRUCTS harmful behavior — not content that merely mentions difficult topics.

The following are ALWAYS appropriate regardless of dramatic content:
- All Biblical, Torah, and Quran narratives (Noah's flood, Jonah and the whale, the Exodus plagues, the Crucifixion, Daniel in the lion's den, David and Goliath, Samson, Job, Revelation imagery, etc.)
- All world history content including wars, the Holocaust, slavery, colonialism, genocide — when taught as history
- Classic literature with dark themes (Shakespeare, Greek tragedy, etc.)
- Natural disasters, medical conditions, death as a natural topic
- Faith traditions, religious ceremonies, prayer, sacraments of any religion
- Any content where difficult themes serve redemptive, educational, or moral purposes

ONLY respond {"safe":false} for content that:
- Explicitly glorifies sexual exploitation of minors
- Provides actual instructions for self-harm or suicide (not mentions — actual how-to instructions)
- Promotes terrorism or mass violence as admirable
- Has zero educational or redemptive purpose at any grade level

Grade context: ${gradeLabel}
Input: "${sample}"

Respond ONLY with valid JSON: {"safe":true} or {"safe":false,"reason":"one sentence"}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 80,
        messages: [{ role: "user", content: safetyPrompt }],
      }),
    });
    if (!r.ok) return { safe: true }; // Never block on API failure
    const d = await r.json();
    const txt = d.content?.[0]?.text?.trim() || "{}";
    const result = JSON.parse(txt.match(/\{[\s\S]*\}/)?.[0] || "{}");
    if (result.safe === false) {
      await logBlock(sample, grade, result.reason || "AI intent check");
      return { safe: false, reason: result.reason || "Content flagged" };
    }
  } catch { /* Never block on check failure */ }

  return { safe: true };
}

async function logBlock(input, grade, reason) {
  try {
    await kv.lpush("safety-blocks", JSON.stringify({
      input: input.slice(0, 200),
      grade,
      reason,
      ts: new Date().toISOString(),
    }));
  } catch { /* KV may not be available */ }
}

// ── YouTube transcript extraction ─────────────────────────────────────────────
function extractVideoId(url) {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

async function getYouTubeTranscript(videoId) {
  let videoTitle = "";
  let videoDescription = "";

  // Get basic metadata via oEmbed (fast, no key needed)
  try {
    const oe = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (oe.ok) {
      const d = await oe.json();
      videoTitle = d.title || "";
    }
  } catch {}

  // Fetch YouTube watch page and parse captions
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!pageRes.ok) throw new Error(`YouTube page ${pageRes.status}`);
    const html = await pageRes.text();

    // Extract ytInitialPlayerResponse by brace-matching
    const marker = "ytInitialPlayerResponse=";
    const si = html.indexOf(marker);
    if (si === -1) throw new Error("No player response");
    const jsonStart = html.indexOf("{", si);
    let depth = 0, jsonEnd = jsonStart;
    for (let i = jsonStart; i < Math.min(html.length, jsonStart + 800000); i++) {
      if (html[i] === "{") depth++;
      else if (html[i] === "}") {
        if (--depth === 0) { jsonEnd = i + 1; break; }
      }
    }
    const pr = JSON.parse(html.slice(jsonStart, jsonEnd));
    videoTitle = videoTitle || pr?.videoDetails?.title || "";
    videoDescription = pr?.videoDetails?.shortDescription || "";

    const tracks = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks?.length) {
      return videoTitle
        ? `Video Title: ${videoTitle}\n\n${videoDescription}`
        : null;
    }

    // Prefer English captions; fall back to first track
    const track =
      tracks.find(t => t.languageCode?.startsWith("en")) || tracks[0];

    // Try JSON3 format first (cleaner text)
    const captRes = await fetch(`${track.baseUrl}&fmt=json3`, {
      signal: AbortSignal.timeout(5000),
    });
    if (captRes.ok) {
      const capJson = await captRes.json();
      const transcript = capJson.events
        ?.filter(e => e.segs)
        ?.flatMap(e => e.segs)
        ?.map(s => s.utf8)
        ?.filter(t => t && t !== "\n")
        ?.join(" ")
        ?.replace(/\s+/g, " ")
        ?.trim();
      if (transcript?.length > 100) {
        return videoTitle ? `${videoTitle}\n\n${transcript}` : transcript;
      }
    }

    // Fall back to XML format
    const xmlRes = await fetch(track.baseUrl, { signal: AbortSignal.timeout(5000) });
    const xml = await xmlRes.text();
    const transcript = xml
      .match(/<text[^>]*>([\s\S]*?)<\/text>/g)
      ?.map(t =>
        t
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
      )
      ?.join(" ")
      ?.trim();

    if (transcript?.length > 100) {
      return videoTitle ? `${videoTitle}\n\n${transcript}` : transcript;
    }
  } catch { /* fall through to description fallback */ }

  if (videoTitle || videoDescription) {
    return `Video: ${videoTitle}\n\n${videoDescription}`;
  }
  return null;
}

// ── Vimeo transcript helper ────────────────────────────────────────────────────
async function getVimeoText(url) {
  try {
    const oe = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (oe.ok) {
      const d = await oe.json();
      return d.title ? `${d.title}\n\n${d.description || ""}` : null;
    }
  } catch {}
  return null;
}

// ── Prompt word-count instruction by grade ────────────────────────────────────
function wordCountInstruction(grade, limits) {
  if (grade === "k") {
    return `exactly ${limits.wordCount} visual, concrete, story-important words. Each word MUST be between ${limits.minLen} and ${limits.maxLen} letters — absolutely no longer words for Kindergarten`;
  }
  if (["1","2"].includes(grade)) {
    return `exactly ${limits.wordCount} important story words (${limits.minLen}–${limits.maxLen} letters each)`;
  }
  return `${limits.wordCount} to ${Math.min(limits.wordCount + 3, 25)} important vocabulary words`;
}

// ── Main handler ───────────────────────────────────────────────────────────────
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

  const limits   = GRADE_LIMITS[grade]  || GRADE_LIMITS["3"];
  const gradeDesc = GRADE_DESCRIPTIONS[grade] || GRADE_DESCRIPTIONS["3"];
  const wci      = wordCountInstruction(grade, limits);

  // ── Faith guidance ─────────────────────────────────────────────────────────
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
    const guidance = faithGuidance[faith] || "faith-inclusive tradition. Write all clues in modern plain everyday English.";
    faithNote = `\nFaith tradition: ${guidance} All faith-based content must be culturally respectful. NEVER use archaic or scripture-specific language — always use modern everyday English.`;
  }

  // ── Series + spoiler protection ────────────────────────────────────────────
  let seriesNote = "";
  if (seriesMode && selectedBooks?.length) {
    seriesNote = `\nSpoiler protection: This puzzle is from the "${seriesName}" series. The user has ONLY read these books: ${selectedBooks.join(", ")}.`;
    if (currentChapter && Number(currentChapter) > 0) {
      seriesNote += ` The user is currently on Chapter ${Number(currentChapter)} and has NOT read beyond it. Do NOT reference any events, character deaths, plot twists, new characters, or vocabulary introduced after Chapter ${Number(currentChapter)}.`;
    }
    seriesNote += ` This spoiler protection is critical — never reference anything from unread books or unread chapters.`;
  }

  // ── Phonics Mode — STORY-CONNECTED clues ──────────────────────────────────
  let phonicsNote = "";
  if (phonicsMode && ["k","1","2"].includes(String(grade))) {
    const storyRef = bookRef?.trim() || "this story";
    const pg = {
      k: `PHONICS CLUES — Kindergarten: Every clue MUST have TWO PARTS connected with a dash (—): (1) A story connection — one simple sentence naming a specific character, object, or event from "${storyRef}". (2) A phonics hint using beginning sounds, rhymes, or ending sounds. EXAMPLE FORMAT: "Jonah sailed away on this big boat — starts with the /sh/ sound". Use slashes around phoneme sounds: /fff/ /sss/ /sh/ /ch/ /th/. NEVER write a clue that doesn't reference the specific story. EVERY clue must name something from the story AND teach a sound.`,
      "1": `PHONICS CLUES — 1st Grade: Every clue MUST have TWO PARTS: (1) A story connection — one sentence naming a character, place, or event from "${storyRef}". (2) A phonics hint using ending sounds, blends, or rhymes. EXAMPLE FORMAT: "This is what Jonah did when God asked him to go to Nineveh — ends with the /n/ sound like fun". Include letter count when helpful.`,
      "2": `PHONICS CLUES — 2nd Grade: Every clue MUST have TWO PARTS: (1) A story connection — one sentence connecting to a specific moment in "${storyRef}". (2) A phonics/spelling pattern hint covering vowel sounds, digraphs, or word patterns. EXAMPLE FORMAT: "The enormous fish that swallowed Jonah — has the long /ā/ sound and follows the silent-e pattern". Include word length when helpful.`,
    };
    phonicsNote = `\n${pg[grade] || pg["2"]} CRITICAL: Zero generic phonics patterns allowed. Every single clue must connect to the specific story AND teach the relevant sound. Format every clue as: "[story connection] — [phonics hint]".`;
  }

  // ── Picture Mode ───────────────────────────────────────────────────────────
  let pictureNote = "";
  if (pictureMode && ["k","1","2"].includes(String(grade))) {
    pictureNote = `\nPICTURE MODE: For every word, also include an "emoji" field — a single emoji that clearly pictures the word (e.g. BARN→"🏚️", PIG→"🐷", SPIDER→"🕷️", FERN→"🌿", APPLE→"🍎"). Choose the most obvious emoji a 5-7 year old would instantly recognize. If no clear emoji exists, use "🔤". Update the JSON structure to: { "word": "EXAMPLE", "clue": "...", "emoji": "🔤" }`;
  }

  // ── Language / Spanish / Bilingual ────────────────────────────────────────
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

  // ── Resolve input text ─────────────────────────────────────────────────────
  let resolvedText = chapterText;
  let safetyInputLabel = "";

  if (inputMode === "url") {
    const url = (urlRef || "").trim();
    if (!url.startsWith("http")) {
      return res.status(400).json({ error: "Please enter a valid URL starting with http or https." });
    }

    safetyInputLabel = url;

    // ── YouTube URL ──────────────────────────────────────────────────────
    const videoId = extractVideoId(url);
    if (videoId) {
      const transcript = await getYouTubeTranscript(videoId);
      if (!transcript || transcript.trim().length < 50) {
        return res.status(400).json({
          error:
            "Could not extract content from this YouTube video. The video may be private, age-restricted, or have no captions available. Try copying the video description and using Paste Text instead.",
        });
      }
      resolvedText = transcript;

    // ── Vimeo URL ────────────────────────────────────────────────────────
    } else if (/vimeo\.com\/\d+/.test(url)) {
      const text = await getVimeoText(url);
      if (!text || text.trim().length < 50) {
        return res.status(400).json({
          error: "Could not extract content from this Vimeo video. Try pasting the video description directly.",
        });
      }
      resolvedText = text;

    // ── Regular URL ──────────────────────────────────────────────────────
    } else {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const pageRes = await fetch(url, {
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
        return res.status(400).json({
          error: "Some websites block outside access. Try copying and pasting the article text directly instead.",
        });
      }
      if (!resolvedText || resolvedText.trim().length < 50) {
        return res.status(400).json({
          error: "Some websites block outside access. Try copying and pasting the article text directly instead.",
        });
      }
    }
  }

  // ── Content safety check (runs on ALL input types) ────────────────────────
  const safetyInput =
    inputMode === "lookup"
      ? bookRef
      : inputMode === "url"
        ? safetyInputLabel
        : resolvedText?.slice(0, 600);

  if (safetyInput) {
    const safety = await checkContentSafety(safetyInput, grade, inputMode, faith);
    if (!safety.safe) {
      return res.status(400).json({
        error:
          "This content is not appropriate for educational use and cannot be used to generate a puzzle.",
      });
    }
  }

  // ── Build prompt ──────────────────────────────────────────────────────────
  let userPrompt;

  if (inputMode === "lookup") {
    if (!bookRef || bookRef.trim().length < 3) {
      return res.status(400).json({ error: "Please enter a book name or chapter reference." });
    }

    userPrompt = `Create a crossword puzzle vocabulary list from your knowledge of: "${bookRef}"

Grade level for clues: ${gradeDesc}${faithNote}${seriesNote}${languageNote}${phonicsNote}${pictureNote}

Instructions:
- Use your knowledge of this text, chapter, or topic to identify ${wci}
- Focus on words that are central to the content — characters, settings, key objects, themes, and important terms
- Each word must be ALL CAPS, letters only (A-Z), no spaces, no hyphens, no punctuation
- Word length must be between ${limits.minLen} and ${limits.maxLen} letters — STRICTLY ENFORCE THIS for the grade
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
- Extract ${wci} from the text above
- Each word must be ALL CAPS, letters only (A-Z), no spaces, no hyphens, no punctuation
- Word length must be between ${limits.minLen} and ${limits.maxLen} letters — STRICTLY ENFORCE THIS for the grade
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

  // ── Call Claude ────────────────────────────────────────────────────────────
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

    if (!parsed.words || !Array.isArray(parsed.words) || parsed.words.length < 3) {
      return res.status(500).json({
        error: "No vocabulary found. Try being more specific — for example: \"Book of Jonah Chapter 1\" or \"Charlotte's Web Chapter 3\".",
      });
    }

    // ── Sanitize and enforce grade limits ───────────────────────────────────
    parsed.words = parsed.words
      .map(w => ({ ...w, word: String(w.word).toUpperCase().replace(/[^A-Z]/g, "") }))
      .filter(w => w.word.length >= limits.minLen && w.word.length <= limits.maxLen && w.clue)
      .slice(0, limits.wordCount); // Hard cap at grade limit

    if (parsed.words.length < 3) {
      return res.status(500).json({
        error: "Not enough suitable vocabulary found for this grade level. Try a different chapter or paste the text directly.",
      });
    }

    parsed.language = langFlag;
    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Could not generate puzzle. Please try again." });
  }
}
