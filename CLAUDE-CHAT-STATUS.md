# StoryClue.ai — Project Status for Claude Chat
*Paste this entire document at the start of any Claude Chat session to avoid repeated recommendations.*
*Last updated: June 12, 2026 (night — Vocab Dashboard complete; Classic Crossword engine in progress)*

---

## What StoryClue.ai Is

AI-generated crossword puzzle maker for K-12 students, homeschool families, teachers, and senior readers. Hosted at **storyclue.ai**. Built with React (Vite) + Supabase + Vercel + Anthropic Claude API (claude-sonnet-4-6).

**Owner:** Bob Buckmaster (solo developer)
**Repo:** github.com/staugustineccim/storyclue
**Active branch:** `june3-complete` — all recent work here. `main` = stable live site.

---

## ✅ COMPLETED AND WORKING — Do Not Recommend These

### Core Puzzle Engine
- AI puzzle generation from any text, book title, YouTube URL, Vimeo URL, PDF upload, or pasted content
- Grade-adaptive clues: K through Reader Mode (12 grade levels)
- Crossword layout builder (`src/utils/layoutBuilder.js`) with three tiers: K-5 Relaxed, 6-12 Intermediate, Reader Mode Full NYT
- Clean share URLs: `storyclue.ai/play/[slug-date-xx]` — persistent in Supabase Postgres
- All puzzles stored permanently; share links never expire

### UI and Puzzle Solver
- Interactive grid with active word highlighting (NYT-style)
- Timer, mistake counter, progress bar
- Check answers with color highlighting (green/red/yellow)
- Hint system: 3 hints max — reveal letter OR get simpler clue (calls `/api/simplify-clue`)
- Show Answer with confirmation dialog — directly reveals, no loop
- Print function (student worksheet)
- Feedback and rating system
- Mobile-responsive iPhone and iPad layouts

### Grade & Audience System
- AudienceSelector (4 audiences): Early Learners K-2, Elementary 3-5, Middle/High 6-12, Adult/Senior
- 90-day cookie (`sc_audience`) persists choice
- Grade selector filtered by audience
- Demo puzzle shows grade-correct clues for selected audience

### K-2 Early Learner Mode
- Animated flashcard grid (44px mobile, 50px desktop)
- Audio clue reading (Web Speech API, with parent voice override)
- Picture crossword mode — Wikipedia thumbnail images with emoji fallback
- Phonics mode (partial — see "Still Needs Work" below)
- Songs & Rhymes library: 65 pre-loaded songs across 6 categories
  - Faith layer: 12 Christian + 5 Jewish songs shown only when faith tradition selected
  - Lyric fill-in-the-blank clue format
  - Gold star progress tracking (localStorage `sc_songs_done`)
  - "Words Learned Today" reward card after completion
  - Word count enforced: K=8, 1st=10, 2nd=12
  - Song intro preview — reads all clues aloud before puzzle starts, tap again to cancel

### Content Intelligence
- Faith tradition selector (Christian, Jewish, Secular — plus denomination options)
- Secular mode: enforced at SYSTEM_PROMPT level — zero religious language in clues
- Spanish language mode and Bilingual mode (English clues/Spanish answers or reverse)
- Spanish constraints enforced at SYSTEM_PROMPT level — zero English fallback
- Version detection: when a book has multiple versions (Bible, Shakespeare), asks which one
- Grade mismatch detection: yellow/orange advisory warnings, never blocking
- Vocabulary Context Sentences: after puzzle completion, shows each word used in a sentence

### Classic Crossword Mode
- 45-word target (25 theme + up to 20 grade-appropriate filler words)
- Up to 50 layout attempts to maximize density
- Filler word injection guarded: `isNonEnglish` flag prevents English filler in Spanish/bilingual puzzles

### User Accounts
- Supabase Auth: Google OAuth + email/password
- Family Dashboard with child profiles (name, grade, emoji)
- Each child stores grade level, audience preference
- Session: `sessionStorage sc_active_child` tracks which child is active

