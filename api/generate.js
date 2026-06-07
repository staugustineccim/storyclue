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

const SYSTEM_PROMPT = `You are a crossword puzzle creator specializing in educational content for children and adults, serving traditional American families, homeschool parents, Sunday school teachers, and classroom educators.
Your job is to extract vocabulary from content and write grade-appropriate clues.
Write from a traditional American educational perspective — patriotic, faith-respectful, factual, and appropriate for conservative families.
Do NOT inject progressive social framing, DEI language, gender ideology, or political commentary of any kind into clues.
Write about people, places, and events as they are historically and factually understood.
SECULAR MODE RULE: When the user prompt contains "SECULAR MODE — HARD CONSTRAINT", every single clue in your response MUST be completely secular — zero religious references, zero Biblical language, zero theological terms, zero mentions of God, faith, prayer, or any religious figure, even if the source content contains religious language. This is an absolute rule with no exceptions.
SPANISH LANGUAGE RULE: When the user prompt specifies Spanish or Bilingual mode, every single clue (or every single answer word, depending on the mode) MUST be in Spanish with zero English fallback under any circumstances. If you cannot produce a Spanish clue for a word, rewrite the clue differently in Spanish — never output English when Spanish is required.
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
    // Sexual orientation / gender ideology as a puzzle topic (not as incidental biographical fact in history)
    /\b(gender\s+identity\s+lesson|sexual\s+orientation\s+(lesson|curriculum|unit|activity|crossword|puzzle)|trans(gender)?\s+(identity\s+)?for\s+kids|drag\s+queen\s+story|queer\s+theory\s+for|lgbtq\s+curriculum|gender\s+affirm\s+for\s+(kids|children|students))\b/i,
    // DEI / CRT training materials (ideology-first content, not historical civil rights facts)
    /\b(critical\s+race\s+theory\s+(curriculum|lesson|unit|worksheet)|dei\s+training\s+(for\s+kids|curriculum|worksheet)|white\s+privilege\s+(lesson|curriculum|for\s+kids)|systemic\s+racism\s+(lesson\s+plan|curriculum\s+for)|anti-racist\s+curriculum\s+for\s+(kids|children|elementary|primary))\b/i,
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
  const safetyPrompt = `You are a content safety reviewer for StoryClue.ai — a family-friendly educational crossword puzzle app rooted in traditional American values. It serves K-12 students, homeschool families, Sunday school teachers, and adult learners.

CRITICAL INSTRUCTION: Your job is to identify content that is inappropriate for children or that conflicts with traditional conservative family values. Do not block content merely because it mentions difficult topics — ask whether the PURPOSE is educational or harmful.

