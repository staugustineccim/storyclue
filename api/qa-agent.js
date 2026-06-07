// ── /api/qa-agent — Nightly QA Agent ──────────────────────────────────────────
// Triggered by Vercel cron at 07:00 UTC (2:00 AM EST) every Monday morning.
// Can also be triggered on demand via POST from the admin dashboard "Run Now" button.
//
// Weekly is intentional — StoryClue doesn't change daily and nightly would burn
// ~$8.50/month in Anthropic API calls for no benefit. Run on demand after major deploys.
//
// What it does:
//   1. Runs a suite of ~14 test puzzle generations across all grade levels,
//      faith traditions, and modes.
//   2. Validates each result against CLAUDE.md standards.
//   3. Stores results in Vercel KV — never in the main analytics tables.
//   4. NEVER fires Google Analytics events (server-side only).
//   5. Results appear in the admin dashboard QA Report tab every Monday.
//
// Auth: accepts Vercel CRON_SECRET header OR ADMIN_PASSWORD header.
//
// COST: ~14 Anthropic API calls per run × $0.020 = ~$0.28/run ≈ $1.20/month.

import { kv } from "@vercel/kv";

export const config = { maxDuration: 300 }; // 5-minute budget for full suite

// ── Grade limits (mirrors api/generate.js — kept in sync manually) ─────────────
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

// ── QA Test Suite ─────────────────────────────────────────────────────────────
// Covers: all grade levels, all faith traditions, Spanish bilingual,
// Classic Crossword, Topic Focus, picture mode, phonics mode.
// YouTube URL test omitted — scraping is unreliable and would create flaky tests.
const QA_TESTS = [
  // K-2 Early Learner modes
  {
    name:        "K — Picture Mode (secular)",
    grade:       "k",
    faith:       "none",
    puzzleStyle: "topic",
    pictureMode: true,
    inputMode:   "lookup",
    bookRef:     "The Very Hungry Caterpillar",
    checks:      ["wordCount", "wordLength", "secular"],
  },
  {
    name:         "Grade 2 — Phonics Mode (secular)",
    grade:        "2",
    faith:        "none",
    puzzleStyle:  "topic",
    phonicsMode:  true,
    inputMode:    "lookup",
    bookRef:      "Book of Jonah",
    checks:       ["wordCount", "wordLength", "secular", "phonicsStoryConnection"],
    storyKeywords: ["Jonah","whale","fish","ship","boat","storm","sea","Nineveh","pray","swallow","three","days","run","away","God"],
  },

  // Grade-level sweep
  {
    name:        "Grade 3 — Secular faith language check",
    grade:       "3",
    faith:       "none",
    puzzleStyle: "topic",
    inputMode:   "lookup",
    bookRef:     "Charlotte's Web",
    checks:      ["wordCount", "wordLength", "secular"],
  },
  {
    name:        "Grade 4 — Christian Catholic faith",
    grade:       "4",
    faith:       "christian-catholic",
    puzzleStyle: "topic",
    inputMode:   "lookup",
    bookRef:     "Charlotte's Web",
    checks:      ["wordCount", "wordLength"],
  },
  {
    name:        "Grade 5 — Jewish faith",
    grade:       "5",
    faith:       "jewish",
    puzzleStyle: "topic",
    inputMode:   "lookup",
    bookRef:     "Hatchet Chapter 1",
    checks:      ["wordCount", "wordLength"],
  },
  {
    name:        "Grade 6 — Classic Crossword, Islamic faith",
    grade:       "6",
    faith:       "islamic",
    puzzleStyle: "classic",
    inputMode:   "lookup",
    bookRef:     "Harry Potter and the Sorcerer's Stone Chapter 1",
    checks:      ["wordCount", "wordLength", "classicFiller"],
  },
  {
    name:        "Grade 7 — Hindu faith",
    grade:       "7",
    faith:       "hindu",
    puzzleStyle: "topic",
    inputMode:   "lookup",
    bookRef:     "The Giver Chapter 1",
    checks:      ["wordCount", "wordLength"],
  },
  {
    name:        "Grade 8 — Buddhist faith",
    grade:       "8",
    faith:       "buddhist",
    puzzleStyle: "topic",
    inputMode:   "lookup",
    bookRef:     "Romeo and Juliet Act 1",
    checks:      ["wordCount", "wordLength"],
  },
  {
    name:        "Grades 9-10 — Other faith",
    grade:       "9-10",
    faith:       "other",
    puzzleStyle: "topic",
    inputMode:   "lookup",
    bookRef:     "The Great Gatsby Chapter 1",
    checks:      ["wordCount", "wordLength"],
  },
  {
    name:        "Grades 11-12 — Christian Protestant",
    grade:       "11-12",
    faith:       "christian-protestant",
    puzzleStyle: "topic",
    inputMode:   "lookup",
    bookRef:     "Lord of the Flies Chapter 1",
    checks:      ["wordCount", "wordLength"],
  },

  // Reader Mode — the most complex tier
  {
    name:        "Reader Mode — Classic Crossword, Secular (Gettysburg Address)",
    grade:       "adult",
    faith:       "none",
    puzzleStyle: "classic",
    inputMode:   "lookup",
    bookRef:     "The Gettysburg Address",
    checks:      ["wordCount", "wordLength", "secular", "classicFiller"],
  },
  {
    name:        "Reader Mode — Topic Focus, Secular (Gettysburg Address)",
    grade:       "adult",
    faith:       "none",
    puzzleStyle: "topic",
    inputMode:   "lookup",
    bookRef:     "The Gettysburg Address",
    checks:      ["wordCount", "wordLength", "secular"],
  },

  // Spanish / Bilingual
  {
    name:        "Grade 3 — Full Spanish mode",
    grade:       "3",
    faith:       "none",
    puzzleStyle: "topic",
    language:    "spanish",
    inputMode:   "lookup",
    bookRef:     "Charlotte's Web",
    checks:      ["wordCount", "wordLength", "spanish"],
  },
  {
    name:        "Grade 3 — Spanish bilingual (Spanish clues / English answers)",
    grade:       "3",
    faith:       "none",
    puzzleStyle: "topic",
    bilingualMode: "es-clue-en-word",
    inputMode:   "lookup",
    bookRef:     "Charlotte's Web",
    checks:      ["wordCount", "wordLength", "spanishClues"],
  },
];

