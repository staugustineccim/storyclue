# StoryClue.ai — Claude Code Context File
**Read this file at the start of every session before touching any code.**
**Last updated: June 3, 2026**

---

## 1. Project Overview

**StoryClue.ai** — AI Generated Crossword Puzzle Maker
**Domain:** storyclue.ai (registered, connected to Vercel)
**Owner:** Bob Buckmaster — sole developer and owner. No other developers involved.
**Stack:** React (Vite), Supabase, Vercel, Anthropic Claude Sonnet API
**Repo:** github.com/staugustineccim/storyclue

---

## 2. Standing Rules — Non-Negotiable

### Rule 1 — SERVICES.md
Maintain a SERVICES.md file in the project root at all times. Every external API and service must be listed with: name, purpose, free tier limits, paid tier cost, usage estimate at 100/1K/10K users, and pricing page link. Never implement a paid service without Bob's explicit approval. Always try free alternatives first. Alert Bob when total estimated monthly costs exceed $50. Bob's comfort zone is under $100/month — never propose architecture that pushes past $100/month without explicit flagging and approval. Update SERVICES.md every time a new service is added.

### Rule 2 — Grade-Appropriate Content
Every UI element must match the selected grade level. Example chips, placeholder text, sample books, suggested content, and all defaults must be appropriate for the selected grade. K-2 never sees Romeo and Juliet, Jack Reacher, adult novels, or college-level content. Bob should never have to catch this manually — Claude Code owns enforcement.

### Rule 3 — Never Break What Works
Before making any changes, read the entire codebase and identify what is already working correctly. Never rebuild working features. Only fix what is broken or add what is missing. After completing any session, verify nothing previously working has been broken.

### Rule 4 — Backup Before Major Changes
Before any major restructure or significant change: commit current state to GitHub with a descriptive message, create a new branch for the work, confirm both before writing a single line of new code.

### Rule 5 — Content Safety Filter (Conservative Family Values)
A mandatory content safety filter runs on every input before puzzle generation. StoryClue.ai is rooted in traditional American conservative values and serves homeschool families, Sunday school teachers, and classroom educators. The filter enforces:

