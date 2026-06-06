# StoryClue — Services & Cost Registry

Last updated: June 6, 2026
Rule: Never add a paid service without Bob's explicit approval.
Rule: Always try free alternatives first.
Rule: Flag any usage-based service with cost estimates at 100 / 1,000 / 10,000 users.
Rule: Alert Bob when total estimated monthly cost exceeds $50.
Rule: Bob's comfort zone is under $100/month. Never propose architecture that pushes past $100/month without flagging it explicitly and getting approval.

---

## CURRENTLY IN USE

### 1. Anthropic API (Claude)
- **Purpose:** Puzzle generation, content safety check, version detection, clue simplification, vocabulary context sentences, filler-word clue pass (Classic Crossword mode)
- **Model:** claude-sonnet-4-6
- **Pricing:** ~$3.00 / million input tokens · ~$15.00 / million output tokens · cached input ~$0.30/M
- **Free tier:** None — pay per token from first request
- **Cost per puzzle generation:**
  - Generate: ~$0.011
  - Safety check (avg — faith fast-pass skips Claude 50% of the time): ~$0.002
  - Version check (lookup mode): ~$0.007
  - Subtotal per puzzle: **~$0.020**
- **⚠️ USAGE-BASED COST ESTIMATES:**

| Users/month | Puzzles (avg 2/user) | Est. monthly cost |
|---|---|---|
| 100 | 200 | ~$4 ✅ |
| 1,000 | 2,000 | ~$40 ✅ |
| 2,500 | 5,000 | ~$100 🔴 EXCEEDS $50 |
| 10,000 | 20,000 | ~$400 🔴 |

> **⚠️ ALERT:** Anthropic API costs will exceed $50/month at approximately **2,500 active users** generating 2 puzzles each. Monetization (Stripe subscriptions) must be live before hitting this threshold.

---

### 2. Vercel (Hosting + Serverless Functions)
- **Purpose:** Hosts the React app and all `/api/*` serverless functions
- **Current plan:** Pro — $20/month ✅ (upgraded June 3, 2026)
- **Pro plan includes:** Unlimited serverless functions, 1 TB bandwidth/month, team collaboration
- **Current function count:** 12 functions — no longer limited (Pro removes the 12-function cap)
- **Upgrade reason:** Hobby plan's 12-function cap was blocking `/api/voice` from serving correctly.
- **Pricing page:** vercel.com/pricing

---

### 3. Vercel KV (Redis)
- **Purpose:** Stores feedback submissions, logs content safety blocked attempts
- **Pricing:** Free tier
- **Free tier:** 30 MB storage · 30,000 requests/day · 1 database
- **Current usage:** Very low — feedback records + safety blocks
- **Paid tier:** $20/month for 1 GB + 1M requests/day (not needed yet)
- **Pricing page:** vercel.com/storage/kv

---

### 4. Vercel Postgres
- **Purpose:** Stores all puzzles (permanent slug URLs) and analytics events
- **Pricing:** Free tier
- **Free tier:** 60 compute hours/month · 256 MB storage · 1 database
- **Current usage:** Growing — every puzzle and analytics event saved
- **⚠️ WATCH:** At 10,000 users × 10 events = 100,000 rows/month. May fill in 6–12 months.
- **Paid tier:** $0.10/GB-month storage + compute hour pricing
- **Pricing page:** vercel.com/storage/postgres

---

### 5. Supabase (Auth + Database + Storage)
- **Purpose:**
  - Auth: Google OAuth and email/password sign-in
  - Database: user profiles, child profiles, voice profiles, deployment messages, puzzle history
  - Storage: voice recordings and parent photos for deployment messages
