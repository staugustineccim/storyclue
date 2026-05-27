# StoryClue — Services & Cost Registry

Last updated: May 2026
Rule: Never add a paid service without Bob's explicit approval.
Rule: Always try free alternatives first.
Rule: Flag any usage-based service with cost estimates at 100 / 1,000 / 10,000 users.
Rule: Alert Bob if total estimated monthly cost exceeds $50.

---

## CURRENTLY IN USE

### 1. Anthropic API (Claude)
- **Purpose:** Puzzle generation, content safety check, version detection, clue simplification, vocabulary context sentences
- **Model:** claude-sonnet-4-6
- **Pricing:** ~$3.00 / million input tokens · ~$15.00 / million output tokens · cached input ~$0.30/M
- **Free tier:** None — pay per token from first request
- **Cost per puzzle generation (full session):**
  - Generate: ~$0.011
  - Safety check (avg — faith fast-pass skips Claude call 50% of the time): ~$0.002
  - Version check (lookup mode): ~$0.007
  - Subtotal per puzzle: **~$0.020**
- **⚠️ USAGE-BASED COST ESTIMATES:**

| Users/month | Puzzles (avg 2/user) | Est. monthly cost |
|---|---|---|
| 100 | 200 | ~$4 ✅ |
| 1,000 | 2,000 | ~$40 ✅ |
| 2,500 | 5,000 | ~$100 🔴 EXCEEDS $50 |
| 10,000 | 20,000 | ~$400 🔴 |

> **⚠️ ALERT:** Anthropic API costs will exceed $50/month at approximately **2,500 active users** generating 2 puzzles each. Bob must approve a monetization strategy or usage cap before reaching this scale.

---

### 2. Vercel (Hosting + Serverless Functions)
- **Purpose:** Hosts the React app and all `/api/*` serverless functions
- **Current plan:** Hobby (Free)
- **Free tier limits:**
  - 100 GB bandwidth/month
  - 100,000 serverless function invocations/month
  - 12 functions maximum
  - No team features
- **Pro plan:** $20/month — removes function limit, adds team collaboration, more bandwidth
- **Current function count:** 11 of 12 allowed
- **⚠️ NOTE:** One more API function will hit the Hobby plan limit. Pro plan ($20/month) needed before next API addition.

---

### 3. Vercel KV (Redis)
- **Purpose:** Stores feedback submissions, logs blocked safety attempts
- **Pricing:** Free tier
- **Free tier:** 30 MB storage · 30,000 requests/day · 1 database
- **Current usage:** Very low — feedback records + occasional safety blocks
- **Paid tier:** $20/month for 1 GB + 1M requests/day (not needed yet)

---

### 4. Vercel Postgres (Supabase-compatible)
- **Purpose:** Stores all puzzles (permanent slug URLs) and analytics events table
- **Pricing:** Free tier
- **Free tier:** 60 compute hours/month · 256 MB storage · 1 database
- **Current usage:** Growing — every puzzle saved, every analytics event logged
- **⚠️ WATCH:** At scale, the events table will grow quickly. At 10,000 users × 10 events each = 100,000 rows/month. 256 MB may fill in 6–12 months. Paid tier ($0.10/compute hour) needed at scale.
- **Paid tier:** $0.10/GB-month storage · compute hour pricing

---

### 5. Google Analytics 4 (GA4)
- **Purpose:** Visitor tracking, custom event analytics
- **Pricing:** FREE — always free, no billing tier, no credit card ever required
- **Limits:** None for standard reporting (up to 2M events/day free)
- **Status:** ✅ LIVE — Measurement ID `G-7K5D2X9XW6` active in index.html
- **BigQuery export:** Has a paid tier but is opt-in — default GA4 never charges.

---

### 6. Supabase Auth
- **Purpose:** Google Sign-In for user accounts (puzzle history, founding member discount, future Stripe billing)
- **Pricing:** FREE — Supabase free tier includes authentication with unlimited MAU
- **Free tier:** Unlimited monthly active users for Auth · 500 MB database · 2 GB bandwidth
- **Paid tier:** $25/month (Pro) if database exceeds 500 MB or bandwidth exceeds 2 GB
- **Status:** ✅ CODE COMPLETE — waiting for Bob to create Supabase project and add env vars to Vercel
- **Setup checklist** (one-time, ~15 minutes):
  1. Create free project at supabase.com
  2. Dashboard → Authentication → Providers → Google → Enable
  3. Add Google OAuth credentials from console.cloud.google.com
  4. Dashboard → Settings → API → copy Project URL and anon public key
  5. Vercel → StoryClue → Settings → Environment Variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  6. Redeploy
- **Graceful degradation:** Auth silently disabled when env vars not set. App works exactly as before.
- **Pricing page:** supabase.com/pricing

---