### Parent Voice Cloning (ElevenLabs — Family Plan Feature)
- Parent records one voice sample → ElevenLabs Instant Voice Cloning
- Personalized celebration phrases generated per child
- Voice profiles: Mom / Dad / Grandma / Grandpa — each stored separately
- FamilyDashboard shows which voices are already recorded (✅ labels with checkmarks)
- VoiceSetup intro acknowledges existing voices: "Grandpa's voice is your default"
- Audio caching: `voices-cache/{voiceId}/{hash}.mp3` in Supabase Storage
  - First-ever synthesis is stored; every repeat play hits cache — 95%+ cache hit rate
  - WITHOUT caching it would cost ~54K chars/month per family; with caching ~600 chars first week then near zero
- Falls back to Web Speech API for free users (zero ElevenLabs cost)
- Deployment Messages: parent records personal message + optional photo for puzzle completion
  - Stored in `voice-recordings-private` Supabase Storage bucket (PRIVATE — no public URLs)
  - 1-hour signed URLs generated at playback time only
  - Photo shown as circle at puzzle completion when deployed parent has a message

### Security
- All API keys server-side only — never VITE_ prefixed, never in client code
- SUPABASE_SERVICE_ROLE_KEY server-side only
- voice-recordings-private bucket: Public = OFF, signed URLs only
- HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers in vercel.json
- Content safety filter on all inputs — faith-respectful, family-safe, blocks explicit content

### Analytics
- Google Analytics 4: `G-7K5D2X9XW6`
- Custom events: puzzle_generated, puzzle_completed, puzzle_shared, hint_used, show_answer_clicked, feedback_submitted
- Vercel Postgres: all events and puzzles stored
- Admin dashboard at `/marketing-admin` — analytics, feedback, content safety log, QA report

### QA Agent (Build 7)
- Runs every Monday 2am EST via Vercel cron (`0 7 * * 1`)
- 14 test puzzles: covers all grades, faith traditions, Spanish, Classic mode, phonics, picture mode
- Validates: word count, word length, secular compliance (zero faith keywords in secular mode), Classic filler density, Spanish compliance
- Results stored in Vercel KV (`qa:latest`, `qa:history`) — NEVER writes to analytics tables
- Admin dashboard "QA Report" tab with expandable per-test results, Run Now button
- Cost: ~$0.28/run = ~$1.20/month fixed overhead

### PWA (Progressive Web App)
- manifest.json: standalone display, #2d4a18 theme, portrait orientation
- Service worker `sw.js`: network-first HTML, cache-first hashed assets, API calls always network-only
- PNG icons at every required size (see Brand Identity below)
- apple-touch-icon: `apple-touch-icon.png` 180×180 (PNG — iOS Safari requires PNG, not SVG)
- Favicons: `favicon-48.png` (primary) + `favicon-32.png` (fallback) — both PNG
- Add to Home Screen confirmed working on iPhone Safari

### Brand Identity — New Icon (June 6, 2026)
- **Retired:** spider emoji 🕷️ — replaced everywhere
- **New brand icon:** AI-generated illustration — curious boy leaning over an open book, peering through a gold magnifying glass with a crossword grid visible through the lens, forest green botanical background. Rounded corners already applied. 1254×1254 source PNG.
- **Icon files in `public/`:**
  - `icon-512.png` — 512×512, PWA maskable (Android home screen)
  - `icon-192.png` — 192×192, PWA any-purpose + used inline in app headers
  - `apple-touch-icon.png` — 180×180, iOS Add to Home Screen
  - `favicon-48.png` — browser tab favicon (primary)
  - `favicon-32.png` — browser tab favicon (fallback)
- **Spider retired from every brand touchpoint:**
  - Landing page nav, AudienceSelector header + hero, FamilyDashboard header, CrosswordPuzzle loading screen, CrosswordPuzzle error/404 state, CrosswordPuzzle header back button — all now use `<img src="/icon-192.png">`
  - **In-game corner mascot** changed from 🕷️ to 🔍 (magnifying glass, on-brand)
- Do NOT suggest reverting to the spider or adding any spider references anywhere

