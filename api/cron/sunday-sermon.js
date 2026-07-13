// Runs every Sunday at 1pm ET via Vercel cron
// For each church account: finds the sermon video posted near service time,
// fetches captions, generates puzzle, emails pastor the puzzle link.

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

// ── Transcribe sermon via AssemblyAI ─────────────────────────────────────────
async function fetchTranscript(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Submit transcription job — AssemblyAI accepts YouTube URLs directly
  const submitRes = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      "Authorization": process.env.ASSEMBLYAI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audio_url: videoUrl }),
  });
  const { id, error: submitError } = await submitRes.json();
  if (submitError) throw new Error(`AssemblyAI submit error: ${submitError}`);

  // Poll until complete (max 8 minutes — sermons are long)
  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 10000)); // wait 10s between polls
    const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { "Authorization": process.env.ASSEMBLYAI_API_KEY },
    });
    const data = await pollRes.json();
    if (data.status === "completed") return data.text;
    if (data.status === "error") throw new Error(`AssemblyAI error: ${data.error}`);
    // status is "queued" or "processing" — keep polling
  }
  throw new Error("AssemblyAI transcription timed out after 8 minutes");
}

// ── Generate puzzle from sermon text ─────────────────────────────────────────
async function generateSermonPuzzle(sermonText, sermonTitle, churchName, pastorName) {
  const prompt = `You are creating a crossword puzzle from a church sermon to help the congregation remember the key points.

Sermon title: "${sermonTitle}"
Church: ${churchName}
Pastor: ${pastorName}

Sermon transcript:
${sermonText.slice(0, 4000)}

Extract 12-16 key vocabulary words from this sermon. Focus on:
- Main theological concepts
- Key scripture references
- Central themes the pastor emphasized
- Memorable phrases or names

For each word write a clue at an 8th-9th grade level that connects directly to what the pastor said.

Return ONLY valid JSON in this exact format:
{
  "title": "${sermonTitle} — Sermon Crossword",
  "words": [
    {"word": "WORD", "clue": "Clue text connecting to the sermon"}
  ]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text;
  const json = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  return json;
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