### 8. Wikipedia REST API
- **Purpose:** Fetches thumbnail images for K-2 Picture Mode
- **Pricing:** FREE — no API key, no registration, no rate limits (informal limits at high volume)
- **Endpoint:** `https://en.wikipedia.org/api/rest_v1/page/summary/{word}`
- **Limitation:** Only returns an image if the exact word has a Wikipedia article with a thumbnail. Abstract words (RUN, LOVE, SAFE) often return no image.
- **Current status:** ⚠️ IMAGES NOT RELIABLY SHOWING — see Priority Fix 1

---

### 9. Web Speech API
- **Purpose:** Text-to-speech for clue reading, vocabulary cards, celebration phrases
- **Pricing:** FREE — browser built-in, no external calls
- **Availability:** All modern browsers on iOS, Android, Windows, Mac

---

### 10. Web Audio API
- **Purpose:** Celebration sounds (word complete, puzzle win) — no external files
- **Pricing:** FREE — browser built-in

---

### 11. Google Fonts
- **Purpose:** Playfair Display and Lora typefaces throughout the app
- **Pricing:** FREE — always free, no limits
- **CDN:** fonts.googleapis.com + fonts.gstatic.com

---

### 12. YouTube oEmbed + Watch Page Parsing
- **Purpose:** Extracts captions/transcripts from YouTube URLs
- **Pricing:** FREE — no API key required
- **Method:** Fetches public watch page HTML, parses `ytInitialPlayerResponse` for caption tracks
- **Limitation:** Private/age-restricted videos have no accessible captions
- **Status:** ✅ Working

---

### 13. Vimeo oEmbed
- **Purpose:** Gets title and description from Vimeo video URLs
- **Pricing:** FREE — public oEmbed endpoint, no key required
- **Status:** ✅ Working

---

## APPROVED FOR UPCOMING WORK

### PDF.js (for PDF upload — Tier 1)
- **Purpose:** Extract text from uploaded PDF files entirely in the browser
- **Pricing:** FREE — open source (Apache 2.0), no API calls, runs client-side
- **Approval needed:** None — free library
- **Status:** Not yet installed

---

## FLAGGED — REQUIRES BOB'S APPROVAL BEFORE USE

### OpenAI Whisper API (for audio file upload — Tier 2)
- **Purpose:** Transcribe uploaded .mp3 / .m4a / .wav audio files
- **Pricing:** $0.006 per minute of audio
- **Free alternative tried first:** Web Speech API handles live microphone recording for free. Whisper is only needed for pre-recorded audio file uploads.
- **⚠️ USAGE-BASED COST ESTIMATES** (assuming 5% of users upload audio, avg 5 min):

| Users/month | Audio uploads (5%) | Minutes | Est. cost |
|---|---|---|---|
| 100 | 5 | 25 min | ~$0.15 ✅ |
| 1,000 | 50 | 250 min | ~$1.50 ✅ |
| 10,000 | 500 | 2,500 min | ~$15 ✅ |

> Low cost even at scale. Recommend approving when audio upload feature is built.

---

### Google Cloud Text-to-Speech (NOT in use — removed)
- **Status:** ❌ Removed. Web Speech API replaced it with zero cost and no API key requirement.
- **Do not re-add** without Bob's explicit approval.

---

### ElevenLabs (Parent Voice Cloning)
- **Purpose:** Let a parent record their own voice once; all K-2 TTS would use that voice. Massively increases engagement for children who respond to parent's voice.
- **Pricing:** Starter $5/month per workspace · Creator $22/month · up to 192,000 characters/month on Starter
- **Free alternative:** Web Speech API (already in use) — free but uses system voices, not parent voice
- **⚠️ PAID SERVICE — REQUIRES BOB'S EXPLICIT APPROVAL BEFORE IMPLEMENTATION**
- **Note:** This is a V2 feature per product roadmap. Do NOT implement until Bob approves cost and user UX is designed.
- **Pricing page:** elevenlabs.io/pricing

---

### Clerk (for teacher accounts)
- **Status:** ❌ SUPERSEDED — Supabase Auth (service #6 above) was chosen instead.
  Supabase handles both authentication and database in one free-tier service. Clerk is no longer needed.
- **Do not add Clerk** without Bob's explicit approval.

---

## TOTAL CURRENT MONTHLY COST ESTIMATE

| Users/month | Anthropic API | Vercel | KV/Postgres | Total |
|---|---|---|---|---|
| 100 | ~$4 | $0 | $0 | **~$4** ✅ |
| 1,000 | ~$40 | $0 | $0 | **~$40** ✅ |
| 2,500 | ~$100 | $20 (Pro) | $0 | **~$120** 🔴 |
| 10,000 | ~$400 | $20 (Pro) | ~$20 | **~$440** 🔴 |

> **⚠️ COST ALERT:** Monthly costs exceed $50 at approximately 2,500 users. This is the point where StoryClue needs a paid subscription tier to remain sustainable. Recommend implementing Tier 3 teacher accounts (Clerk free tier covers first 10,000 users) before hitting this threshold.