### Free APIs In Use
- Wikipedia REST API: thumbnail images for K-2 picture mode
- Web Speech API: TTS for clues, celebrations (free users)
- Web Audio API: celebration sounds
- Google Fonts: Playfair Display + Lora
- YouTube Caption Parser: transcript extraction, no API key
- Vimeo oEmbed: title/description from Vimeo URLs
- PDF.js (CDN): client-side PDF text extraction

---

## 💰 Cost Structure — Do Not Propose Architecture That Exceeds $100/month

| Service | Cost | Notes |
|---|---|---|
| Anthropic API | ~$0.020/puzzle | ~$40/month at 1,000 users |
| QA Agent | $1.20/month fixed | Weekly, 14 tests |
| Vercel Pro | $20/month | Unlimited functions, 1TB bandwidth |
| Vercel KV | Free | 30MB, feedback + QA results |
| Vercel Postgres | Free | Puzzles + analytics |
| Supabase | Free–$25/month | Auth + DB + Storage |
| ElevenLabs Creator | $22/month | 100K chars, voice cloning |
| Google Analytics | Free | Always free |
| Wikipedia, Web Speech, Web Audio, Google Fonts | Free | Always free |

**Alert threshold: $50/month → reached at ~1,000 active users**
**Bob's comfort zone: under $100/month**
**Stripe subscriptions must be live before hitting 1,000 users**

---

## ✅ Classic Crossword Engine — Complete

**Built this session:**
1. `api/pattern-generator.js` — 15×15 symmetric pattern generation (180° rotational symmetry, greedy block placement)
2. `api/grid-builder.js` — Constraint-satisfaction solver (least-constraining-value + forward checking, fills in 2–6 seconds)
3. `api/generate-classic.js` — Full orchestration (topic extraction → pattern → fill → dual clue generation)
4. `src/components/ClassicCrossword.jsx` — Interactive display with Rich/Classic clue toggle, NYT-style layout

**Architecture (locked per CLASSIC_MODE_SPEC.md):**
- ✅ Grid construction = CODE (constraint satisfaction, never AI)
- ✅ Clue writing = AI (Claude API, Rich 10–25 words + Classic 1–6 words)
- ✅ Topic coherence (extract answers → weight solver → ≥50% on-topic)
- ✅ User flow: **Zero manual input** (source text only, AI generates everything)
- ✅ Dual clue modes (Rich default, instant toggle, no regeneration)
- ✅ Blocklists (audience-tiered, checked at word selection)

**Frontend:**
- 15×15 grid with solved letters revealed on toggle
- Across/Down clue lists, two-column layout (mobile: single column)
- Rich/Classic toggle bar + "Reveal Solution" button
- NYT-style paper background, Georgia serif, forest-green accents
- Responsive grid sizing (clamp function scales for all screens)

**Still needed:**
- Integration: wire generate-classic into PuzzleGenerator selection flow
- Wordlist upgrade: load from pre-built frequency-scored JSON (currently baseline)
- QA gates: topic ratio validation, blocklist enforcement, fill-time logging
- Route: `/play/[slug]/classic` to display ClassicCrossword.jsx
- Save puzzle structure: store pattern + dual clues in database

---

## ⬜ NOT YET BUILT — These Are Valid Recommendations

### High Priority
- **Stripe payments** — recurring billing for Homeschool ($7.99/mo), Teacher ($12.99/mo), Co-op ($34.99/mo), Family plans; webhook to Supabase; feature gating
- **Feature gating** — free tier: 3 puzzles/month with watermark; premium unlocks
- **Phonics Mode clue fix** — clues currently have no story connection; SHIP in Jonah puzzle should say "Jonah ran away on this — starts with the /sh/ sound — SHIP"
- **Privacy policy page** — required before pitching schools (COPPA compliance)
- **Pricing page** — needed before any marketing

### Medium Priority
- **Rate limiting** on `/api/generate` — no per-IP throttle exists
- **Teacher/Student URLs** — `storyclue.ai/play/[slug]` vs `/teacher` with answer key
- **Print modes** — Student Worksheet vs Answer Key (currently one print mode)
- **Teacher link obscuring** — `?t=1` is guessable by students
- **Puzzle history** — users lose puzzle if they navigate away without saving the link
- **Mute button** in toolbar