**Always allowed (never block):**
- All Biblical, Torah, and Quran narratives regardless of dramatic content (death, violence, plagues, floods — all standard)
- Violence, death, or suicide WHEN part of a recognized book, Bible narrative, or historical account (Romeo and Juliet, Lord of the Flies, Charlotte's Web, etc.)
- Classic literature with dark themes at grade-appropriate levels
- All world history including wars, Holocaust, slavery, Civil War — when taught as history
- American patriotic content, the Constitution, the Founding Fathers
- Traditional family structures, faith traditions, prayer, sacraments

**Always blocked:**
- Sexually explicit content of any kind
- Sexual orientation or gender identity presented as a curriculum topic for children
- Gender ideology instruction for minors (drag queen story hour, transgender identity for kids, gender spectrum curriculum)
- DEI/CRT ideology materials (critical race theory lesson plans, white privilege worksheets, anti-racist curriculum for elementary students)
- Self-harm or suicide instructions (NOT mentions in classic literature — actual how-to content)
- Drug synthesis instructions
- Terrorist recruitment or propaganda

**Clue writing standard:** All clues are written from a traditional American educational perspective — patriotic, faith-respectful, factual. Never inject progressive social framing, DEI language, gender ideology, or political commentary into clues. Write about people and events as they are historically and factually understood.

Display a Safe for K-12 Education badge on the interface.

### Rule 6 — Free Alternatives First
Always prefer free alternatives over paid services. Web Speech API before Google TTS. YouTube caption API before yt-dlp and Whisper. Wikimedia Commons for images. Document every decision in SERVICES.md.

---

## 3. Current Architecture

### What's Working ✅
- storyclue.ai live and connected to Vercel
- iPhone and iPad layouts working
- Clean descriptive share URLs (storyclue.ai/play/slug-date-xx)
- Persistent Supabase database — puzzle links survive browser close
- Grade selector K through Reader Mode with grouped blocks
- Faith tradition selector
- Series Mode framework
- Hint system with grade dropping
- Show Answer with confirmation dialog
- Print function (student worksheet)
- Timer, mistake counter, progress bar
- Check answers with highlighting
- Active word highlighting (NYT style)
- Animated Early Learner Mode for K-2
- Phonics Mode for K-2
- Audio flashcards
- Vocabulary Study Mode with flashcard modal
- Feedback and rating system
- Google Analytics 4 (Measurement ID G-7K5D2X9XW6, live)
- Audience-First Design — AudienceSelector with 4 audiences, 90-day cookie, grade filtering
- K-2 Songs & Rhymes library — 65 pre-loaded songs, lyric-connected clues, gold star progress tracking, "Words Learned Today" reward card
- K-2 word count enforced — layoutBuilder.js MIN_PLACED fix (was hardcoded 15, broke all K-2 puzzles)
- K-2 image lookup — MediaWiki pageimages API primary, REST v1 fallback, SVG skip
- simplify-clue.js grade-aware — full GRADE_VOICE lookup table, grade parameter no longer silently discarded
- Audience cookie 90-day expiry fixed (was accidentally set to 365 days)
- Demo puzzle shows grade-correct clues for selected audience (was always showing grade 3)

### What's Broken or Missing ⬜
See Priority Fixes section below.

---

## 4. Priority Fixes — Complete in Order

### ✅ Fix 1 — Kindergarten Picture Crossword Mode — DONE
Word count enforced via MIN_PLACED fix. Images loading via MediaWiki API. K-2 cell size 44px mobile / 50px desktop.

### Fix 2 — Phonics Mode Clues Wrong
Three failures:
1. Clues have zero story connection. SHIP in Jonah puzzle must read: "Jonah ran away on this — starts with the /sh/ sound — SHIP." Not generic phonics patterns.
2. Word count — 2nd grade maximum 12 words, currently generating 23.
3. Audio reads generic phonics patterns not story connections.
Test: Book of Jonah 2nd grade Phonics Mode.

### Fix 3 — Grade-Based Voice Tiers
- K-2: Most child-friendly Web Speech API voice first. Only use Google Cloud TTS Neural2 if Web Speech API is inadequate. Pre-recorded child celebration clips from Freesound.org.
- 3rd-5th: Warm encouraging younger voice.
- 6th-12th: Standard Web Speech API adult voice.
- Reader Mode: Slower paced clear adult voice.
- Add mute button to toolbar.

### Fix 4 — YouTube and Audio Transcription
Use free YouTube caption API first. Only fall back to yt-dlp and Whisper if captions unavailable. Never reject a YouTube URL. Also support Vimeo and podcast URLs.
Test: https://www.youtube.com/live/CQo_1gQk0cg (Colonial Church St. Augustine sermon)

### Fix 5 — Universal Content Input
Accept every content format without rejecting: book title/chapter, pasted text, any URL, YouTube, Vimeo, podcast, PDF upload, Word doc, Google Docs, audio/MP3, Wikipedia, news articles, Bible verse reference (John 3:16), Torah portion, Khan Academy, TED Talk.
Never display "cannot process this input." Always attempt generation.
Placeholder text: "Paste anything — a book title, chapter, URL, YouTube video, sermon, article, PDF, or any text."
NOTE: PDF upload via PDF.js (client-side, free) is partially built — sends extracted text as paste mode.

### Fix 6 — Content Safety Filter
See Standing Rule 5 above. Build into every input path without exception.

### ✅ Fix 7 — Google Analytics 4 — DONE
Measurement ID G-7K5D2X9XW6 live in index.html. Still needed: verify puzzle_generated, puzzle_completed, puzzle_shared, hint_used, show_answer_clicked, feedback_submitted events are firing. Log same events to Supabase events table.

### Known Small Issues (Quick Wins)
- FeedbackModal still asks "Would you pay for unlimited puzzles?" — remove this question
- manifest.json description still says "K-6 grade levels" — update to K-12
- Teacher link ?t=1 is guessable by students — needs obscuring
- No rate limiting on /api/generate — no per-IP throttle exists
- No puzzle history — users lose puzzle if they navigate away without saving the link
- Privacy policy page missing — required before pitching schools (COPPA)

---

## 5. Missing V1 Features — Build After Priority Fixes

### ✅ User Accounts — DONE
Supabase Auth — Google OAuth ✅ and email/password login ✅. Family Dashboard with child profiles ✅.

### Stripe Payments
Recurring billing, plan upgrades/downgrades, failed payment handling. Wire to Supabase user profiles via webhook. Three tiers:
- Free: 3 puzzles/month, watermarked
- Homeschool: $7.99/month, unlimited puzzles
- Teacher: $12.99/month, bulk print, answer key, classroom features
- Co-op: $34.99/month, 50 family accounts

### Feature Gating
Check Supabase plan level before unlocking premium features. Free tier hits puzzle limit and sees upgrade prompt.

### Pricing Page
Live at storyclue.ai/pricing before any marketing begins.

### Print — Two Modes
- Student Worksheet: blank grid, clues, Name/Grade/Date fields, STUDENT watermark
- Answer Key: completed grid, ANSWER KEY watermark, no student fields
Both always available regardless of puzzle state.

### Teacher/Student URLs
- Student URL: storyclue.ai/play/[slug] — no answer key option anywhere
- Teacher URL: storyclue.ai/play/[slug]/teacher — answer key available
Teacher URL shown only to puzzle creator at generation time.

### Spanish Language Support
Language selector: English and Spanish. Auto-translates English content to Spanish when selected. Bilingual Mode toggle: English clues/Spanish answers or vice versa. Secondary validation pass for Spanish accuracy. Disclaimer: "AI-generated Spanish content. We recommend review by a fluent Spanish speaker for classroom use."

### ✅ Children's Songs and Nursery Rhymes — DONE
65 songs pre-loaded in src/utils/songsData.js. SongsLibrary.jsx component built.
- Nursery Rhymes, Action Songs, Learning Songs, Seasonal, Classic/Folk, Patriotic
- Faith layer: 12 Christian, 5 Jewish — only shown when faith tradition selected, never removes universal songs
- Lyric fill-in-the-blank clue format: "Twinkle twinkle little ___"
- Gold star badge on completed songs, progress stored in localStorage (sc_songs_done)
- "Words Learned Today" reward card shown after puzzle completion
- Word count enforced: K=8, 1st=10, 2nd=12

### ✅ Main Page Restructure — Audience First — DONE
AudienceSelector.jsx built. 4 audiences with 90-day cookie (sc_audience).
- 🐣 Early Learners (K-2): Songs library, picture mode, phonics mode, no series
- 📚 Elementary (3-5): Full interface
- 🎒 Middle and High School (6-12): No K-2 modes
- 📖 Adult and Senior Reader: No grade selector shown
Change Audience button in top corner. Grade selector filtered per audience.

### Vocabulary In Context
After puzzle completion, show one sentence per word using that word in context. Word highlighted/bolded in sentence. Automatic for K-5, optional for 6th+.

---

## 6. Grade-Level Content Standards

### Word Count by Grade
- Kindergarten: 8 words maximum, 3-5 letters each
- 1st Grade: 10 words maximum, 3-6 letters each
- 2nd Grade: 12 words maximum, 3-6 letters each
- 3rd-5th Grade: 15 words maximum
- 6th-8th Grade: 18 words maximum
- 9th-12th Grade: 20 words maximum
- Reader Mode: 20-25 words, full NYT standards

### Crossword Construction Standards by Tier
**K-5 Relaxed:** Minimum 3 letter words, no repeated words, grid connectivity, number 1 always Across, symmetry not required, unchecked squares permitted.

**6th-12th Intermediate:** All relaxed standards plus no unchecked first/last letters, black squares under 20%.

**Reader Mode Full NYT:** 180 degree rotational symmetry, fully checked squares, black squares under 16%, number 1 always Across, minimum 3 letters, no repeated words, full connectivity.

### Example Content by Grade Band
K-2: Very Hungry Caterpillar, Green Eggs and Ham, Three Little Pigs, Frog and Toad
3rd-5th: Charlotte's Web, Lion the Witch and the Wardrobe, Stuart Little, James and the Giant Peach
6th-8th: Harry Potter, The Giver, Hatchet, Romeo and Juliet
9th-12th: The Great Gatsby, Lord of the Flies, Of Mice and Men, Animal Farm
Reader Mode: Jack Reacher, Agatha Christie, Genesis Chapter 1, The Gettysburg Address

---

## 7. Version Detection and Mismatch

When a book exists in multiple versions at significantly different reading levels (Bible, Shakespeare, Homer, classic fairy tales), ask: "Which version of this book are you using?" before generating.

Show most popular options for selected grade level with "Most Popular" badge. Include "Other" option with text input field. Do not proceed until version is selected.

After version selected, check for grade mismatch. Yellow warning = slight mismatch. Orange warning = significant mismatch. Offer children's version if available. Always advisory, never blocking.

For books where Claude can determine the version from the title alone (Jesus Storybook Bible vs Genesis), skip the question and proceed directly.

---

## 8. Intelligent Content Understanding

When YouTube URL pasted: use free YouTube caption API first. If no captions, use yt-dlp and Whisper as fallback. Never reject.

Claude should use its own training knowledge for any well-known book or content before requiring external fetching.

---

## 9. Admin Dashboard — storyclue.ai/marketing-admin

Password protected. Contains:
- Analytics overview (visitors, puzzles generated, popular content, completion rates)
- Content safety blocked attempts log
- Feedback and ratings from users
- Marketing content queue (when agents are built)
- SERVICES.md cost summary

---

## 10. V2 Features — Do Not Build Yet

- Student accounts with COPPA compliance
- Vocabulary Struggle Tracker with spaced repetition (track hints, grade drops, wrong answers per word; auto-include top 3 struggle words in future puzzles; word graduates after 3 correct answers without hints)
- Teacher dashboard (class progress — red/yellow/green)
- Clever SSO and Google Classroom integration
- Animated Early Learner Mode improvements
- French, German, Italian, Portuguese, Latin
- Classroom/Projector Mode for whole-class use
- Custom keyboard (A-Z grid instead of system keyboard)

---

## 11. V3 Features — Future Vision

- Mandarin, Japanese, Korean, Arabic, Hebrew
- Arabic/Hebrew right-to-left grid engine
- School district licensing and contracts
- Full reading comprehension assessment platform
- Lexile score integration
- Compete with Duolingo's spaced repetition model

---

## 12. Marketing — Do Not Launch Until Product Is Complete

Six-agent marketing pipeline specification exists and is ready to build at storyclue.ai/marketing-admin. DO NOT build or launch until:
1. All Priority Fixes are complete
2. User accounts and Stripe payments are working
3. Bob gives explicit go-ahead

Target markets: Christian/Catholic/Jewish homeschool families, classroom teachers, senior book clubs, Sunday school teachers, summer reading parents.

---

## 13. Business Model

- Free: 3 puzzles/month, watermarked
- Homeschool: $7.99/month
- Teacher: $12.99/month
- Co-op: $34.99/month (50 families)
- Enterprise: curriculum publishers and school districts (negotiate)

Target: 2,500 homeschool subscribers = $300K ARR

Step Up For Students ESA program identified as distribution channel — Florida families receive ESA funds they can spend on educational tools including StoryClue.ai subscriptions.

MagicSchool.ai analyzed — they do NOT have a crossword tool. StoryClue is not duplicated there. Potential future partner not competitor.

---

## 14. Personal Context

Bob and Carole are planning a Galapagos trip in November 2026. StoryClue.ai revenue helps fund it. Every paying subscriber matters.

Carole is a research librarian — the senior reader market was her discovery. She is the Chief Product Officer in all but name. Her ideas: grade mismatch detection, version selection dialog, children's songs feature, cognitive recall for seniors.

Bob grew up doing Sudoku not crosswords. StoryClue.ai is for the kid he used to be — the one who found crosswords too intimidating. That is the marketing story.
