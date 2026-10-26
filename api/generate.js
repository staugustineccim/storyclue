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

// ── Book-existence gate (field test fix #3) ─────────────────────────────────
// Lookup mode used to send any typed title straight to the model, which
// happily invented vocabulary for books that do not exist (a nonsense title
// returned 15 confident words, 2026-10-25). Before a lookup generates, the
// reference must verify against something OUTSIDE the model:
//   1. the Bible canon (built-in list — the app's most common lookups), or
//   2. a short built-in list of famous documents/speeches, or
//   3. Open Library (openlibrary.org, free, no key) holding the title.
// The probe title is the reference with chapter/part qualifiers and the
// client-appended " — Version" suffix stripped. Verification FAILS CLOSED:
// if nothing verifies (including the library being unreachable), the caller
// refuses with an honest message instead of inventing a puzzle. Rejections
// are logged to KV ("unverified-books") so false rejections stay visible.
const BIBLE_BOOKS = new Set([
  "genesis","exodus","leviticus","numbers","deuteronomy","joshua","judges",
  "ruth","samuel","kings","chronicles","ezra","nehemiah","esther","job",
  "psalms","psalm","proverbs","ecclesiastes","song of solomon",
  "song of songs","canticles","isaiah","jeremiah","lamentations","ezekiel",
  "daniel","hosea","joel","amos","obadiah","jonah","micah","nahum","habakkuk",
  "zephaniah","haggai","zechariah","malachi","matthew","mark","luke","john",
  "acts","romans","corinthians","galatians","ephesians","philippians",
  "colossians","thessalonians","timothy","titus","philemon","hebrews",
  "james","peter","jude","revelation","revelations","apocalypse",
]);
const FAMOUS_TEXTS = new Set([
  "gettysburg address","declaration of independence","united states constitution",
  "us constitution","constitution of the united states","bill of rights",
  "i have a dream","emancipation proclamation","pledge of allegiance",
]);