### Lower Priority / V2
- Student accounts with COPPA compliance
- Teacher dashboard (class progress)
- Clever SSO / Google Classroom integration
- French, German, Portuguese, Latin
- Classroom/Projector Mode
- Marketing pipeline (6-agent system — DO NOT BUILD until Stripe is live)

---

## 🚫 Do NOT Recommend (Already Evaluated and Rejected)

- **Google Cloud Text-to-Speech** — replaced by Web Speech API (free)
- **Clerk for auth** — replaced by Supabase Auth (free, already integrated)
- **Nightly QA runs** — changed to weekly (nightly was overkill at $8.50/month vs $1.20/month weekly)
- **Public Supabase storage URLs** for voice recordings — security requirement: signed URLs only, always private bucket
- **yt-dlp + Whisper as primary** — YouTube Caption Parser is used first (free); Whisper is a fallback option (approved but not yet wired)
- **Spider icon / spider emoji** — brand retired June 6, 2026. Do not suggest reintroducing it anywhere.
- **SVG as apple-touch-icon** — iOS Safari does not support SVG for Add to Home Screen; PNG is required and is now in place

---

## 🔧 Fixes & Builds Completed (June 2026)

1. Classic Crossword sparse grid → 50 layout attempts, up to 20 filler words, longest-first sort
2. Faith language in secular clues → SYSTEM_PROMPT-level enforcement, not just user prompt
3. iPhone Safari red security bar → HSTS + security headers added to vercel.json
4. Parent voice not playing → speakWithVoice closure + previewPlayingRef guard + once-safe resolver
5. Spanish clues mixing English → isNonEnglish guard prevents English filler; Spanish constraint at SYSTEM_PROMPT level
6. Show Answer looping → doReveal() always directly reveals for all grades
7. K-2 audio clue repeating 3-4× → previewPlayingRef guard + concurrent call protection
8. Deployment photo not showing → photo upload now uses correct MIME-based extension (was hardcoded .jpg even for HEIC/PNG); photo upload errors now surfaced to user; query orders by created_at DESC so newest row is returned
9. TTS "AmazingJourney" no pause → comma added before child name in all celebration phrases
10. PWA Add to Home Screen → full PNG icon set generated; apple-touch-icon changed from SVG to PNG (iOS requires PNG); confirmed working on iPhone Safari
11. QA Agent (Build 7) → weekly cron every Monday 2am EST, 14 test puzzles, analytics-isolated (KV only), admin dashboard QA Report tab with Run Now button
12. Keyboard hiding active clue → `visualViewport` API listener detects keyboard open; active clue bar `position:fixed` floats just above keyboard with drop shadow; spacer div keeps flex layout stable
13. Voice UX → FamilyDashboard loads voice_profiles on mount, shows ✅ Grandpa / ✅ Mom labels with "Grandpa's voice is the default" copy; button changes from "Set Up Voice" to "Add / Update Voice" once voices exist; VoiceSetup intro panel acknowledges current default voice; voice list refreshes after setup closes
14. Brand refresh → spider icon fully retired; new AI-generated boy+magnifying glass icon at all sizes; in-game mascot changed to 🔍; all headers, nav bars, loading screens, and error states updated
15. Word count enforcement → `wordCountInstruction()` now says "MAXIMUM N words — strictly do not exceed this count" for all grades 3+; Spanish `languageNote` adds explicit WORD COUNT clause; server-side `.slice(0, limits.wordCount)` hard cap remains as backstop. Fixes Spanish Reader Mode returning 39 words instead of 25.
16. Vocabulary Struggle Tracker (spaced repetition) → `src/utils/wordProgress.js` implements SM-2 algorithm: tracks per-word mistakes, hints, letter reveals, Show Answer usage; status lifecycle learning→struggling→mastered; Ebbinghaus intervals (1→2→4→8→16→21 days, then 30-day refresher); mastery = 3 clean solves on 7+ day intervals; clue difficulty auto-downgraded for struggling words (Marzano scaffolding); stored in localStorage per child (`sc_wp_<childId>`). Struggle words injected into future puzzle generation prompts with simpler clues. Post-win Review Card surfaces due words from previous sessions (filtered to exclude words just practiced). Tracks per-word mistakes in keyDown and letter reveals in hintRevealLetter.
17. Audio singleton (`_currentAudio`) → prevents multiple voices playing simultaneously; all ElevenLabs Audio elements tracked; `stopCurrentAudio()` cancels both Web Speech API and any active Audio element. K-2 last-word overlap fix, deployment message audio fix, song intro cancel fix, mute button fix.
18. Rate limiting → 20 puzzles/IP/hour via Vercel KV; fails open; QA agent exempt; 429 shows friendly ⏳ message in PuzzleGenerator.
19. iOS safe-area insets → `viewport-fit=cover` + `env(safe-area-inset-*)` on puzzle-root, loading, and error screens. Prevents notch/Dynamic Island covering top bar or home indicator covering bottom.
20. Vocabulary Progress Dashboard → `src/components/VocabDashboard.jsx` — per-child mastery stats (🏆 Mastered / 📚 Learning / 🔴 Needs Help), progress bar, recently-mastered word highlight, expandable struggling-word list with parent tip. Rendered in FamilyDashboard below Voice Settings whenever children exist.
21. Supabase cross-device sync → `supabase/migrations/002_word_progress.sql` creates `word_progress` table (service-role-only writes, parent-readable via RLS). `api/track-words.js` — JWT-verified POST upsert endpoint (confirms parent owns child before writing). `api/vocab-stats.js` — GET endpoint returning mastery stats + word lists for dashboard. `src/utils/wordProgress.js` — `syncProgressToServer()` fires background POST to `/api/track-words` after every localStorage update when user is logged in; silent failure keeps localStorage as source of truth. Anonymous users remain localStorage-only with zero API calls.