ALWAYS APPROVE — never block these regardless of dramatic content:
- All Biblical, Torah, and Quran narratives (Noah's flood, Jonah, the Exodus plagues, the Crucifixion, Daniel, David and Goliath, Samson, Job, Revelation, etc.)
- All world history including wars, the Holocaust, slavery, the Civil War — when taught as history
- Classic literature with dark themes (Shakespeare's tragedies, Greek tragedy, The Giver, Lord of the Flies, To Kill a Mockingbird, Romeo and Juliet, etc.) — the darkness in a recognized book is appropriate
- Violence, death, or suicide WHEN it appears in a recognized classic book, Bible narrative, or historical account
- Natural disasters, medical conditions, death as natural topics
- Faith traditions, religious ceremonies, prayer, sacraments of any recognized religion
- American history, the Constitution, the Founding Fathers, patriotic content
- Traditional family structures, marriage, and values

BLOCK — respond {"safe":false} for:
- Sexually explicit content of any kind
- Sexual orientation or gender identity presented as a lesson/curriculum topic for children (not incidental biographical facts about historical figures)
- Gender ideology instruction for minors (e.g. "transgender identity for kids", "drag queen story hour", "gender spectrum for children")
- DEI/CRT ideology materials framed as curriculum (critical race theory lesson plans, white privilege worksheets, anti-racist curriculum for elementary students)
- Self-harm or suicide instructions — actual how-to content (NOT mentions in classic literature or historical context)
- Drug synthesis instructions
- Terrorist recruitment or propaganda
- Content that has zero educational or redemptive purpose at any grade level

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
  return `MAXIMUM ${limits.wordCount} important vocabulary words — strictly do not exceed this count`;
}

// ── Main handler ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};

  // ── Rate limiting — 20 puzzles per IP per hour ────────────────────────────
  // Uses Vercel KV. Fails open so a KV outage never breaks puzzle generation.
  // QA agent calls (_qaAgent flag) are exempt — they run from our own server.
  if (!body._qaAgent) {
    try {
      const ip = (req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown")
        .split(",")[0].trim();
      const hour = Math.floor(Date.now() / 3_600_000);
      const key  = `rl:gen:${ip}:${hour}`;
      const count = await kv.incr(key);
      if (count === 1) await kv.expire(key, 3600); // TTL = 1 hour from first request
      const LIMIT = 20;
      res.setHeader("X-RateLimit-Limit",     LIMIT);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, LIMIT - count));
      if (count > LIMIT) {
        return res.status(429).json({
          error: "You've generated a lot of puzzles this hour — please wait a few minutes and try again.",
          retryAfterSeconds: 3600 - (Date.now() % 3_600_000) / 1000 | 0,
        });
      }
    } catch { /* KV unavailable — fail open so puzzle generation always works */ }
  }

  const {
    inputMode, bookRef, chapterText, urlRef,
    grade = "3", faith, language = "english", bilingualMode,
    seriesMode, selectedBooks, seriesName, currentChapter,
    phonicsMode = false, pictureMode = false,
    songsMode = false,
    puzzleStyle = "topic",
    struggleWords = [], // spaced repetition: words the student needs to re-encounter
  } = body;

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
  } else {
    // ── HARD CONSTRAINT: Secular mode ─────────────────────────────────────
    // When no faith tradition is selected, every clue must be completely secular.
    // This is a non-negotiable constraint — not a suggestion.
    faithNote = `\nSECULAR MODE — HARD CONSTRAINT: The user has selected NO faith tradition. You MUST write every single clue in completely secular language. This means: zero religious references, zero Biblical references, zero faith language, zero theological terms, zero spiritual context, zero mentions of God, Scripture, prayer, or any religious figure — regardless of the source content or topic. Even if the source text has religious themes, write the clues using only historical, factual, literary, or educational language. Any clue containing faith or religious language when secular mode is active is an error.`;
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
      k: `
KINDERGARTEN PHONICS MODE — STORY-CONNECTED CLUES ONLY
Word count: MAXIMUM ${limits.wordCount} WORDS — absolutely do not exceed this number.
Every clue MUST follow this EXACT 2-part format using a dash: "[story moment] — [sound hint]"

✓ GOOD EXAMPLES for "Book of Jonah":
  SHIP → "Jonah ran away on this big boat — starts with the /sh/ sound"
  FISH → "The giant animal that swallowed Jonah — starts with the /fff/ sound"
  SEA  → "Jonah was thrown into this big water — starts with the /sss/ sound"
  RUN  → "What Jonah did when God called him — rhymes with sun and fun"

✗ BAD EXAMPLES — NEVER write clues like these:
  SHIP → "Starts with /sh/ like shop and shed" — WRONG: no story connection
  FISH → "Has 4 letters and ends in /sh/" — WRONG: no story connection
  RUN  → "Rhymes with sun, bun, fun" — WRONG: no story connection

Part 1 MUST name a specific character, object, or event from "${storyRef}".
Part 2 MUST teach a beginning sound, ending sound, or rhyme using slashes: /sh/ /fff/ /sss/ /ch/ /th/.`,

      "1": `
1ST GRADE PHONICS MODE — STORY-CONNECTED CLUES ONLY
Word count: MAXIMUM ${limits.wordCount} WORDS — absolutely do not exceed this number.
Every clue MUST follow this EXACT 2-part format using a dash: "[story moment] — [sound/pattern hint]"

✓ GOOD EXAMPLES for "Book of Jonah":
  RAN  → "What Jonah did when God told him to go to Nineveh — ends with the /an/ sound like can and fan"
  WAVE → "These crashed over the ship in the terrible storm — follows the silent-e spelling pattern"
  PRAY → "What the sailors did when the storm got too dangerous — has the /pr/ blend"

✗ BAD EXAMPLES — NEVER write clues like these:
  RAN  → "Ends with -an like can, fan, man, pan" — WRONG: no story connection
  WAVE → "Has 4 letters with silent e at the end" — WRONG: no story connection
  PRAY → "Starts with pr blend" — WRONG: no story connection

Part 1 MUST describe a specific moment, character, or place from "${storyRef}".
Part 2 MUST include ending sounds, blends, or rhymes.`,

      "2": `
2ND GRADE PHONICS MODE — STORY-CONNECTED CLUES ONLY
Word count: MAXIMUM ${limits.wordCount} WORDS — absolutely do not exceed this number.
Every clue MUST follow this EXACT 2-part format using a dash: "[story moment] — [spelling pattern hint]"

✓ GOOD EXAMPLES for "Book of Jonah":
  WHALE → "The enormous sea creature that swallowed Jonah whole — has the /wh/ digraph and silent-e pattern"
  PRAY  → "What Jonah did inside the fish for three days — has the /pr/ blend and long /ā/ vowel sound"
  STORM → "The terrible weather God sent to stop Jonah's ship — has the /st/ blend and /or/ vowel pattern"
  VINE  → "The plant God made grow over Jonah to give him shade — follows the silent-e spelling rule"

✗ BAD EXAMPLES — NEVER write clues like these:
  WHALE → "Has wh digraph and silent e at the end" — WRONG: no story connection
  PRAY  → "Has pr blend with long a vowel sound" — WRONG: no story connection
  STORM → "Has st blend and or vowel pattern" — WRONG: no story connection

Part 1 MUST connect to a specific event, character, or place from "${storyRef}".
Part 2 MUST cover vowel sounds, digraphs, blends, or spelling patterns.`,
    };
    phonicsNote = `\n\n${pg[grade] || pg["2"]}\n\nOVERRIDING RULE: Before returning, check EVERY clue. If any clue is only about sounds/patterns with no story reference, rewrite it. The story connection is NOT optional. Format every single clue as: "[story connection] — [phonics hint]".`;
  }

  // ── Picture Mode ───────────────────────────────────────────────────────────
  let pictureNote = "";
  if (pictureMode && ["k","1","2"].includes(String(grade))) {
    pictureNote = `\nPICTURE MODE: For every word, also include an "emoji" field — a single emoji that clearly pictures the word (e.g. BARN→"🏚️", PIG→"🐷", SPIDER→"🕷️", FERN→"🌿", APPLE→"🍎"). Choose the most obvious emoji a 5-7 year old would instantly recognize. If no clear emoji exists, use "🔤". Update the JSON structure to: { "word": "EXAMPLE", "clue": "...", "emoji": "🔤" }`;
  }

  // ── Songs & Rhymes mode ──────────────────────────────────────────────────
  let songsNote = "";
  if (songsMode && ["k","1","2"].includes(String(grade))) {
    // Override word length limit — songs use simple concrete words, max 6 letters
    limits.maxLen = Math.min(limits.maxLen, 6);
    const songTitle = bookRef?.trim() || "this song";
    songsNote = `
SONG CROSSWORD MODE — "${songTitle}":
This is a children's song crossword. EVERY clue MUST be a fill-in-the-blank lyric pulled directly from the actual words of "${songTitle}".

CLUE FORMAT — always use this exact pattern:
  "[lyric leading up to the blank word] ___"
  OR: "[lyric with blank in the middle] ___ [rest of line]"

EXAMPLES for "Twinkle Twinkle Little Star":
  STAR  → "Twinkle twinkle little ___"
  SKY   → "Up above the world so high, like a diamond in the ___"
  WORLD → "Up above the ___ so high"

EXAMPLES for "Itsy Bitsy Spider":
  SPIDER → "The itsy bitsy ___ climbed up the water spout"
  RAIN   → "Down came the ___ and washed the spider out"
  SUN    → "Out came the ___ and dried up all the rain"

WORD SELECTION RULES for songs:
1. Choose ONLY words that actually appear in the lyrics — concrete nouns and action verbs children recognize from singing
2. Maximum ${limits.maxLen} letters per word — choose short familiar words: STAR, BOAT, RAIN, LAMB, CLOCK, WHEEL, FARM, DUCK
3. Choose words a child will feel proud to know from singing the song — reward their existing knowledge
4. NEVER write a clue that doesn't come from the actual lyrics of this specific song
${phonicsMode ? `5. PHONICS + LYRIC: Each clue must ALSO include a phonics hint after the lyric fill-in. Format: "[lyric] ___ — [phonics hint]". Example: "Twinkle twinkle little ___ — rhymes with car and starts with /st/"` : ""}

The child should fill in the answer word because they already know it from singing the song.`;
  }

  // ── Language / Spanish / Bilingual ────────────────────────────────────────
  let languageNote = "";
  let langFlag = "english";
  if (language === "spanish" && !bilingualMode) {
    langFlag = "spanish";
    languageNote = `\nSPANISH MODE — HARD CONSTRAINT: Generate ALL vocabulary WORDS and CLUES entirely in Spanish. NEVER write even a single clue in English under any circumstances — if you struggle with a word, rewrite the clue differently in Spanish. Answer words must be Spanish words in ALL CAPS using only the letters A-Z (no accents, tildes, or special characters — use plain ASCII: N for Ñ, etc.). Clues must be in Spanish at the appropriate grade level. WORD COUNT: Return EXACTLY the number of words specified — do not add more words to compensate for any Spanish-mode adjustments. VALIDATION: Before returning, re-read every single clue. If ANY clue is in English, replace it with a Spanish clue immediately. Every clue in the JSON must be in Spanish — this is an absolute non-negotiable requirement.`;
  } else if (bilingualMode === "en-clue-es-word") {
    langFlag = "bilingual-en-clue-es-word";
    languageNote = `\nBILINGUAL MODE — HARD CONSTRAINT (English clues / Spanish answers): Write all CLUES in English, but the ANSWER WORDS must be their Spanish equivalents in ALL CAPS (A-Z only, no accents). For example, clue "A friendly spider" → answer ARANA (for araña). Each English clue describes what the Spanish word means. NEVER include an English answer word — every answer must be Spanish.`;
  } else if (bilingualMode === "es-clue-en-word") {
    langFlag = "bilingual-es-clue-en-word";
    languageNote = `\nBILINGUAL MODE — HARD CONSTRAINT (Spanish clues / English answers): Write all CLUES in Spanish, but the ANSWER WORDS must be English (ALL CAPS, A-Z only). NEVER write even a single clue in English — if you struggle with a word, rewrite the clue differently in Spanish. VALIDATION: Before returning, re-read every clue. If ANY clue is in English rather than Spanish, replace it immediately. Every clue must be in Spanish — no exceptions.`;
  }

  // ── Spaced repetition: build review note for struggle words ──────────────────
  // If the student has struggled with specific words before, ask Claude to include
  // them if they're relevant to the content, and to write a simpler clue for them.
  // We never force unrelated words into a puzzle — context relevance matters.
  let reviewNote = "";
  if (Array.isArray(struggleWords) && struggleWords.length > 0) {
    const GRADE_DESCRIPTIONS_SIMPLE = {
      k: "kindergarten (5-year-old vocabulary, one very short sentence)",
      "1": "first grade (simple everyday words, short sentence)",
      "2": "second grade (simple words a 7-year-old knows)",
      "3": "third grade (words an 8-year-old knows)",
      "4": "fourth grade (words a 9-year-old knows)",
      "5": "fifth grade (words a 10-year-old knows)",
      "6": "sixth grade (middle school vocabulary)",
      "7": "seventh grade (middle school analytical language)",
      "8": "eighth grade (complex vocabulary, inferential clues)",
      "9-10": "high school level (academic vocabulary)",
      "11-12": "advanced high school (AP/college-prep)",
      "adult": "adult reader level (rich vocabulary)",
    };
    const reviewList = struggleWords
      .map(w => {
        const clueDesc = GRADE_DESCRIPTIONS_SIMPLE[w.clueGrade] || GRADE_DESCRIPTIONS_SIMPLE[w.grade] || "simple";
        const statusNote = w.status === "struggling"
          ? "(student has needed help multiple times)"
          : "(student has seen this before but struggled)";
        return `  • ${w.word} — use a ${clueDesc} clue ${statusNote}`;
      })
      .join("\n");
    reviewNote = `\nVOCABULARY REVIEW (spaced repetition): This student has previously struggled with the following words. If ANY of them are relevant to the current content, INCLUDE them in the puzzle and write a SIMPLER clue than normal — the clue should help the student recognize the word in context, not just define it abstractly:\n${reviewList}\nIf a word is not relevant to this content, skip it — never force an unrelated word into the puzzle.`;
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
          "This topic isn't in StoryClue's content library. Try a book title, chapter, historical event, science topic, or any traditional school subject.",
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

Grade level for clues: ${gradeDesc}${faithNote}${seriesNote}${languageNote}${phonicsNote}${pictureNote}${songsNote}${reviewNote}

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

Grade level for clues: ${gradeDesc}${faithNote}${seriesNote}${languageNote}${phonicsNote}${pictureNote}${songsNote}${reviewNote}

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

    // ── Update 5: Classic Crossword — inject grade-appropriate filler words ──
    // Only for 6th grade and above when puzzleStyle = "classic".
    // NEVER inject English filler into Spanish or bilingual puzzles — filler
    // words have English clues which would break the language consistency.
    // Filler words have pre-defined clues and are NOT theme-connected.
    const CLASSIC_GRADES = ["6","7","8","9-10","11-12","adult"];
    const isNonEnglish = language === "spanish" || Boolean(bilingualMode);
    if (puzzleStyle === "classic" && CLASSIC_GRADES.includes(String(grade)) && !isNonEnglish) {
      function getFillerTier(g) {
        if (g === "adult") return "adult";
        if (["9-10","11-12"].includes(String(g))) return "high";
        return "middle";
      }
      const FILLER_WORDS = {
        middle: [
          { word:"AREA",  clue:"A region or section of space" },
          { word:"OPEN",  clue:"Not closed; available to enter" },
          { word:"IDEA",  clue:"A thought or plan in your mind" },
          { word:"EDGE",  clue:"The outer boundary of something" },
          { word:"EVEN",  clue:"Flat and level; also means fair" },
          { word:"IRON",  clue:"A strong metal; also smooths clothes" },
          { word:"ABLE",  clue:"Having the power or skill to do something" },
          { word:"ELSE",  clue:"In addition; other than what was mentioned" },
          { word:"OVER",  clue:"Above or finished; done" },
          { word:"ONLY",  clue:"Just one; nothing more" },
          { word:"MANY",  clue:"A large number of things or people" },
          { word:"GIVE",  clue:"To hand something to another person" },
          { word:"MOVE",  clue:"To go from one place to another" },
          { word:"WORK",  clue:"Effort put toward a task or job" },
          { word:"TURN",  clue:"To rotate or change direction" },
          { word:"ALSO",  clue:"In addition; too" },
          { word:"BOTH",  clue:"The two together; not just one" },
          { word:"EACH",  clue:"Every one of a group, considered individually" },
          { word:"FORM",  clue:"The shape or structure of something" },
          { word:"PART",  clue:"A piece or section of a larger whole" },
          { word:"PLAN",  clue:"A set of steps to achieve a goal" },
          { word:"ROLE",  clue:"The function a person or thing has" },
          { word:"SAME",  clue:"Identical; not different" },
          { word:"TAKE",  clue:"To get something in your hand or possession" },
          { word:"TERM",  clue:"A word with a specific meaning; also a time period" },
        ],
        high: [
          { word:"STORY", clue:"A narrative account of events" },
          { word:"PLACE", clue:"A particular location or position" },
          { word:"LIGHT", clue:"Illumination; the opposite of darkness" },
          { word:"POWER", clue:"The ability to act or influence events" },
          { word:"WORLD", clue:"The earth and all its people and places" },
          { word:"HUMAN", clue:"Relating to people; of or for mankind" },
          { word:"CIVIL", clue:"Relating to citizens or polite conduct" },
          { word:"MORAL", clue:"Concerned with right and wrong behavior" },
          { word:"LOGIC", clue:"Reasoning based on sound principles" },
          { word:"TRUTH", clue:"A statement that matches reality" },
          { word:"BRAVE", clue:"Showing courage in the face of danger" },
          { word:"NOBLE", clue:"Having high moral character; dignified" },
          { word:"VITAL", clue:"Absolutely necessary; essential" },
          { word:"CLEAR", clue:"Easy to understand; transparent" },
          { word:"BROAD", clue:"Wide in extent; covering many things" },
          { word:"ACUTE", clue:"Sharp and intense; showing keen insight" },
          { word:"CAUSE", clue:"The reason something happens" },
          { word:"FORCE", clue:"Strength or power applied to something" },
          { word:"IDEAL", clue:"A perfect standard or model to aim for" },
          { word:"MAJOR", clue:"Greater in size or importance" },
          { word:"PRIME", clue:"First in importance or quality" },
          { word:"PROSE", clue:"Written language in ordinary form, not verse" },
          { word:"SCOPE", clue:"The range or extent of something" },
          { word:"SOLID", clue:"Firm and stable; not hollow or liquid" },
          { word:"TRACE", clue:"A mark or sign left by something; to follow a path" },
        ],
        adult: [
          { word:"PROSE", clue:"Written language in ordinary form, not verse" },
          { word:"NOVEL", clue:"A book-length work of fiction" },
          { word:"VERSE", clue:"Writing arranged in rhythmic lines; poetry" },
          { word:"SCENE", clue:"A sequence of action in a play or story" },
          { word:"THEME", clue:"The central subject or message of a work" },
          { word:"VALOR", clue:"Great bravery in the face of danger" },
          { word:"GRACE", clue:"Elegance and ease of movement or manner" },
          { word:"IRONY", clue:"When words mean the opposite of what is said" },
          { word:"DRAMA", clue:"A play; also intense or exciting events" },
          { word:"HONOR", clue:"Great respect or high moral character" },
          { word:"SWIFT", clue:"Moving or happening very quickly" },
          { word:"POISE", clue:"Calm confidence in manner and bearing" },
          { word:"CRAFT", clue:"Skill and artistry in making something" },
          { word:"DEPTH", clue:"The quality of being deep or profound" },
          { word:"LUCID", clue:"Clear and easy to understand" },
          { word:"ACUTE", clue:"Sharp and precise; keenly perceptive" },
          { word:"EPOCH", clue:"A distinct period in history or development" },
          { word:"ETHOS", clue:"The characteristic spirit or values of a culture" },
          { word:"FLEET", clue:"A group of ships or vehicles; also swift" },
          { word:"FORGE", clue:"To shape metal with heat; to build something strong" },
          { word:"NEXUS", clue:"A central connection or link between things" },
          { word:"PIVOT", clue:"A central point around which things turn or change" },
          { word:"REALM", clue:"A kingdom; also any sphere of activity or thought" },
          { word:"TENOR", clue:"The general meaning or direction of something" },
          { word:"VIGIL", clue:"A period of watchful waiting; keeping watch" },
        ],
      };
      const tier = getFillerTier(grade);
      const pool = [...FILLER_WORDS[tier]];
      // Shuffle filler pool
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      // Avoid duplicating any theme word already in the puzzle
      const themeWords = new Set(parsed.words.map(w => w.word.toUpperCase()));
      const fillers = pool
        .filter(f => !themeWords.has(f.word))
        .slice(0, 20) // Add up to 20 filler words for denser grid coverage
        .map(f => ({ word: f.word, clue: f.clue, isFiller: true }));
      parsed.words = [...parsed.words, ...fillers];
    }

    parsed.language = langFlag;
    parsed.puzzleStyle = puzzleStyle;
    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Could not generate puzzle. Please try again." });
  }
}