- **Pricing:** Free tier — Supabase free includes Auth + 500 MB database + 1 GB storage + 2 GB bandwidth
- **Free tier:** Unlimited monthly active users for Auth
- **Paid tier:** $25/month (Pro) if database exceeds 500 MB or bandwidth exceeds 2 GB
- **Status:** ✅ LIVE — Google OAuth working · email/password added June 3
- **⚠️ STORAGE NOTE:** Voice recordings (webm ~500KB each) + photos (~200KB) = ~700KB per parent voice setup. At 1,000 voice users = ~700 MB — approaches the 1 GB free tier limit.
- **Cost at 1,000 voice users:** Supabase Pro at $25/mo covers up to 100 GB storage.

| Users/month | Auth + DB | Storage (if voice enabled) | Total |
|---|---|---|---|
| 100 | $0 | ~70 MB ✅ | $0 |
| 1,000 | $0–$25 | ~700 MB ✅ (free tier) | $0–$25 |
| 10,000 | $25 | ~7 GB → $0.02/GB | ~$35 |

- **Pricing page:** supabase.com/pricing

---

### 6. Google Analytics 4 (GA4)
- **Purpose:** Visitor tracking, custom event analytics (puzzle_generated, puzzle_completed, puzzle_shared, hint_used, show_answer_clicked, feedback_submitted)
- **Pricing:** FREE — always free, no billing tier
- **Limits:** None for standard reporting (up to 2M events/day)
- **Status:** ✅ LIVE — Measurement ID `G-7K5D2X9XW6`
- **Pricing page:** n/a (always free)

---

### 7. Wikipedia REST API (K-2 Picture Mode)
- **Purpose:** Fetches thumbnail images for K-2 Picture Crossword Mode
- **Pricing:** FREE — no API key, no registration
- **Endpoint:** `https://en.wikipedia.org/api/rest_v1/page/summary/{word}`
- **Limitation:** Only works if the exact word has a Wikipedia article with a thumbnail
- **Pricing page:** n/a (always free)

---

### 8. Web Speech API
- **Purpose:** Text-to-speech for clue reading, vocabulary cards, celebration phrases (free users)
- **Pricing:** FREE — browser built-in, no external calls
- **Availability:** All modern browsers on iOS, Android, Windows, Mac

---

### 9. Web Audio API
- **Purpose:** Celebration sounds (word complete, puzzle win)
- **Pricing:** FREE — browser built-in

---

### 10. Google Fonts
- **Purpose:** Playfair Display and Lora typefaces
- **Pricing:** FREE — always free
- **CDN:** fonts.googleapis.com + fonts.gstatic.com

---

### 11. YouTube Caption Parser
- **Purpose:** Extracts transcripts from YouTube URLs for puzzle generation
- **Pricing:** FREE — parses public watch page, no API key required
- **Status:** ✅ Working

---

### 12. Vimeo oEmbed
- **Purpose:** Gets title/description from Vimeo video URLs
- **Pricing:** FREE — public oEmbed endpoint
- **Status:** ✅ Working

---

### 13. PDF.js (Client-side PDF extraction)
- **Purpose:** Extracts text from uploaded PDF files entirely in the browser
- **Pricing:** FREE — open source (Apache 2.0), CDN-loaded, no server calls
- **CDN:** cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/
- **Status:** ✅ Working

---

## APPROVED FOR UPCOMING WORK

### ElevenLabs (Parent Voice Cloning) — ✅ APPROVED June 3, 2026
- **Purpose:** Parent records voice sample once; all K-2 TTS uses that voice — song intros, clue previews, word celebrations, puzzle win. Premium feature for Family Plan subscribers only.
- **API keys required (Vercel env vars — server-side only, never VITE_ prefixed):**
  - `ELEVENLABS_API_KEY` — from elevenlabs.io dashboard
  - `SUPABASE_URL` — Supabase project URL (for audio cache)
  - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (NOT anon key — needs storage write access)