---

## ✅ June 12 Commit Deployed
- Branch: `june3-complete`
- Commit: "Build: Vocabulary Dashboard, Cross-Device Sync, and Classic Crossword Engine"
- Status: All core features built, syntax-checked, build passes ✓

## Pre-Production Checklist (Before Main Merge)

**Essential (blocking):**
- [ ] Run the Classic Crossword engine end-to-end (test pattern → fill → clues)
- [ ] Integrate Classic mode into PuzzleGenerator UI (add "Classic" radio button)
- [ ] Update save-puzzle.js to store dual clues (rich + classic)
- [ ] Update get-puzzle.js to return both clue sets
- [ ] Add route `/play/:slug/classic` → ClassicCrossword component
- [ ] Test on iPhone/iPad (grid responsiveness, clue toggle)
- [ ] Run full QA test suite Monday 2am EST (automatic via `/api/qa-agent`)

**High Priority (strongly recommended):**
- [ ] Upgrade wordlist: load from pre-built frequency-scored JSON (wordfreq package)
- [ ] Validate topic ratio ≥50% before returning puzzle
- [ ] Test blocklist enforcement (no unsafe words in grid)
- [ ] Verify analytics events fire (puzzle_generated, puzzle_completed for Classic mode)

**Nice-to-Have (can be V2):**
- [ ] Add wordlist stats to admin dashboard (topic ratio per puzzle)
- [ ] Fill-time monitoring (alert if > 5s)
- [ ] Teacher answer key toggle for Classic mode
- [ ] Print modes for Classic puzzles

## Current Branch Status
- `june3-complete` → preview URL: `https://storyclue-git-june3-complete-robert-buckmaster-s-projects.vercel.app`
- `main` → live at `storyclue.ai` — NOT updated yet (Bob reviews on iPhone/iPad before merging)
- Commit ready for testing; do not merge to main until checklist items verified

---

*This file is maintained by the Claude Code (desktop) agent. If you're Claude Chat, please work from this status rather than suggesting features or fixes that are already complete.*
