# Local Faster-Whisper Setup Guide

**Goal:** Run Faster-Whisper transcription locally on your computer to transcribe YouTube sermons in minutes instead of hours.

**Architecture:**
1. Local Python service runs 24/7 on your computer
2. Every 30 seconds, it polls Supabase for sermons with status `waiting_for_captions`
3. When found, it:
   - Downloads the YouTube video with `yt-dlp`
   - Transcribes with local `faster-whisper` (CPU mode, ~2 min per hour of video)
   - POSTs transcript to `https://api.storyclue.ai/api/webhook/transcription`
   - API generates puzzle, emails pastor automatically

---

## Step 1: Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and log in
2. Select your StoryClue project
3. Go to **Settings** → **API** (left sidebar)
4. You'll see three keys:
   - **Project URL** → copy and paste as `SUPABASE_URL`
   - **anon public** → copy and paste as `SUPABASE_ANON_KEY`
   - **service_role secret** → copy and paste as `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep this secret!)

5. Copy each value into your `.env.local` file

---

## Step 2: Fill in `.env.local`

Open `C:\Users\Bob\Downloads\StoryClue\.env.local` and find these lines:

```
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
RESEND_API_KEY="YOUR_RESEND_API_KEY"
VERCEL_URL="https://storyclue.ai"
CRON_SECRET="your-secret-key"
```

Replace with real values:
- `SUPABASE_URL` from step 1
- `SUPABASE_ANON_KEY` from step 1
- `SUPABASE_SERVICE_ROLE_KEY` from step 1
- `RESEND_API_KEY` from your Resend account (or leave blank for now)
- `VERCEL_URL` is either `https://storyclue.ai` (production) or `http://localhost:3000` (local dev)
- `CRON_SECRET` is a random string like `super-secret-key-12345` (keep it consistent)

**Save the file.**

---

## Step 3: Run the Service

### Option A: Double-click (Easiest)
1. Go to `C:\Users\Bob\Downloads\StoryClue`
2. Double-click `start-transcriber.bat`
3. A terminal window opens and stays open

### Option B: PowerShell (if batch file doesn't work)
```powershell
cd "C:\Users\Bob\Downloads\StoryClue"
python transcribe_service.py
```

---

## Step 4: Test the Service

1. Let the service run for 60 seconds. You should see:
   ```
   [2026-07-19 14:30:45] Starting local Whisper transcription service
   [2026-07-19 14:30:45] Waiting for sermons to transcribe...
   [2026-07-19 14:30:45] Found 0 sermon(s) waiting for transcription
   ```

2. **To test with a real sermon:**
   - Manually insert a test sermon into Supabase with status `waiting_for_captions`
   - Or wait until Sunday when `sunday-sermon.js` cron finds a new sermon

3. **Expected output when transcribing:**
   ```
   [2026-07-19 14:31:00] Found 1 sermon(s) waiting for transcription
   [2026-07-19 14:31:00] --- Processing: "Fear Not" (dQw4w9WgXcQ) ---
   [2026-07-19 14:31:00] Downloading video dQw4w9WgXcQ...
   [2026-07-19 14:32:15] Downloaded: C:\Users\Bob\AppData\Local\Temp\storyclue_transcribe\dQw4w9WgXcQ.mp3
   [2026-07-19 14:32:15] Loading Whisper model...
   [2026-07-19 14:33:45] Transcribing ...mp3
   [2026-07-19 14:03:50] Transcription complete (45231 chars)
   [2026-07-19 14:03:51] Transcript posted to API
   [2026-07-19 14:03:51] ✓ Completed: "Fear Not"
   ```

---

## Step 5: Keep it Running

### For Development Testing
Just run `start-transcriber.bat` manually whenever you're testing.

### For Production (Always Running)
Use **Windows Task Scheduler** to auto-start the batch file at login:

1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Click **Create Task** (right sidebar)
3. **General tab:**
   - Name: `StoryClue Transcriber`
   - Select **Run whether user is logged in or not**
   - Select **Run with highest privileges**

4. **Triggers tab:**
   - Click **New**
   - Begin task: **At log on**
   - Click OK

5. **Actions tab:**
   - Click **New**
   - Action: **Start a program**
   - Program: `C:\Users\Bob\Downloads\StoryClue\start-transcriber.bat`
   - Click OK

6. **Settings tab:**
   - Check **Run task as soon as possible after a scheduled start is missed**
   - Click OK

Now the transcriber auto-starts when you log in.

---

## Step 6: Monitor and Debug

### Check logs
The service prints to console. Keep a terminal window open to see what's happening.

### Common Issues

**"SUPABASE_URL not set"**
- Make sure you filled in `.env.local` with real Supabase URL
- Make sure `.env.local` is in `C:\Users\Bob\Downloads\StoryClue`

**"yt-dlp: command not found"**
- Your Python isn't on PATH yet
- Try: `python -m pip install --upgrade yt-dlp`

**"Transcription failed"**
- The audio file may be corrupted or very long
- Check the downloaded .mp3 file in `C:\Users\Bob\AppData\Local\Temp\storyclue_transcribe\`

**"Transcript posted to API" but no puzzle email**
- The webhook endpoint at `api/webhook/transcription.js` may not exist or may have an error
- Check your API server logs on Vercel

---

## How It Integrates with Your System

### Sunday Flow (Fully Automatic):
1. **12:20 PM** — `sunday-sermon.js` cron finds new sermon video
2. **12:21 PM** — Tries Supadata → YouTube captions
3. **12:22 PM** — Both fail, sets status to `waiting_for_captions`
4. **Meanwhile...** — Your local transcriber service wakes up
5. **12:35 PM** — Your computer downloads YouTube video, transcribes with Whisper
6. **1:10 PM** — Webhook posts transcript to API
7. **1:11 PM** — Puzzle generated, pastor gets email with crossword link
8. **Pastor** — Can share puzzle with congregation immediately (while they still remember the sermon!)

### Why This Beats the Alternatives:
- **YouTube captions:** 5+ hours, unpredictable
- **Supadata:** $$$, and flags recent livestreams as "still live"
- **AssemblyAI:** $$$ + received HTML instead of video
- **Local Whisper:** FREE, runs on your computer, 2 min per hour of video

---

## Next Steps

1. Fill in `.env.local` with your Supabase credentials
2. Run `start-transcriber.bat`
3. Wait for next Sunday (or create a test sermon manually in Supabase)
4. Verify the puzzle email arrives within 2-3 minutes
5. Set up Windows Task Scheduler for auto-startup if you're happy

---

## Questions?

- Check `transcribe_service.py` console output for detailed logs
- Verify `.env.local` has correct Supabase URL and service role key
- Make sure `api/webhook/transcription.js` is deployed to your API server

Good luck! 🚀