- **Plan:** Creator — $22/month
- **Creator plan includes:** 100K characters/month, Instant Voice Cloning, unlimited voice profiles
- **Cost control — audio caching implemented:**
  Each unique (voiceId + text) pair is synthesized ONCE, stored in `voice-recordings-private` bucket at `voices-cache/{voiceId}/{hash}.mp3`, and served from cache on every repeat play. Celebration phrases and song clue previews are identical every session — 95%+ of calls hit cache after the first session.
  - **Without caching:** ~600 chars/session × 3/day × 1 family = 54K chars/month (unsustainable)
  - **With caching:** ~600 chars first-ever session per voice, ~0 ongoing for repeated phrases
- **Free tier users:** Fall back to Web Speech API automatically — no ElevenLabs cost ever
- **Setup:** Bob signs up at elevenlabs.io → Creator plan → API key named "StoryClue" → add to Vercel as `ELEVENLABS_API_KEY`. Also add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Supabase project Settings → API.

| Users with voice enabled | Est. chars/month (with caching) | Plan needed | Cost |
|---|---|---|---|
| 1–50 families | ~5K chars after first week | Creator | $22/mo |
| 50–200 families | ~20K chars | Creator | $22/mo |
| 200–500 families | ~50K chars | Creator | $22/mo |
| 500+ families | ~100K+ chars | Creator/Pro | $22–$99/mo |

> **Note:** Only Family Plan subscribers ($9.99/mo) get voice cloning. 3 paying subscribers cover the $22/mo Creator plan. Voice feature is self-funding from the first few subscribers.

- **Pricing page:** elevenlabs.io/pricing

---

## FLAGGED — REQUIRES BOB'S APPROVAL BEFORE USE

### OpenAI Whisper API (audio file upload)
- **Purpose:** Transcribe uploaded .mp3 / .m4a audio files
- **Pricing:** $0.006 per minute of audio
- **Free alternative first:** Web Speech API handles live microphone (free). Whisper only needed for pre-recorded file uploads.
- **Cost estimate:** Low — see below.

| Users/month | Audio uploads (5%) | Minutes | Est. cost |
|---|---|---|---|
| 100 | 5 | 25 min | ~$0.15 ✅ |
| 1,000 | 50 | 250 min | ~$1.50 ✅ |
| 10,000 | 500 | 2,500 min | ~$15 ✅ |

- **Pricing page:** openai.com/pricing

---

### Stripe (Payments — Upcoming)
- **Purpose:** Subscription billing for Homeschool/Teacher/Co-op/Family plans
- **Pricing:** 2.9% + $0.30 per transaction
- **Free tier:** No monthly fee — pay per transaction only
- **Status:** Not yet integrated — Stripe connects in next build phase
- **Pricing page:** stripe.com/pricing

---

## REMOVED / SUPERSEDED

### Google Cloud Text-to-Speech
- **Status:** ❌ Removed. Web Speech API replaced it at zero cost.
- **Do not re-add** without Bob's explicit approval.

### Clerk (Teacher Accounts)
- **Status:** ❌ Superseded by Supabase Auth. Supabase handles both auth and database in one free-tier service.
- **Do not add Clerk** without Bob's explicit approval.

---

## TOTAL ESTIMATED MONTHLY COST

| Users/month | Anthropic | Vercel | Supabase | ElevenLabs | Total |
|---|---|---|---|---|---|
| 100 | ~$4 | $0 | $0 | $22* | **~$26** ✅ |
| 1,000 | ~$40 | $20 (Pro) | $0–$25 | $22* | **~$82–$107** 🔴 |
| 2,500 | ~$100 | $20 (Pro) | $25 | $22–$99* | **~$167–$244** 🔴 |
| 10,000 | ~$400 | $20 (Pro) | $35 | $99–$330* | **~$554–$785** 🔴 |

*ElevenLabs cost is flat if caching is effective. Actual cost depends on new unique phrases per month.

> **⚠️ COST ALERT:** Monthly costs exceed $50 at approximately **1,000 users** once Vercel Pro and ElevenLabs are active. Stripe subscriptions must be live before this scale. Target: 100 paying subscribers at $7.99–$9.99/mo = ~$800–$1,000/mo revenue covers all costs.
