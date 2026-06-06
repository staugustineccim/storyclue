# StoryClue.ai — Project Status for Claude Chat
*Paste this entire document at the start of any Claude Chat session to avoid repeated recommendations.*
*Last updated: June 6, 2026*

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
- PNG icons: icon-192.png (192×192) and icon-512.png (512×512) — spider on green
- apple-touch-icon: points to icon-192.png (PNG, not SVG — iOS Safari requires PNG)
- Add to Home Screen works on iPhone Safari

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
- Vocabulary Struggle Tracker (spaced repetition)
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

---

## 🔧 Recent Fixes (June 2026)

1. Classic Crossword sparse grid → 50 layout attempts, up to 20 filler words, longest-first sort
2. Faith language in secular clues → SYSTEM_PROMPT-level enforcement, not just user prompt
3. iPhone Safari red security bar → HSTS + security headers added to vercel.json
4. Parent voice not playing → speakWithVoice closure + previewPlayingRef guard + once-safe resolver
5. Spanish clues mixing English → isNonEnglish guard prevents English filler; Spanish constraint at SYSTEM_PROMPT level
6. Show Answer looping → doReveal() always directly reveals for all grades
7. K-2 audio clue repeating 3-4× → previewPlayingRef guard + concurrent call protection
8. Deployment photo not showing → query now orders by created_at DESC; delete-then-insert prevents stale rows
9. TTS "AmazingJourney" no pause → comma added before child name in all celebration phrases
10. PWA Add to Home Screen → PNG icons generated, apple-touch-icon changed from SVG to PNG
11. QA Agent → weekly cron, analytics-isolated, admin dashboard QA Report tab
12. Keyboard hiding active clue → visualViewport listener floats clue bar above keyboard when typing
13. Voice UX → FamilyDashboard shows existing voice labels; VoiceSetup intro acknowledges current default voice

---

## Current Branch Status
- `june3-complete` → preview URL: `https://storyclue-git-june3-complete-robert-buckmaster-s-projects.vercel.app`
- `main` → live at `storyclue.ai` — NOT updated yet (Bob reviews on iPhone/iPad before merging)
- Do not recommend merging to main or deploying to production — Bob controls that gate

---

*This file is maintained by the Claude Code (desktop) agent. If you're Claude Chat, please work from this status rather than suggesting features or fixes that are already complete.*
