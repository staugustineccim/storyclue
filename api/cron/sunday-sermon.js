// Runs every Sunday at 1pm ET via Vercel cron
// For each church account: finds the sermon video posted near service time,
// fetches captions, generates puzzle, emails pastor the puzzle link.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── YouTube RSS — no API key needed ──────────────────────────────────────────
async function getChannelIdFromUrl(channelUrl) {
  // Handle @handle format — fetch the channel page and extract channel ID
  if (channelUrl.includes("/@")) {
    const res = await fetch(channelUrl);
    const html = await res.text();
    const match = html.match(/"channelId":"(UC[^"]+)"/);
    return match ? match[1] : null;
  }
  // Handle /channel/UC... format
  const match = channelUrl.match(/\/channel\/(UC[^/?]+)/);
  return match ? match[1] : null;
}

async function getRecentVideos(channelId) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(rssUrl);
  const xml = await res.text();

  // Parse entries from RSS XML
  const entries = [];
  const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
  for (const m of entryMatches) {
    const entry = m[1];
    const idMatch    = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const pubMatch   = entry.match(/<published>([^<]+)<\/published>/);
    if (idMatch && titleMatch && pubMatch) {
      entries.push({
        videoId:   idMatch[1],
        title:     titleMatch[1],
        published: new Date(pubMatch[1]),
      });
    }
  }
  return entries;
}