function probeTitle(bookRef) {
  let t = String(bookRef || "").split(" — ")[0].split(" - ")[0].toLowerCase();
  // Apostrophes are REMOVED, not spaced: "charlotte's" must normalize to
  // "charlottes" — the original bug turned it into "charlotte s", whose
  // stray "s" token poisoned the Open Library search (production refused
  // "Charlotte's Web" on day one; caught by live verification 2026-10-26).
  t = t.replace(/['’]/g, "");
  t = t.replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  t = t.replace(/\b(chapter|ch|part|section|lesson|unit)\s+\d+\b/g, " ").replace(/\s+/g, " ").trim();
  t = t.replace(/^(the\s+)?(book\s+of|gospel\s+of|letter\s+of|epistle\s+of)\s+/, "").trim();
  t = t.replace(/^(first|second|third|1st|2nd|3rd|1|2|3)\s+/, "").trim();
  return t;
}

function isBibleRef(probe) {
  if (!probe) return false;
  if (probe === "bible" || probe === "holy bible" || probe === "old testament" || probe === "new testament") return true;
  const words = probe.split(" ");
  // Single-word canon names ("jonah"), or canon name leading ("jonah and the whale" style refs stay strict: first two words max)
  if (BIBLE_BOOKS.has(words[0])) return true;
  if (words.length > 1 && BIBLE_BOOKS.has(words.slice(0, 2).join(" "))) return true;
  return false;
}

async function verifyBookRef(bookRef) {
  const probe = probeTitle(bookRef);
  if (!probe) return { ok: false, via: null, probe };
  if (isBibleRef(probe)) return { ok: true, via: "bible-canon", probe };
  if (FAMOUS_TEXTS.has(probe)) return { ok: true, via: "famous-text", probe };
  // Search Open Library with the title as a human would type it
  // (original case and apostrophes — OL understands them natively);
  // the normalized probe is only for COMPARING the returned titles.
  const searchRef = String(bookRef || "").split(" — ")[0]
    .replace(/\b(chapter|ch|part|section|lesson|unit)\s+\d+\b/gi, " ")
    .replace(/\s+/g, " ").trim();
  try {
    const r = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(searchRef || probe)}&limit=10&fields=title`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (r.ok) {
      const d = await r.json();
      const hit = (d.docs || []).some(doc => {
        const dt = probeTitle(doc.title || "");
        return dt && (dt === probe || (probe.length >= 4 && (dt.includes(probe) || probe.includes(dt))));
      });
      if (hit) return { ok: true, via: "open-library", probe };
    }
  } catch { /* unreachable library → fail closed below */ }
  return { ok: false, via: null, probe };
}

async function logUnverified(bookRef) {
  try {
    await kv.lpush("unverified-books", JSON.stringify({
      input: String(bookRef).slice(0, 200), ts: new Date().toISOString(),
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

// Transcript resolution order (fixed 2026-10-26 — see field test):
//   1. Supadata (primary): fetches captions/transcribes on ITS infrastructure,
//      so it is not subject to the datacenter bot-wall that killed the old
//      scrape-first flow. Returns content synchronously when captions exist,
//      or a jobId when AI transcription is needed (client polls
//      /api/transcription-status, then re-submits AS TEXT).
//   2. Watch-page scrape (backup): works only when YouTube serves the real
//      page to a datacenter IP — increasingly rare.
// There is deliberately NO title+description fallback: building a puzzle from
// metadata while implying it came from the video was a silent lie. If no real
// transcript can be obtained, the caller returns an honest error instead.
async function getYouTubeTranscript(videoId) {
  let videoTitle = "";

  // Get the title via oEmbed (fast, no key needed)
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

  const withTitle = (t) => (videoTitle ? `${videoTitle}\n\n${t}` : t);

  // ── 1. Supadata (primary) ────────────────────────────────────────────────
  if (process.env.SUPADATA_API_KEY) {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const res = await fetch(
        `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(videoUrl)}`,
        {
          headers: { "x-api-key": process.env.SUPADATA_API_KEY },
          signal: AbortSignal.timeout(25000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        let transcript = null;
        if (typeof data.content === "string") transcript = data.content;
        else if (Array.isArray(data.content)) transcript = data.content.map(c => c.text || c).join(" ");
        else if (typeof data.transcript === "string") transcript = data.transcript;

        if (transcript?.trim().length > 100) {
          return { transcript: withTitle(transcript.trim()), jobId: null, service: "supadata" };
        }
        // No immediate transcript — Supadata is transcribing asynchronously.
        if (data.jobId) {
          return { transcript: null, jobId: data.jobId, service: "supadata" };
        }
      }
    } catch { /* fall through to the scrape backup */ }
  }

  // ── 2. Watch-page scrape (backup) ────────────────────────────────────────
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

    const tracks = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks?.length) throw new Error("No caption tracks");

    // Prefer uploader-provided (manual) captions over auto-generated (asr),
    // English within each class — the old code never looked at `kind`, so an
    // auto-translate track could be mistaken for the real thing.
    const isManual = (t) => t.kind !== "asr";
    const isEnglish = (t) => t.languageCode?.startsWith("en");
    const track =
      tracks.find(t => isManual(t) && isEnglish(t)) ||
      tracks.find(t => isEnglish(t)) ||
      tracks.find(t => isManual(t)) ||
      tracks[0];

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
        return { transcript: withTitle(transcript), jobId: null, service: "youtube-captions" };
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
      return { transcript: withTitle(transcript), jobId: null, service: "youtube-captions" };
    }
  } catch { /* fall through — no transcript obtainable */ }

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

// ── Thin-source measurement (field test fix #4) ─────────────────────────────
// Mr. Bob's standing rule (2026-10-25): short chapters have short word
// content. A narrow word list must produce the SMALLER puzzle it can sustain
// with the reason stated — never a silent stretch to full size, never a
// silent stop. This counts how many distinct puzzle-grade words a source
// text genuinely contains (right length band, not function words), so the
// handler can right-size the request and disclose it in the response.
const FUNCTION_WORDS = new Set([
  // English function words + ultra-common light verbs
  "the","a","an","and","or","but","if","then","else","when","while","of","at","by","for","with","about","into","through","after","over","before","between","out","against","during","without","upon","to","from","in","on","is","are","was","were","be","been","being","have","has","had","having","do","does","did","doing","would","should","could","ought","i","you","he","she","it","we","they","them","his","her","its","our","their","this","that","these","those","am","an","as","so","than","too","very","can","will","just","not","no","yes","all","any","each","per","via","went","goes","gone","said","says","say","got","get","gets","came","come","comes","saw","see","sees","took","take","takes","made","make","makes","knew","know","knows","one","two","also","more","much","many","such","only","own","same","now",
  // Spanish function words
  "el","la","los","las","un","una","unos","unas","de","del","en","y","o","que","es","son","fue","fueron","con","por","para","se","su","sus","al","lo","como","mas","pero","este","esta","estos","estas","ese","esa","mi","tu","nos","les","ya","muy","sin","sobre","tambien","cuando","donde","quien","estaba","estan","hay","era","eran","ser","estar",
]);

function countSupportedWords(text, limits) {
  const plain = String(text || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const seen = new Set();
  for (const m of plain.matchAll(/[a-z]+/g)) {
    const w = m[0];
    if (w.length >= limits.minLen && w.length <= limits.maxLen && !FUNCTION_WORDS.has(w)) {
      seen.add(w);
    }
  }
  return seen.size;
}

// ── Real validation pass (field test fix #5) ────────────────────────────────
// Both prompts used to instruct the model to "validate" its own output —
// the Spanish pass and the word-clue review were prompt text, never code.
// This is the code version: deterministic checks on every returned pair,
// ONE repair call naming the exact failures, a re-check, and any pair still
// failing is dropped rather than shipped. Outcomes are logged to KV
// ("validation-events") so the pass is observable, not decorative.
const EN_MARKERS = new Set(["the","and","is","are","you","your","with","this","that","from","what","when"]);
const ES_MARKERS = new Set(["el","la","los","las","de","que","en","una","con","por","para","del","es","su","al"]);

function clueLooksEnglish(clue) {
  const toks = String(clue).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().match(/[a-z]+/g) || [];
  const en = toks.filter(t => EN_MARKERS.has(t)).length;
  const es = toks.filter(t => ES_MARKERS.has(t)).length;
  return en >= 2 && es === 0;
}

function validatePuzzleWords(words, spanishAnswers) {
  const seenClues = new Set();
  const clean = [];
  const violations = [];
  for (const w of words) {
    const reasons = [];
    const clue = String(w.clue || "").trim();
    const cluePlain = clue.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    if (clue.length < 8) reasons.push("clue is too short to describe the word");
    if (w.word && cluePlain.includes(w.word)) reasons.push("clue contains the answer word");
    const clueKey = clue.toLowerCase();
    if (clue && seenClues.has(clueKey)) reasons.push("clue is a duplicate of another clue");
    seenClues.add(clueKey);
    if (spanishAnswers && clueLooksEnglish(clue)) reasons.push("clue is in English, but this puzzle's clues must be in Spanish");
    if (reasons.length) violations.push({ word: w.word, clue, reasons });
    else clean.push(w);
  }
  return { clean, violations };
}

async function repairWordPairs(violations, gradeDesc, spanishAnswers) {
  const list = violations
    .map(v => `- ${v.word}: clue "${v.clue}" — FAILED: ${v.reasons.join("; ")}`)
    .join("\n");
  const prompt = `You wrote crossword clues that failed validation. Rewrite ONLY the clues (keep the exact same answer words, same order) so every failure is fixed.

Rules: never use the answer word (or a form of it) inside its own clue; each clue must be unique, at least a short phrase, written for ${gradeDesc}${spanishAnswers ? ", and written in Spanish" : ""}.

Failed pairs:
${list}

Return ONLY this JSON, no other text:
{ "words": [ { "word": "WORD", "clue": "corrected clue" } ] }`;
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
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const text = d.content?.[0]?.text?.trim() || "";
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "null");
    if (!parsed?.words?.length) return null;
    const byWord = new Map();
    for (const w of parsed.words) {
      const word = String(w.word || "").toUpperCase().replace(/[^A-Z]/g, "");
      if (word && w.clue) byWord.set(word, String(w.clue));
    }
    return byWord;
  } catch { return null; }
}

async function logValidation(summary) {
  try {
    await kv.lpush("validation-events", JSON.stringify({ ...summary, ts: new Date().toISOString() }));
  } catch { /* KV may not be available */ }
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
    songsMode = false,
  } = req.body || {};

  // Per-request COPY (fix #4 drive-by): this used to be the shared
  // GRADE_LIMITS object itself, and the songs branch mutates maxLen — one
  // songs request permanently shrank the limit for that grade for every
  // later request in the same server process.
  const limits   = { ...(GRADE_LIMITS[grade] || GRADE_LIMITS["3"]) };
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

  // Language-to-name mapping for instructions
  const LANGUAGE_NAMES = {
    spanish: "Spanish",
    french: "French",
    german: "German",
    portuguese: "Portuguese",
    italian: "Italian",
    mandarin: "Mandarin Chinese",
    japanese: "Japanese",
    korean: "Korean",
  };

  // Handle bilingual modes for all languages
  const bilingualLanguageMatch = bilingualMode?.match(/^([a-z-]+)-clue-([a-z-]+)-word$/);
  if (bilingualLanguageMatch) {
    const [, clueLanguage, answerLanguage] = bilingualLanguageMatch;
    const clueLangName = LANGUAGE_NAMES[clueLanguage] || clueLanguage;
    const answerLangName = LANGUAGE_NAMES[answerLanguage] || answerLanguage;
    langFlag = bilingualMode;
    languageNote = `\nBilingual Mode (${clueLangName} clues / ${answerLangName} answers): Write all CLUES in ${clueLangName}, but the ANSWER WORDS must be their ${answerLangName} equivalents in ALL CAPS (A-Z only, no special characters or accents). Each clue in ${clueLangName} describes the answer word in ${answerLangName}.`;
  } else if (language === "spanish" && !bilingualMode) {
    langFlag = "spanish";
    languageNote = `\nLanguage: Spanish only. IMPORTANT — First translate the entire input text from English to Spanish. Then extract vocabulary and generate ALL WORDS and CLUES entirely in Spanish from the translated text. Answer words must be Spanish words in ALL CAPS using only the letters A-Z (no accents, tildes, or special characters — use plain ASCII: N for Ñ, etc.). Clues must be in Spanish at the appropriate grade level. After generating, run a secondary validation pass: confirm each Spanish word is correctly spelled, grammatically appropriate for the grade level, and each clue accurately describes its answer word in Spanish. Fix any errors before returning.`;
  } else if (language !== "english" && !bilingualMode) {
    langFlag = language;
    const langName = LANGUAGE_NAMES[language] || language;
    languageNote = `\nLanguage: ${langName} only. IMPORTANT — First translate the entire input text to ${langName}. Then extract vocabulary and generate ALL WORDS and CLUES entirely in ${langName} from the translated text. Answer words must be ${langName} words in ALL CAPS using only letters A-Z (no accents, special characters, or diacritics). Clues must be in ${langName} at the appropriate grade level. After generating, run a secondary validation pass: confirm each word is correctly spelled, grammatically appropriate for the grade level, and each clue accurately describes its answer word in ${langName}. Fix any errors before returning.`;
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
      const result = await getYouTubeTranscript(videoId);

      // If transcription is async (no captions, using Supadata), return job status
      if (result && result.jobId && !result.transcript) {
        return res.status(202).json({
          status: "processing",
          message: "Transcribing YouTube video — please wait a moment and refresh",
          jobId: result.jobId,
          service: result.service,
        });
      }

      if (!result || !result.transcript || result.transcript.trim().length < 50) {
        // Honest error (fixed 2026-10-26): the old message blamed the video
        // ("may have no captions") when the usual cause is on our side —
        // YouTube blocking the server's caption request. Say what's true and
        // give the user a working alternative.
        return res.status(400).json({
          error:
            "We couldn't get this video's transcript. YouTube may have blocked our request, or the captions couldn't be read. You can still build the puzzle: open the video, copy its transcript (the ••• menu under the video → Open transcript) or its description, and use Paste Text instead.",
        });
      }
      resolvedText = result.transcript;

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

  // ── Fix #4: thin-source sizing (paste / URL modes carry a real text) ─────
  // Right-size the word count to what the source can sustain, and prepare
  // the disclosure. A hopeless text (< 3 usable words) stops HERE with an
  // honest reason, before any model spend — it never just stops silently.
  let thinSource = null;
  let thinNote = "";
  if (inputMode !== "lookup" && resolvedText) {
    const supported = countSupportedWords(resolvedText, limits);
    if (supported < 3) {
      return res.status(400).json({
        error: `This text is too short to build a puzzle from — it has only ${supported} usable vocabulary word${supported === 1 ? "" : "s"} at this grade level. Add a bit more text and we'll build it.`,
      });
    }
    // Thin = the source can't fill a full puzzle SELECTIVELY: either fewer
    // usable words than the target, or less than ~2 candidates per slot
    // (the model would have to use nearly every word it can find — the
    // 39-word Jonah text that silently stretched to 18, field test case 14).
    const target = limits.wordCount;
    if (supported < target * 2) {
      const cap = supported < target ? supported : Math.max(3, Math.floor(supported * 0.6));
      thinSource = { supported, cap, target };
      limits.wordCount = cap;
      thinNote = `\n\nSOURCE SIZE — IMPORTANT: This text is short. It genuinely supports a puzzle of about ${cap} vocabulary words at this grade. Return the ${cap} strongest words the text actually contains. Do NOT pad the list to a full-size puzzle with filler words (common verbs, number words, or words barely present in the text). A smaller, honest puzzle is the correct result for this text.`;
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

    // Fix #3: existence gate — never invent a puzzle for an unverifiable
    // book. Songs (curated library) and Series Mode (curated data) carry
    // their own known content, so they skip the gate.
    if (!songsMode && !seriesMode) {
      const v = await verifyBookRef(bookRef);
      if (!v.ok) {
        await logUnverified(bookRef);
        return res.status(400).json({
          error: `We couldn't verify that "${bookRef.trim()}" is a real book or text, so we didn't invent a puzzle for it. Check the spelling — or use Paste Text and we'll build the puzzle from the actual words.`,
        });
      }
    }

    userPrompt = `Create a crossword puzzle vocabulary list from your knowledge of: "${bookRef}"

Grade level for clues: ${gradeDesc}${faithNote}${seriesNote}${languageNote}${phonicsNote}${pictureNote}${songsNote}

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

Grade level for clues: ${gradeDesc}${faithNote}${seriesNote}${languageNote}${phonicsNote}${pictureNote}${songsNote}${thinNote}

Instructions:

STEP 1 — IDENTIFY SERMON'S KEY TEACHING POINTS (3-5 main themes):
Read the sermon and extract its core themes. For sermons/lectures, these are usually:
- The main idea or thesis
- Major supporting arguments or illustrations
- Key spiritual practices or actions encouraged
- Call to decision or transformation
- Personal testimony or example

STEP 2 — EXTRACT VOCABULARY AND CONNECT TO KEY POINTS:
- Extract ${wci} from the text above
- Each word must be ALL CAPS, letters only (A-Z), no spaces, no hyphens, no punctuation
- Word length must be between ${limits.minLen} and ${limits.maxLen} letters — STRICTLY ENFORCE THIS for the grade
- Write every clue at ${gradeDesc}
- Write ALL clues in modern plain everyday English — never use archaic, scriptural, or overly formal language
- For each word, tie it to ONE of the key teaching points identified in STEP 1
- Provide three-part context (sourceQuote):
  1. bulletPoint: The specific KEY TEACHING POINT this word relates to (must be one of the 3-5 identified themes)
  2. pastorExplanation: The pastor's exact explanation, illustration, story, or example that supports this teaching point
  3. biblicalBasis: The scripture reference cited or implied in that teaching section (e.g., "John 15:4 - Abide in me")
- The title should be a short, specific title for this puzzle

VALIDATION STEP — before returning, review every word-clue pair:
- Each clue must specifically and accurately describe its exact answer word
- Each bulletPoint must be ONE of the 3-5 key teaching points (don't invent new themes)
- Each pastorExplanation must be directly from the sermon content in that teaching section
- Each biblicalBasis must be a scripture reference actually cited or referenced in the sermon
- Ensure you're capturing the actual themes the pastor taught, not making up interpretations

Return this exact JSON structure with no other text:
{
  "title": "Short specific title",
  "words": [
    {
      "word": "EXAMPLE",
      "clue": "The clue text here",
      "sourceQuote": {
        "bulletPoint": "The main teaching/theme",
        "pastorExplanation": "How the pastor explained it",
        "biblicalBasis": "Scripture Reference - verse text"
      }
    }
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
      const apiErr = await response.text();
      console.error(`[${langFlag}] Anthropic API error (${response.status}):`, apiErr);
      return res.status(500).json({ error: `Could not generate puzzle (API error). Language: ${langFlag}. Please try again.` });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();

    if (!text) {
      console.error(`[${langFlag}] No text in Claude response`);
      return res.status(500).json({ error: "Could not generate puzzle (no response). Please try again." });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error(`[${langFlag}] JSON parse error:`, parseErr.message, "Text:", text.slice(0, 200));
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return res.status(500).json({ error: "Could not generate puzzle (invalid format). Please try again." });
    }

    if (!parsed.words || !Array.isArray(parsed.words) || parsed.words.length < 3) {
      console.error(`[${langFlag}] Not enough words. Got ${parsed.words?.length || 0} words`);
      return res.status(500).json({
        error: "No vocabulary found. Try being more specific — for example: \"Book of Jonah Chapter 1\" or \"Charlotte's Web Chapter 3\".",
      });
    }

    // ── Sanitize and enforce grade limits ───────────────────────────────────
    parsed.words = parsed.words
      .map(w => ({ ...w, word: String(w.word).toUpperCase().replace(/[^A-Z]/g, "") }))
      .filter(w => w.word.length >= limits.minLen && w.word.length <= limits.maxLen && w.clue)
      .slice(0, limits.wordCount); // Hard cap at grade limit

    // Dedupe repeated words deterministically (keep the first pair).
    {
      const seen = new Set();
      parsed.words = parsed.words.filter(w => (seen.has(w.word) ? false : (seen.add(w.word), true)));
    }

    // ── Fix #5: the validation pass, in code ────────────────────────────────
    {
      const spanishAnswers = langFlag === "spanish" || /spanish-word$/.test(langFlag || "");
      let v = validatePuzzleWords(parsed.words, spanishAnswers);
      if (v.violations.length) {
        let repairedCount = 0;
        const fixes = await repairWordPairs(v.violations, gradeDesc, spanishAnswers);
        if (fixes) {
          parsed.words = parsed.words.map(w =>
            fixes.has(w.word) ? { ...w, clue: fixes.get(w.word) } : w
          );
          const after = validatePuzzleWords(parsed.words, spanishAnswers);
          repairedCount = v.violations.length - after.violations.length;
          v = after;
        }
        const droppedCount = v.violations.length;
        parsed.words = v.clean;
        parsed.validation = { checked: true, repaired: repairedCount, dropped: droppedCount };
        await logValidation({ repaired: repairedCount, dropped: droppedCount, lang: langFlag });
      }
    }

    if (parsed.words.length < 3) {
      return res.status(500).json({
        error: "Not enough suitable vocabulary found for this grade level. Try a different chapter or paste the text directly.",
      });
    }

    // Fix #4 disclosure: a thin source produced a deliberately smaller
    // puzzle — say so on the record so the client can show it.
    if (thinSource) {
      parsed.sourceNote = `Your text was short, so this puzzle has ${parsed.words.length} words — that's what the text could support. A full puzzle at this grade has ${thinSource.target}.`;
    }

    parsed.language = langFlag;
    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Could not generate puzzle. Please try again." });
  }
}
