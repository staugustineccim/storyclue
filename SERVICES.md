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
- **Status:** ⚠️ CODE PRESENT BUT INACTIVE — Measurement ID is placeholder `G-XXXXXXXXXX`. Bob must create a GA4 property at analytics.google.com and replace the placeholder to activate.
- **BigQuery export:** Has a paid tier but is opt-in — default GA4 never charges.

---

### 6. Wikipedia REST API
- **Purpose:** Fetches thumbnail images for K-2 Picture Mode
- **Pricing:** FREE — no API key, no registration, no rate limits (informal limits at high volume)
- **Endpoint:** `https://en.wikipedia.org/api/rest_v1/page/summary/{word}`
- **Limitation:** Only returns an image if the exact word has a Wikipedia article with a thumbnail. Abstract words (RUN, LOVE, SAFE) often return no image.
- **Current status:** ⚠️ IMAGES NOT RELIABLY SHOWING — see Priority Fix 1

---

### 7. Web Speech API
- **Purpose:** Text-to-speech for clue reading, vocabulary cards, celebration phrases
- **Pricing:** FREE — browser built-in, no external calls
- **Availability:** All modern browsers on iOS, Android, Windows, Mac

---

### 8. Web Audio API
- **Purpose:** Celebration sounds (word complete, puzzle win) — no external files
- **Pricing:** FREE — browser built-in

---

### 9. Google Fonts
- **Purpose:** Playfair Display and Lora typefaces throughout the app
- **Pricing:** FREE — always free, no limits
- **CDN:** fonts.googleapis.com + fonts.gstatic.com

---

### 10. YouTube oEmbed + Watch Page Parsing
- **Purpose:** Extracts captions/transcripts from YouTube URLs
- **Pricing:** FREE — no API key required
- **Method:** Fetches public watch page HTML, parses `ytInitialPlayerResponse` for caption tracks
- **Limitation:** Private/age-restricted videos have no accessible captions
- **Status:** ✅ Working

---

### 11. Vimeo oEmbed
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

### Clerk (for teacher accounts — Tier 3)
- **Purpose:** User authentication for saved puzzle libraries and teacher accounts
- **Pricing:** Free up to 10,000 monthly active users (MAU)
- **Paid tier:** $25/month for up to 100,000 MAU
- **Free alternative:** Could use Vercel KV with a simple password, but no persistent accounts
- **Status:** Not started — awaiting approval to begin Tier 3 work

---

## TOTAL CURRENT MONTHLY COST ESTIMATE

| Users/month | Anthropic API | Vercel | KV/Postgres | Total |
|---|---|---|---|---|
| 100 | ~$4 | $0 | $0 | **~$4** ✅ |
| 1,000 | ~$40 | $0 | $0 | **~$40** ✅ |
| 2,500 | ~$100 | $20 (Pro) | $0 | **~$120** 🔴 |
| 10,000 | ~$400 | $20 (Pro) | ~$20 | **~$440** 🔴 |

> **⚠️ COST ALERT:** Monthly costs exceed $50 at approximately 2,500 users. This is the point where StoryClue needs a paid subscription tier to remain sustainable. Recommend implementing Tier 3 teacher accounts (Clerk free tier covers first 10,000 users) before hitting this threshold.