function findSermonVideo(videos, serviceTime, sunday) {
  // serviceTime is "10:00" — find video published within 3 hours after that on sunday
  const [hour, min] = serviceTime.split(":").map(Number);
  const windowStart = new Date(sunday);
  windowStart.setHours(hour, min, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setHours(windowStart.getHours() + 3);

  return videos.filter(v => v.published >= windowStart && v.published <= windowEnd);
}

// ── Transcribe sermon via Supadata (captions + AI fallback) ──────────────────
async function fetchTranscript(videoId) {
  const res = await fetch(`https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "x-api-key": process.env.SUPADATA_API_KEY },
  });
  const data = await res.json();
  if (!data || data.error) throw new Error(`Supadata error: ${JSON.stringify(data)}`);
  if (typeof data.content === "string") return data.content;
  if (Array.isArray(data.content)) return data.content.map(c => c.text || c).join(" ");
  if (data.transcript) return data.transcript;
  throw new Error(`Supadata unexpected response: ${JSON.stringify(data)}`);
}

// ── Generate puzzle from sermon text ─────────────────────────────────────────
async function generateSermonPuzzle(sermonText, sermonTitle, churchName, pastorName) {
  const prompt = `You are creating a crossword puzzle from a church sermon to help the congregation remember what they heard today.

Sermon title: "${sermonTitle}"
Church: ${churchName}
Pastor: ${pastorName}

Full sermon transcript:
${sermonText.slice(0, 6000)}

Your job is to identify the pastor's MAIN POINTS and KEY ILLUSTRATIONS — the things they repeated, emphasized, or built their outline around. These become the crossword words.

Look for:
1. The numbered or named points the pastor walked through (e.g. "Point 1: Community", "Point 2: Experience")
2. Key scripture words or names the pastor kept returning to
3. Memorable illustrations or stories the pastor used (the object, person, or concept at the center of each story)
4. Words or phrases the pastor asked the congregation to repeat out loud
5. The central challenge or call to action at the end

Rules:
- Every word must connect directly to something the pastor actually said
- Clues must reference the specific story or point from THIS sermon, not generic definitions
- Words must be single words, all caps, 3-15 letters, no spaces
- 15-20 words total
- Clues written at a conversational adult level — like you're reminding a friend what the pastor said

Return ONLY valid JSON in this exact format:
{
  "title": "${sermonTitle} — Sermon Crossword",
  "words": [
    {"word": "WORD", "clue": "Clue referencing the specific story or point from the sermon"}
  ]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1500, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
}

// ── Send email via Resend (free tier: 3000/month) ────────────────────────────
async function emailPastor(toEmail, pastorName, puzzleUrl, sermonTitle) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Church] Would email ${toEmail} with puzzle: ${puzzleUrl}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "StoryClue <puzzles@storyclue.ai>",
      to: toEmail,
      subject: `Your Sunday Crossword is Ready — ${sermonTitle}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#faf7f0">
          <h1 style="font-family:serif;color:#2D5A1A;font-size:24px;margin-bottom:8px">Your Sermon Crossword is Ready</h1>
          <p style="color:#5a4a28;font-size:16px;line-height:1.6">Pastor ${pastorName},</p>
          <p style="color:#5a4a28;font-size:16px;line-height:1.6">We built a crossword from today's sermon: <strong>${sermonTitle}</strong></p>
          <div style="text-align:center;margin:32px 0">
            <a href="${puzzleUrl}" style="background:#2D5A1A;color:#F4EFE4;padding:16px 32px;border-radius:6px;text-decoration:none;font-family:serif;font-weight:bold;font-size:18px">
              View Your Puzzle →
            </a>
          </div>
          <p style="color:#8a7a5a;font-size:14px;line-height:1.6">
            Forward this link to your congregation however you normally reach them — email, church bulletin, or text message.
          </p>
          <hr style="border:1px solid #e0d8c8;margin:24px 0">
          <p style="color:#8a7a5a;font-size:12px;text-align:center">StoryClue · storyclue.ai</p>
        </div>
      `,
    }),
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Protect cron endpoint
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const today = new Date();
  const results = [];

  // Load all church accounts with YouTube channels
  const { data: churches, error } = await supabase
    .from("church_accounts")
    .select("*")
    .not("youtube_channel", "is", null);

  if (error) return res.status(500).json({ error: error.message });

  for (const church of churches) {
    try {
      // Get YouTube channel ID
      const channelId = await getChannelIdFromUrl(church.youtube_channel);
      if (!channelId) { results.push({ church: church.church_name, status: "no channel ID" }); continue; }

      // Get recent videos
      const videos = await getRecentVideos(channelId);

      // Find sermon video near service time
      const matches = findSermonVideo(videos, church.service_time || "10:00", today);
      if (matches.length === 0) { results.push({ church: church.church_name, status: "no video found in window" }); continue; }
      if (matches.length > 1)   { results.push({ church: church.church_name, status: "multiple videos found — pastor notified" }); continue; }

      const sermon = matches[0];

      // Check if we already processed this video
      const { data: existing } = await supabase
        .from("church_sermons")
        .select("id")
        .eq("church_account_id", church.id)
        .eq("video_id", sermon.videoId)
        .single();
      if (existing) { results.push({ church: church.church_name, status: "already processed" }); continue; }

      // Transcribe sermon via AssemblyAI
      const transcript = await fetchTranscript(sermon.videoId);
      if (!transcript) { results.push({ church: church.church_name, status: "transcription failed" }); continue; }

      // Generate puzzle
      const puzzleData = await generateSermonPuzzle(transcript, sermon.title, church.church_name, church.pastor_name);

      // Save puzzle via existing save-puzzle API
      const slug = `${sermon.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)}-sermon-${Date.now()}`;
      const saveRes = await fetch(`${process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000"}/api/save-puzzle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title: puzzleData.title, words: puzzleData.words, grade: "adult", source: "church" }),
      });

      const puzzleUrl = `https://storyclue.ai/play/${slug}`;

      // Save sermon record
      await supabase.from("church_sermons").insert({
        church_account_id: church.id,
        video_id: sermon.videoId,
        sermon_title: sermon.title,
        puzzle_slug: slug,
        status: "sent",
      });

      // Email pastor
      await emailPastor(church.sender_email, church.pastor_name, puzzleUrl, sermon.title);

      results.push({ church: church.church_name, status: "puzzle sent", puzzleUrl });

    } catch (err) {
      console.error(`[Church] Error for ${church.church_name}:`, err);
      results.push({ church: church.church_name, status: "error", error: err.message });
    }
  }

  return res.status(200).json({ processed: churches.length, results });
}
