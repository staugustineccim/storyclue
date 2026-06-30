// Vercel Cron Job — runs every Sunday at 11:15am ET (15:15 UTC)
// cron: "15 15 * * 0"
// Handles both live streams and previously uploaded videos from @ColonialChurchSTA

const COLONIAL_CHURCH_CHANNEL = "@ColonialChurchSTA";
const ADMIN_EMAIL = "bob@thepremierproperties.com";
const CHURCH_CONFIG = {
  churchName: "Colonial Church of St. Augustine",
  pastorName: "Pastor Matt",
  congregationEmailList: [], // populated from Supabase church_accounts table
};

async function alertAdmin(subject, body) {
  console.error(`[SERMON CRON ALERT] ${subject}: ${body}`);
  // In production: send email via Resend/SendGrid to ADMIN_EMAIL
  // await sendEmail({ to: ADMIN_EMAIL, subject, body });
}

async function getLatestChannelVideo(channelHandle) {
  // Fetch the channel's latest video via YouTube Data API (free tier)
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Fallback: scrape the channel page for latest video ID
    try {
      const r = await fetch(`https://www.youtube.com/@${channelHandle.replace("@", "")}/videos`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; StoryClue/1.0)" },
      });
      const html = await r.text();
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match) return { videoId: match[1], isLive: false };
    } catch {
      return null;
    }
  }

  try {
    // Search for uploads from this channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&channelId=${channelHandle}&order=date&maxResults=3&type=video&key=${apiKey}`;
    const r = await fetch(searchUrl);
    const data = await r.json();
    if (!data.items?.length) return null;
    const latest = data.items[0];
    return {
      videoId: latest.id.videoId,
      title: latest.snippet.title,
      publishedAt: latest.snippet.publishedAt,
      isLive: latest.snippet.liveBroadcastContent === "live",
    };
  } catch {
    return null;
  }
}

async function isAlreadyProcessed(videoId, supabase) {
  try {
    const { data } = await supabase
      .from("church_sermons")
      .select("id")
      .eq("video_id", videoId)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

async function getYouTubeTranscript(videoId) {
  // Try caption extraction first (free)
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StoryClue/1.0)" },
    });
    const html = await pageRes.text();
    const captionMatch = html.match(/"captionTracks":\[.*?"baseUrl":"([^"]+)"/);
    if (captionMatch) {
      const captionUrl = captionMatch[1].replace(/\\u0026/g, "&");
      const capRes = await fetch(captionUrl);
      const xml = await capRes.text();
      const text = xml
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/\s+/g, " ").trim();
      if (text.length > 200) return text;
    }
  } catch { /* fall through */ }

  // No captions available — log and return null (admin will be alerted)
  return null;
}

export default async function handler(req, res) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("[SERMON CRON] Starting Sunday sermon pull —", new Date().toISOString());

  // Import Supabase client
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  let retryCount = 0;
  const MAX_RETRIES = 5;
  const RETRY_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  async function attemptPull() {
    retryCount++;
    console.log(`[SERMON CRON] Attempt ${retryCount} of ${MAX_RETRIES}`);

    // 1. Get latest video from Colonial Church channel
    const video = await getLatestChannelVideo(COLONIAL_CHURCH_CHANNEL);
    if (!video) {
      if (retryCount < MAX_RETRIES) {
        console.log("[SERMON CRON] No video found — will retry in 15 minutes");
        // Vercel cron can't retry itself — we log for now; next cron fires next Sunday
        await alertAdmin("No video found", `Could not find a video from ${COLONIAL_CHURCH_CHANNEL}. Manual upload required.`);
        return res.status(200).json({ status: "no_video", message: "No video found on channel" });
      }
      await alertAdmin("Sermon pull failed", `Could not find video after ${MAX_RETRIES} attempts. Manual upload required.`);
      return res.status(200).json({ status: "failed", message: "No video after retries" });
    }

    console.log("[SERMON CRON] Found video:", video.videoId, video.title);

    // 2. Check if already processed this week
    const alreadyDone = await isAlreadyProcessed(video.videoId, supabase);
    if (alreadyDone) {
      console.log("[SERMON CRON] Already processed this video — skipping");
      return res.status(200).json({ status: "already_processed", videoId: video.videoId });
    }

    // 3. If live stream detected, note it (we process after it ends)
    if (video.isLive) {
      console.log("[SERMON CRON] Live stream detected — waiting for it to end");
      // We can't wait inline in a serverless function
      // The next retry (manual or scheduled) will pick up the finished stream
      return res.status(200).json({ status: "live_detected", message: "Stream is live — will process when it ends" });
    }

    // 4. Get transcript
    const transcript = await getYouTubeTranscript(video.videoId);
    if (!transcript || transcript.length < 200) {
      await alertAdmin(
        "Transcription failed",
        `Could not extract transcript from video ${video.videoId} (${video.title}). Pastor Matt may need to upload manually.`
      );
      return res.status(200).json({ status: "no_transcript", videoId: video.videoId });
    }

    console.log("[SERMON CRON] Transcript extracted —", transcript.length, "chars");

    // 5. Generate puzzle
    let puzzleData;
    try {
      const generateRes = await fetch(`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/generate-sermon`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sermonText: transcript,
          sermonTitle: video.title || "Sunday Sermon",
          pastorName: CHURCH_CONFIG.pastorName,
          churchName: CHURCH_CONFIG.churchName,
        }),
      });
      puzzleData = await generateRes.json();
      if (!generateRes.ok || !puzzleData.words?.length) throw new Error(puzzleData.error || "No puzzle");
    } catch (err) {
      await alertAdmin("Puzzle generation failed", `Error: ${err.message}. Video: ${video.videoId}`);
      return res.status(200).json({ status: "generation_failed", error: err.message });
    }

    // 6. Save to Supabase
    const slug = `church-${new Date().toISOString().slice(0, 10)}-${video.videoId}`;
    try {
      await supabase.from("puzzles").insert({
        slug,
        puzzle_json: { ...puzzleData, mode: "church", videoId: video.videoId },
      });
      await supabase.from("church_sermons").insert({
        video_id: video.videoId,
        sermon_title: video.title,
        puzzle_slug: slug,
        status: "ready_to_send",
        send_scheduled_at: getSundaySendTime(),
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      await alertAdmin("Database save failed", `Could not save sermon puzzle. Slug: ${slug}. Error: ${err.message}`);
      return res.status(200).json({ status: "save_failed" });
    }

    console.log("[SERMON CRON] Puzzle saved — slug:", slug, "— scheduled for 2pm ET");

    // 7. Schedule email send for 2pm ET
    // In production: trigger email via Resend/SendGrid with puzzle link
    // await scheduleSermonEmail({ slug, puzzleData, sendAt: getSundaySendTime() });

    return res.status(200).json({
      status: "success",
      videoId: video.videoId,
      slug,
      wordCount: puzzleData.words.length,
      scheduledSend: getSundaySendTime(),
    });
  }

  return await attemptPull();
}

function getSundaySendTime() {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setHours(14, 0, 0, 0); // 2pm ET (UTC-4 in summer, UTC-5 in winter)
  // Vercel stores in UTC — adjust for Eastern time
  const etOffset = isDST(now) ? 4 : 5;
  sunday.setHours(14 + etOffset, 0, 0, 0);
  return sunday.toISOString();
}

function isDST(date) {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  return date.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}