// ── Validation ────────────────────────────────────────────────────────────────
// Common English function words — if these appear in clues, the clue is probably English.
const COMMON_ENGLISH = /\b(the |and |that |this |with |from |have |which |were |they |been |their |there |what |when |where |about |after |first |could |would |should |people |other |these )\b/i;

// Faith-language keywords — should never appear in clues when faith=none
const FAITH_KEYWORDS = /\b(god|jesus|christ|biblical|bible|scripture|holy spirit|heavenly father|prayer|pray(ing|s|ed)?|sermon|gospel|theology|theological|christian|religious|spiritual|divine|sacred|blessed|blessing|worship|salvation|lord |heaven |church |saint )\b/i;

function validateResult(apiData, test) {
  const violations = [];
  const suggestions = [];

  // Basic: did the API return a valid puzzle?
  if (!apiData || !Array.isArray(apiData.words) || apiData.words.length === 0) {
    return {
      status: "fail",
      violations: ["API returned no words or an error"],
      suggestions: ["Check generate.js handler for runtime errors — Vercel function logs may have details"],
      wordCount: 0,
      themeWordCount: 0,
      fillerWordCount: 0,
    };
  }

  const limits       = GRADE_LIMITS[test.grade] || GRADE_LIMITS["3"];
  const themeWords   = apiData.words.filter(w => !w.isFiller);
  const fillerWords  = apiData.words.filter(w => w.isFiller);
  const allWords     = apiData.words;

  // ── wordCount check ───────────────────────────────────────────────────────
  if (test.checks.includes("wordCount")) {
    const minExpected = Math.floor(limits.wordCount * 0.5); // 50% is absolute minimum
    if (themeWords.length < minExpected) {
      violations.push(`Too few theme words: ${themeWords.length} (grade limit: ${limits.wordCount}, min expected: ${minExpected})`);
      suggestions.push(`Grade ${test.grade} word count is below 50% threshold — check generate.js wordCountInstruction and slice cap`);
    }
    if (themeWords.length > limits.wordCount + 3) {
      violations.push(`Too many theme words: ${themeWords.length} (max for grade: ${limits.wordCount})`);
      suggestions.push(`Grade ${test.grade} exceeds word count cap — verify .slice(0, limits.wordCount) in generate.js`);
    }
  }

  // ── wordLength check ──────────────────────────────────────────────────────
  if (test.checks.includes("wordLength")) {
    const tooLong = allWords.filter(w => !w.isFiller && w.word && w.word.length > limits.maxLen);
    if (tooLong.length > 0) {
      violations.push(`${tooLong.length} word(s) exceed maxLen=${limits.maxLen}: ${tooLong.map(w => w.word).join(", ")}`);
      suggestions.push(`Grade ${test.grade} has words longer than ${limits.maxLen} letters — check generate.js filter at line ~672`);
    }
    const tooShort = allWords.filter(w => !w.isFiller && w.word && w.word.length < limits.minLen);
    if (tooShort.length > 0) {
      violations.push(`${tooShort.length} word(s) shorter than minLen=${limits.minLen}: ${tooShort.map(w => w.word).join(", ")}`);
    }
  }

  // ── secular check — faith language must be absent when faith=none ─────────
  if (test.checks.includes("secular")) {
    const offending = themeWords.filter(w => w.clue && FAITH_KEYWORDS.test(w.clue));
    if (offending.length > 0) {
      violations.push(`${offending.length} clue(s) contain religious language in secular mode: ${offending.map(w => `${w.word} ("${w.clue.slice(0,60)}...")`).join(" | ")}`);
      suggestions.push("Secular SYSTEM_PROMPT rule may not be holding — consider adding more specific patterns to the keyword block list, or strengthening the faithNote constraint");
    }
  }

  // ── classicFiller check — classic mode must produce filler words ──────────
  if (test.checks.includes("classicFiller")) {
    const nonEnglish = test.language === "spanish" || Boolean(test.bilingualMode);
    if (!nonEnglish) {
      if (fillerWords.length < 5) {
        violations.push(`Classic mode only produced ${fillerWords.length} filler words (expected ~20)`);
        suggestions.push("Filler word injection may not be triggering — verify puzzleStyle is reaching generate.js and isNonEnglish guard is correct");
      }
    }
  }

  // ── Spanish full mode — clues should not look like English ───────────────
  if (test.checks.includes("spanish")) {
    const englishClues = themeWords.filter(w => w.clue && COMMON_ENGLISH.test(w.clue));
    if (englishClues.length > 0) {
      violations.push(`${englishClues.length} clue(s) appear to be in English in full-Spanish mode: ${englishClues.map(w => w.word).join(", ")}`);
      suggestions.push("Spanish HARD CONSTRAINT may not be holding — check SYSTEM_PROMPT SPANISH LANGUAGE RULE and languageNote in generate.js");
    }
  }

  // ── Spanish bilingual (es-clue-en-word) — clues should not look like English
  if (test.checks.includes("spanishClues")) {
    const englishClues = themeWords.filter(w => w.clue && COMMON_ENGLISH.test(w.clue));
    if (englishClues.length > 0) {
      violations.push(`${englishClues.length} clue(s) are in English when Spanish clues are required: ${englishClues.map(w => w.word).join(", ")}`);
      suggestions.push("Bilingual es-clue-en-word constraint may not be holding — check languageNote in generate.js");
    }
  }

  // ── phonicsStoryConnection — clues must contain story context, not just
  //    generic phonics patterns. At least 70% of clues must either:
  //    (a) contain a dash "—" or "–" (story-connection separator), OR
  //    (b) contain a story keyword from the test's storyKeywords list.
  //    Generic clue fail example: "A type of vehicle that travels on water"
  //    Good clue example:         "Jonah ran away on this — starts with /sh/ — SHIP"
  if (test.checks.includes("phonicsStoryConnection")) {
    const storyKeywords = test.storyKeywords || [];
    const storyKeywordRe = storyKeywords.length > 0
      ? new RegExp(storyKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i")
      : null;
    const genericClues = themeWords.filter(w => {
      if (!w.clue) return false;
      const hasDash = /—|–/.test(w.clue);
      const hasStoryWord = storyKeywordRe ? storyKeywordRe.test(w.clue) : false;
      return !hasDash && !hasStoryWord;
    });
    const genericRatio = genericClues.length / Math.max(themeWords.length, 1);
    if (genericRatio > 0.3) {
      violations.push(`${genericClues.length}/${themeWords.length} phonics clues appear generic (no story reference or dash separator): ${genericClues.slice(0,3).map(w => `${w.word} ("${w.clue.slice(0,55)}...")`).join(" | ")}`);
      suggestions.push("Phonics clues must tie back to the story. Check phonicsNote in generate.js — clues should follow pattern: 'Story context — starts with /sound/ — WORD'");
    }
  }

  return {
    status:         violations.length > 0 ? "fail" : "pass",
    violations,
    suggestions,
    wordCount:      allWords.length,
    themeWordCount: themeWords.length,
    fillerWordCount: fillerWords.length,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Auth: Vercel cron passes Authorization: Bearer {CRON_SECRET}
  //         Admin manual trigger sends x-admin-password header
  const cronSecret   = process.env.CRON_SECRET;
  const adminPass    = process.env.ADMIN_PASSWORD;
  const authHeader   = req.headers.authorization || "";
  const adminHeader  = req.headers["x-admin-password"] || "";

  const isCronCall   = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isAdminCall  = adminPass  && adminHeader === adminPass;

  if (!isCronCall && !isAdminCall) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const runId  = crypto.randomUUID ? crypto.randomUUID() : `run-${Date.now()}`;
  const runAt  = new Date().toISOString();

  // Determine base URL for generate API calls
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://storyclue.ai";

  console.log(`[QA Agent] Starting run ${runId} at ${runAt} — baseUrl: ${baseUrl}`);

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const test of QA_TESTS) {
    const testStart = Date.now();
    let status = "error";
    let violations = [];
    let suggestions = [];
    let wordCount = 0;
    let themeWordCount = 0;
    let fillerWordCount = 0;
    let errorMessage = null;

    try {
      const body = {
        inputMode:    test.inputMode || "lookup",
        bookRef:      test.bookRef,
        grade:        test.grade,
        faith:        test.faith || "none",
        puzzleStyle:  test.puzzleStyle || "topic",
        language:     test.language || "english",
        bilingualMode: test.bilingualMode || "",
        phonicsMode:  test.phonicsMode || false,
        pictureMode:  test.pictureMode || false,
        songsMode:    false,
        // QA agent tag — not stored to analytics (we don't call log-event)
        _qaAgent:     true,
      };

      const r = await fetch(`${baseUrl}/api/generate`, {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(25000), // 25s per test
      });

      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        status        = "fail";
        violations    = [`API returned HTTP ${r.status}: ${errText.slice(0, 200)}`];
        suggestions   = ["Check Vercel function logs for generate.js errors"];
      } else {
        const data  = await r.json();
        const check = validateResult(data, test);
        status          = check.status;
        violations      = check.violations;
        suggestions     = check.suggestions;
        wordCount       = check.wordCount;
        themeWordCount  = check.themeWordCount;
        fillerWordCount = check.fillerWordCount;
      }
    } catch (err) {
      status       = "error";
      violations   = [`Exception: ${err?.message || String(err)}`];
      suggestions  = ["Check network connectivity or timeout — QA agent may need longer AbortSignal timeout"];
      errorMessage = err?.message || String(err);
    }

    if (status === "pass") passed++; else failed++;

    const result = {
      name:           test.name,
      grade:          test.grade,
      faith:          test.faith || "none",
      puzzleStyle:    test.puzzleStyle || "topic",
      mode:           test.phonicsMode ? "phonics" : test.pictureMode ? "picture" : test.language === "spanish" ? "spanish" : test.bilingualMode ? `bilingual-${test.bilingualMode}` : "standard",
      status,
      violations,
      suggestions,
      wordCount,
      themeWordCount,
      fillerWordCount,
      durationMs: Date.now() - testStart,
    };
    results.push(result);

    console.log(`[QA] ${status.toUpperCase().padEnd(5)} ${test.name} (${result.durationMs}ms)`);
  }

  // ── Generate overall suggestions based on patterns ─────────────────────────
  const overallSuggestions = [];
  const secularFails = results.filter(r => r.violations.some(v => v.includes("religious language in secular")));
  if (secularFails.length > 0) {
    overallSuggestions.push(`⚠️ ${secularFails.length} secular test(s) failed — reinforce the SECULAR MODE RULE in SYSTEM_PROMPT (api/generate.js)`);
  }
  const spanishFails = results.filter(r => r.violations.some(v => v.includes("English") && v.includes("Spanish")));
  if (spanishFails.length > 0) {
    overallSuggestions.push(`⚠️ ${spanishFails.length} Spanish test(s) failed — check isNonEnglish guard and SPANISH LANGUAGE RULE in SYSTEM_PROMPT`);
  }
  const wordCountFails = results.filter(r => r.violations.some(v => v.includes("Too few") || v.includes("Too many")));
  if (wordCountFails.length > 0) {
    overallSuggestions.push(`⚠️ Word count issues in ${wordCountFails.length} test(s) — review generate.js GRADE_LIMITS and slice logic`);
  }
  const classicFails = results.filter(r => r.violations.some(v => v.includes("filler words")));
  if (classicFails.length > 0) {
    overallSuggestions.push(`⚠️ Classic Crossword filler not working in ${classicFails.length} test(s) — verify puzzleStyle is passed to generate.js`);
  }
  if (overallSuggestions.length === 0) {
    overallSuggestions.push("✅ All checks passed — no improvements needed at this time");
  }

  const run = {
    runId,
    runAt,
    passed,
    failed,
    total: results.length,
    durationMs: results.reduce((s, r) => s + r.durationMs, 0),
    overallSuggestions,
    tests: results,
  };

  // ── Store in KV — never in main analytics ─────────────────────────────────
  try {
    // Latest run (for quick dashboard load)
    await kv.set("qa:latest", run);

    // History: keep last 30 runs (one per day, ~1 month)
    const history = (await kv.get("qa:history")) || [];
    history.unshift({ runId, runAt, passed, failed, total: results.length, overallSuggestions });
    if (history.length > 30) history.length = 30;
    await kv.set("qa:history", history);
  } catch (kvErr) {
    console.error("[QA] KV storage failed:", kvErr?.message);
    // Non-fatal — still return results to caller
  }

  console.log(`[QA Agent] Run complete: ${passed}/${results.length} passed in ${run.durationMs}ms`);

  return res.status(200).json({
    runId,
    runAt,
    passed,
    failed,
    total: results.length,
    overallSuggestions,
    tests: results,
  });
}
