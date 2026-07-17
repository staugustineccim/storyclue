// Runs every Sunday at 1pm ET via Vercel cron
// Submit transcription jobs (don't wait for results)
// Uses Supabase REST API (no SDK, no WebSocket issues)

// ── YouTube RSS — no API key needed ──────────────────────────────────────────
async function getChannelIdFromUrl(channelUrl) {
  if (channelUrl.includes("/@")) {
    const res = await fetch(channelUrl);
    const html = await res.text();
    const match = html.match(/"channelId":"(UC[^"]+)"/);
    return match ? match[1] : null;
  }
  const match = channelUrl.match(/\/channel\/(UC[^/?]+)/);
  return match ? match[1] : null;
}

async function getRecentVideos(channelId) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(rssUrl);
  const xml = await res.text();

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
  const [hour, min] = serviceTime.split(":").map(Number);
  const windowStart = new Date(sunday);
  windowStart.setHours(hour, min, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setHours(windowStart.getHours() + 3);

  return videos.filter(v => v.published >= windowStart && v.published <= windowEnd);
}

// ── Transcribe sermon via Supadata (submit job, don't wait) ──────────────────
async function submitTranscriptionJob(videoId) {
  const encodedUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
  const res = await fetch(`https://api.supadata.ai/v1/transcript?url=${encodedUrl}`, {
    headers: { "x-api-key": process.env.SUPADATA_API_KEY },
  });
  const data = await res.json();
  if (!data || data.error) throw new Error(`Supadata error: ${JSON.stringify(data)}`);

  // If transcript is ready immediately (video has captions), return it
  if (typeof data.content === "string") return { transcript: data.content, jobId: null };
  if (Array.isArray(data.content)) return { transcript: data.content.map(c => c.text || c).join(" "), jobId: null };
  if (data.transcript) return { transcript: data.transcript, jobId: null };

  // Otherwise return jobId — background polling will check for completion
  if (data.jobId) {
    return { transcript: null, jobId: data.jobId };
  }

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

CRITICAL RULE: Every clue MUST quote or reference something the pastor explicitly said, a specific story they told, a specific scripture verse they cited, or a specific illustration they used. NO generic definitions. NO interpolation. NO filling in what you think the sermon meant.

Your job is to pull out words that are:
1. Directly quoted or emphasized by the pastor (words they repeated or highlighted)
2. Central to a specific story or illustration the pastor told (the object, person, concept, or action at the heart of their story)
3. Part of a specific scripture verse the pastor cited and explained
4. Part of specific action items or challenges the pastor gave
5. Key phrases the pastor used multiple times

For EACH word:
- Write the clue as: "[Pastor's name] said: [EXACT QUOTE or SPECIFIC REFERENCE to the story/verse/illustration]"
- Example GOOD clue: "Jonathan illustrated that the people around you shape what you spiritually ___ for, like culture shapes food preferences" (Answer: HUNGER)
- Example BAD clue: "The feeling of wanting something" (this is generic, banned)

Rules:
- Every word must appear in the sermon text or be a direct reference to content in the sermon
- Clues must include the pastor's name and reference something specific (a quote, story element, verse, or repeated phrase)
- Words must be single words, all caps, 3-15 letters, no spaces
- 15-20 words total
- If you cannot find specific source material for a word, DO NOT INCLUDE IT

Return ONLY valid JSON in this exact format:
{
  "title": "${sermonTitle} — Sermon Crossword",
  "words": [
    {"word": "WORD", "clue": "Specific reference to what the pastor said or the story they told"}
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

// ── Send email via Resend ────────────────────────────────────────────────────
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

// ── Supabase REST API helpers ──────────────────────────────────────────────
async function getChurches() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/church_accounts?youtube_channel=not.null`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  console.log("[Supabase] URL:", process.env.SUPABASE_URL);
  console.log("[Supabase] Key exists:", !!key, "Length:", key?.length);
  console.log("[Supabase] Key starts with:", key?.substring(0, 20));

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${key}`,
    },
  });

  console.log("[Supabase] Response status:", res.status, "StatusText:", res.statusText);
  if (!res.ok) {
    const errorBody = await res.text();
    console.log("[Supabase] Error body:", errorBody);
    throw new Error(`Supabase error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`Supabase returned non-array: ${JSON.stringify(data)}`);
  }

  return data;
}

async function getExistingSermon(churchId, videoId) {
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/church_sermons?church_account_id=eq.${churchId}&video_id=eq.${videoId}`,
    {
      headers: {
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()}`,
      },
    }
  );
  const data = await res.json();
  return data[0] || null;
}

async function createSermonRecord(churchId, videoId, title) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/church_sermons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      church_account_id: churchId,
      video_id: videoId,
      sermon_title: title,
      status: "queued",
    }),
  });
  const data = await res.json();
  return data[0] || data;
}

async function updateSermonRecord(sermonId, updates) {
  return fetch(`${process.env.SUPABASE_URL}/rest/v1/church_sermons?id=eq.${sermonId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(updates),
  });
}

// ── Send status email to Bob ────────────────────────────────────────────────
async function sendStatusEmail(results, error) {
  if (!process.env.RESEND_API_KEY) return;

  const statusHtml = error
    ? `<p style="color:red"><strong>CRON FAILED:</strong> ${error}</p>`
    : `<p style="color:green"><strong>CRON COMPLETED</strong></p>${results.map(r =>
        `<p>${r.church}: ${r.status}${r.puzzleUrl ? ` — <a href="${r.puzzleUrl}">View Puzzle</a>` : ''}${r.error ? ` — ERROR: ${r.error}` : ''}</p>`
      ).join('')}`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "StoryClue <puzzles@storyclue.ai>",
      to: "bob@thepremierproperties.com",
      subject: error ? "🚨 Church Sermon Cron Failed" : "✅ Church Sermon Cron Completed",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          ${statusHtml}
          <hr style="border:1px solid #ccc;margin:20px 0">
          <p style="color:#666;font-size:12px">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    }),
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  console.log("[Church Cron] Handler started");

  const today = new Date();
  const results = [];

  try {
    console.log("[Church Cron] Fetching churches from Supabase...");
    const churches = await getChurches();
    console.log(`[Church Cron] Found ${churches.length} churches`);

    for (const church of churches) {
      try {
        const channelId = await getChannelIdFromUrl(church.youtube_channel);
        if (!channelId) { results.push({ church: church.church_name, status: "no channel ID" }); continue; }

        const videos = await getRecentVideos(channelId);

        const matches = findSermonVideo(videos, church.service_time || "10:00", today);
        if (matches.length === 0) { results.push({ church: church.church_name, status: "no video found in window" }); continue; }
        if (matches.length > 1)   { results.push({ church: church.church_name, status: "multiple videos found — pastor notified" }); continue; }

        const sermon = matches[0];

        const existing = await getExistingSermon(church.id, sermon.videoId);
        if (existing) { results.push({ church: church.church_name, status: "already processed" }); continue; }

        // Create sermon record
        const sermonRecord = await createSermonRecord(church.id, sermon.videoId, sermon.title);
        if (!sermonRecord.id) { results.push({ church: church.church_name, status: "db error creating record" }); continue; }

        // Submit transcription job
        const transcriptionResult = await submitTranscriptionJob(sermon.videoId);

        if (transcriptionResult.transcript) {
          // Got transcript immediately (video has captions) — generate puzzle now
          const puzzleData = await generateSermonPuzzle(transcriptionResult.transcript, sermon.title, church.church_name, church.pastor_name);

          const slug = `${sermon.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)}-sermon-${Date.now()}`;
          await fetch(`${process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000"}/api/save-puzzle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, title: puzzleData.title, words: puzzleData.words, grade: "adult", source: "church" }),
          });

          const puzzleUrl = `https://storyclue.ai/play/${slug}`;

          await updateSermonRecord(sermonRecord.id, { puzzle_slug: slug, status: "sent", sent_at: new Date().toISOString() });

          await emailPastor(church.sender_email, church.pastor_name, puzzleUrl, sermon.title);

          results.push({ church: church.church_name, status: "puzzle sent (instant)", puzzleUrl });
        } else {
          // Got jobId — background polling will handle it
          await updateSermonRecord(sermonRecord.id, { job_id: transcriptionResult.jobId, status: "transcribing" });

          results.push({ church: church.church_name, status: "transcription queued (polling in background)", jobId: transcriptionResult.jobId });
        }

      } catch (err) {
        console.error(`[Church] Error for ${church.church_name}:`, err);
        results.push({ church: church.church_name, status: "error", error: err.message });
      }
    }

    await sendStatusEmail(results, null);
    return res.status(200).json({ processed: churches.length, results });

  } catch (err) {
    console.error("[Church Cron] Handler error:", err);
    await sendStatusEmail([], err.message);
    return res.status(500).json({ error: err.message });
  }
}
