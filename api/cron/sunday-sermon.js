// Runs every Monday at noon ET via Vercel cron (schedule: "0 16 * * 1")
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

// Get the newest (most recent) video from channel
async function getNewestVideo(channelId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not set");

  const url = `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&order=date&part=snippet&key=${apiKey}&maxResults=1`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.items || !data.items[0]) return null;

  const item = data.items[0];
  if (!item.id.videoId) return null;

  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    published: new Date(item.snippet.publishedAt),
  };
}

// ── Fetch YouTube captions (free, no API key needed) ─────────────────────────
async function getYouTubeCaptions(videoId) {
  try {
    console.log(`[Church] Checking for YouTube auto-captions on video ${videoId}...`);
    const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
    const res = await fetch(captionUrl);

    if (!res.ok) {
      console.log(`[Church] No captions found (HTTP ${res.status})`);
      return null;
    }

    const text = await res.text();

    // YouTube timedtext returns XML, extract text content
    const textMatches = text.match(/<text[^>]*>([^<]+)<\/text>/g);
    if (!textMatches || textMatches.length === 0) {
      console.log(`[Church] Caption XML found but no text content`);
      return null;
    }

    // Extract and decode text from XML
    const captions = textMatches
      .map(match => {
        const textContent = match.match(/<text[^>]*>([^<]+)<\/text>/)[1];
        // Decode HTML entities
        return textContent
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/<[^>]+>/g, ""); // Remove any remaining XML tags
      })
      .join(" ")
      .trim();

    if (captions.length < 100) {
      console.log(`[Church] Captions too short (${captions.length} chars), likely not ready yet`);
      return null;
    }

    console.log(`[Church] Got YouTube captions (${captions.length} characters)`);
    return captions;
  } catch (err) {
    console.log(`[Church] Error fetching YouTube captions:`, err.message);
    return null;
  }
}

// ── Transcribe sermon via Supadata (submit job, don't wait) ──────────────────
async function submitSupadataJob(videoId) {
  const encodedUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
  const res = await fetch(`https://api.supadata.ai/v1/transcript?url=${encodedUrl}`, {
    headers: { "x-api-key": process.env.SUPADATA_API_KEY },
  });
  const data = await res.json();
  if (!data || data.error) throw new Error(`Supadata error: ${JSON.stringify(data)}`);

  // If transcript is ready immediately (video has captions), return it
  if (typeof data.content === "string") return { transcript: data.content, jobId: null, service: "supadata" };
  if (Array.isArray(data.content)) return { transcript: data.content.map(c => c.text || c).join(" "), jobId: null, service: "supadata" };
  if (data.transcript) return { transcript: data.transcript, jobId: null, service: "supadata" };

  // Otherwise return jobId — background polling will check for completion
  if (data.jobId) {
    return { transcript: null, jobId: data.jobId, service: "supadata" };
  }

  throw new Error(`Supadata unexpected response: ${JSON.stringify(data)}`);
}

// ── Submit transcription: YouTube captions first, skip Whisper ────────────────
async function submitTranscriptionJob(videoId) {
  // STEP 1: Try YouTube captions first (free, no quota)
  const captions = await getYouTubeCaptions(videoId);
  if (captions) {
    return { transcript: captions, jobId: null, service: "youtube_captions" };
  }

  // STEP 2: If no captions, don't use Supadata — wait for captions to be ready
  console.log(`[Church] No YouTube captions available yet. Will retry tomorrow.`);
  throw new Error("No captions found - will retry when YouTube captions are ready");
}

// ── Extract pastor's main points as direct quotes from transcript ─────────────
async function extractPastorMainPoints(sermonText) {
  const prompt = `Extract the pastor's main teaching points as DIRECT QUOTES from this sermon transcript.

Transcript:
${sermonText}

STEP 1: Search the transcript for EXPLICIT VERBAL MARKERS where the pastor states main points:
- Look for: "point #1", "point #2", "point #3", etc.
- Look for: "first point", "second point", "third point", etc.
- Look for: "my first point is", "my second point is", etc.
- Look for: "here's point #1", "here's my first point", etc.
- These are EXPLICIT statements the pastor makes — extract them exactly

STEP 2: For EACH main point (identified by these markers), extract the EXACT QUOTE from the transcript
- Include the pastor's own words explaining that point
- Quote from where he states it through his explanation of it

STEP 3: For EACH main point quote, identify which scripture(s) support/back it up

Return ONLY valid JSON, no other text:
{
  "mainPoints": [
    {
      "quote": "Exact quote from pastor starting with the point marker",
      "supportingScriptures": ["John 14:16", "John 14:26"]
    }
  ]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await response.json();
  const text = data.content[0].text;
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("No JSON found in response");
    }
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("[Claude] Failed to extract main points:", err.message);
    return { mainPoints: [] };
  }
}

// ── Generate puzzle from sermon text ─────────────────────────────────────────
async function generateSermonPuzzle(sermonText, sermonTitle, churchName, pastorName, providedMainPoints = null) {
  let mainPointQuotes = [];

  if (providedMainPoints && Array.isArray(providedMainPoints) && providedMainPoints.length > 0) {
    // Use provided main points (user has already extracted them)
    console.log(`[Church] Using provided main points (${providedMainPoints.length} points)`);
    mainPointQuotes = providedMainPoints;
  } else {
    // Fall back to auto-extraction if no main points provided
    console.log(`[Church] Extracting pastor's main points from transcript...`);
    const pointsData = await extractPastorMainPoints(sermonText);
    mainPointQuotes = pointsData.mainPoints || [];
  }

  console.log(`[Church] Working with ${mainPointQuotes.length} main points`);

  // Build the main points list for Claude
  const mainPointsContext = mainPointQuotes
    .map((p, i) => `${i + 1}. "${p.quote}" (Supported by: ${p.supportingScriptures.join(", ")})`)
    .join("\n");

  const prompt = `Create 15-20 crossword puzzle clues from this sermon.

Sermon: "${sermonTitle}" by Pastor ${pastorName} at ${churchName}

Full Transcript:
${sermonText}

PASTOR'S MAIN POINTS (as direct quotes):
${mainPointsContext || "No main points extracted. Identify 3-5 key statements the pastor made."}

INSTRUCTIONS:
1. For EACH pastor's main point quote, create ONE crossword clue with a blank word embedded
   - Example: Main point "The Holy Spirit is God's gift to believers" → Clue: "According to John 14:16, the Holy Spirit is God's ___ to believers" (GIFT)
   - Example: Main point "We must be personally born again, not inherit faith" → Clue: "In John 3, being born ___ means personal rebirth, not inherited faith" (AGAIN)
   - Hint for pastor points: Wrap in **bold** format to mark as pastor's teaching

2. Add additional scripture clues (direct from passages mentioned) to reach 15-20 total
   - Hints for scripture clues: Just cite the passage reference plainly

3. Each clue should cite the scripture that supports it

RULES:
- Blank words come from the PASTOR'S QUOTES
- Each clue references supporting scripture
- Words: single words, ALL CAPS, 3-15 letters
- Target: 15-20 total words
- Mark clue type: "pastor_point" or "scripture_clue"
- Return ONLY valid JSON

{
  "title": "${sermonTitle} — Sermon Crossword",
  "words": [
    {"word": "WORD", "clue": "In [Book] [Chapter], [clue with blank]", "hint": "**Bold hint for pastor points**", "type": "pastor_point"},
    {"word": "WORD", "clue": "In [Book] [Chapter], [clue with blank]", "hint": "John 14:16", "type": "scripture_clue"}
  ]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 3000, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await response.json();
  const text = data.content[0].text;
  try {
    // Extract JSON from the response (may have text before/after)
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("[Claude] Response text:", text);
      throw new Error("No JSON object found in response");
    }
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);

    // Attempt to parse; if it fails, try to clean common issues
    try {
      return JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[Claude] JSON parse error:", parseErr.message);
      console.error("[Claude] JSON substring:", jsonStr.substring(0, 500));
      console.error("[Claude] Full response:", text.substring(0, 1000));
      throw parseErr;
    }
  } catch (err) {
    throw new Error(`Claude did not return valid JSON: ${err.message}`);
  }
}

// ── Send email via Resend ────────────────────────────────────────────────────
async function emailPastor(toEmail, pastorName, puzzleUrl, sermonTitle) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Church] Would email ${toEmail} with puzzle: ${puzzleUrl}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
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
    const data = await res.json();
    if (!res.ok) {
      console.error(`[Church] Email failed: ${res.status} ${JSON.stringify(data)}`);
      throw new Error(`Resend error: ${data.message || res.statusText}`);
    }
    console.log(`[Church] Email sent to ${toEmail}`);
  } catch (err) {
    console.error(`[Church] Email error:`, err.message);
    throw err;
  }
}

// ── Supabase REST API helpers ──────────────────────────────────────────────
async function getChurches() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/church_accounts?youtube_channel=not.is.null&limit=500`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  console.log("[Supabase] URL:", process.env.SUPABASE_URL);
  console.log("[Supabase] Key exists:", !!key, "Length:", key?.length);
  console.log("[Supabase] Key starts with:", key?.substring(0, 20));

  const res = await fetch(url, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
    },
  });

  console.log("[Supabase] Response status:", res.status, "StatusText:", res.statusText);
  if (!res.ok) {
    const errorBody = await res.text();
    console.log("[Supabase] Error body:", errorBody);
    console.log("[Supabase] Request URL was:", url);
    throw new Error(`Supabase error: ${res.status} ${res.statusText} — ${errorBody}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`Supabase returned non-array: ${JSON.stringify(data)}`);
  }

  return data;
}

async function getExistingSermon(churchId, videoPublishedAt, videoId) {
  // Check by published timestamp (new records)
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/church_sermons?church_account_id=eq.${churchId}&video_published_at=eq.${videoPublishedAt}`,
    {
      headers: {
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()}`,
      },
    }
  );
  const data = await res.json();
  if (data && data.length > 0) return data[0];

  // Fallback: check by video_id (old records without published_at)
  const res2 = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/church_sermons?church_account_id=eq.${churchId}&video_id=eq.${videoId}`,
    {
      headers: {
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()}`,
      },
    }
  );
  const data2 = await res2.json();
  return data2[0] || null;
}

async function createSermonRecord(churchId, videoId, title, videoPublishedAt) {
  try {
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
        video_published_at: videoPublishedAt,
        sermon_title: title,
        status: "queued",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${JSON.stringify(data)}`);
    }
    return data[0] || data;
  } catch (err) {
    console.error("[Church] createSermonRecord error:", err.message);
    throw err;
  }
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

// ── Add missing schema columns if needed ───────────────────────────────────
async function ensureSchemaReady() {
  try {
    console.log("[Church Cron] Ensuring database schema has video_published_at column...");
    // In Supabase, columns must be added via dashboard or migrations
    // This is a placeholder - user must run this SQL in Supabase dashboard:
    // ALTER TABLE church_sermons ADD COLUMN IF NOT EXISTS video_published_at TIMESTAMPTZ;
    console.log("[Church Cron] Note: video_published_at column must exist in church_sermons table");
  } catch (err) {
    console.log("[Church Cron] Schema warning:", err.message);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  console.log("[Church Cron] Handler started");

  // Ensure database schema is ready
  await ensureSchemaReady();

  // Optional: Accept main points from request body for manual testing
  const providedMainPoints = req.body?.mainPoints || null;
  if (providedMainPoints) {
    console.log(`[Church Cron] Main points provided in request (${providedMainPoints.length} points)`);
  }

  const results = [];

  try {
    console.log("[Church Cron] Fetching churches from Supabase...");
    const churches = await getChurches();
    console.log(`[Church Cron] Found ${churches.length} churches`);

    // ── RETRY waiting sermons first ────────────────────────────────────────
    console.log("[Church Cron] Checking for waiting_for_captions sermons to retry...");
    const waitingRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/church_sermons?status=eq.waiting_for_captions&select=*`, {
      headers: {
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()}`,
      },
    });
    const waitingData = await waitingRes.json();
    const waitingSermons = Array.isArray(waitingData) ? waitingData : [];
    console.log(`[Church Cron] Found ${waitingSermons.length} waiting sermons to retry`);

    for (const sermon of waitingSermons) {
      try {
        console.log(`[Church Cron] Retrying captions for: ${sermon.sermon_title} (${sermon.video_id})`);
        const captions = await getYouTubeCaptions(sermon.video_id);

        if (captions) {
          // Captions available! Generate puzzle
          console.log(`[Church Cron] Captions now available, generating puzzle...`);
          const church = churches.find(c => c.id === sermon.church_account_id);
          if (!church) {
            console.log(`[Church Cron] Church not found for sermon, skipping`);
            continue;
          }

          const puzzleData = await generateSermonPuzzle(captions, sermon.sermon_title, church.church_name, church.pastor_name, null);
          const savePuzzleRes = await fetch(`${process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000"}/api/save-puzzle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: puzzleData.title,
              words: puzzleData.words,
              grade: "adult",
              rows: 15,
              cols: 15,
              church_name: church.church_name,
              sermon_title: sermon.sermon_title,
              video_url: `https://www.youtube.com/watch?v=${sermon.video_id}`,
              puzzle_source: "pastor"
            }),
          });
          const savePuzzleData = await savePuzzleRes.json();
          if (savePuzzleRes.ok) {
            const slug = savePuzzleData.slug;
            await updateSermonRecord(sermon.id, { puzzle_slug: slug, status: "sent", sent_at: new Date().toISOString() });
            results.push({ church: church.church_name, status: "puzzle generated (retry success)", puzzleUrl: `https://storyclue.ai/play/${slug}` });
          }
        } else {
          console.log(`[Church Cron] Captions still not available, will retry tomorrow`);
          results.push({ church: sermon.sermon_title, status: "still waiting for captions (will retry tomorrow)" });
        }
      } catch (err) {
        console.error(`[Church Cron] Retry error:`, err.message);
        results.push({ sermon: sermon.sermon_title, status: `retry error: ${err.message}` });
      }
    }

    for (const church of churches) {
      console.log(`[Church] Processing: ${church.church_name}`);
      try {
        if (!church.youtube_channel) {
          results.push({ church: church.church_name, status: "no youtube URL" });
          continue;
        }
        console.log(`[Church] Getting channel ID from: ${church.youtube_channel}`);
        const channelId = await getChannelIdFromUrl(church.youtube_channel);
        if (!channelId) { results.push({ church: church.church_name, status: "no channel ID" }); continue; }
        console.log(`[Church] Got channel ID: ${channelId}`);

        console.log(`[Church] Fetching newest video...`);
        const newestVideo = await getNewestVideo(channelId);
        if (!newestVideo) { results.push({ church: church.church_name, status: "no videos found" }); continue; }

        console.log(`[Church] Newest video: "${newestVideo.title}" published ${newestVideo.published.toISOString()}`);

        // Check if already processed (by timestamp first, then fallback to video_id)
        console.log(`[Church] Checking if already processed...`);
        const existing = await getExistingSermon(church.id, newestVideo.published.toISOString(), newestVideo.videoId);
        if (existing) { results.push({ church: church.church_name, status: "already processed" }); continue; }

        // Try to transcribe the newest video
        let transcriptionResult = null;
        let sermonRecord = null;
        let sermon = null;

        // Create sermon record
        console.log(`[Church] Creating sermon record...`);
        const record = await createSermonRecord(church.id, newestVideo.videoId, newestVideo.title, newestVideo.published.toISOString());
        if (!record.id) { results.push({ church: church.church_name, status: "DB error creating record" }); continue; }
        console.log(`[Church] Sermon record created, submitting transcription...`);

        // Try to transcribe
        try {
          const result = await submitTranscriptionJob(newestVideo.videoId);
          console.log(`[Church] Transcription submitted`);
          transcriptionResult = result;
          sermonRecord = record;
          sermon = newestVideo;
        } catch (err) {
          // If transcription completely failed, check if it's a "waiting for captions" situation
          if (err.message.includes("No captions found")) {
            console.log(`[Church] YouTube captions not available yet, setting to waiting state...`);
            await updateSermonRecord(record.id, { status: "waiting_for_captions", video_id: newestVideo.videoId });
            results.push({ church: church.church_name, status: "waiting for captions (will retry later)" });
            continue;
          }
          console.log(`[Church] Transcription failed: ${err.message}`);
          results.push({ church: church.church_name, status: `transcription error: ${err.message}` });
          continue;
        }

        if (!sermon) { results.push({ church: church.church_name, status: "no video to process" }); continue; }

        if (transcriptionResult && transcriptionResult.transcript) {
          // Got transcript immediately (video has captions) — generate puzzle now
          const puzzleData = await generateSermonPuzzle(transcriptionResult.transcript, sermon.title, church.church_name, church.pastor_name, providedMainPoints);

          const savePuzzleRes = await fetch(`${process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000"}/api/save-puzzle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: puzzleData.title,
              words: puzzleData.words,
              grade: "adult",
              rows: 15,
              cols: 15,
              church_name: church.church_name,
              sermon_title: sermon.title,
              video_url: `https://www.youtube.com/watch?v=${sermon.videoId}`,
              puzzle_source: "pastor"
            }),
          });
          const savePuzzleData = await savePuzzleRes.json();
          const slug = savePuzzleData.slug;

          const puzzleUrl = `https://storyclue.ai/play/${slug}`;

          await updateSermonRecord(sermonRecord.id, { puzzle_slug: slug, status: "sent", sent_at: new Date().toISOString(), transcription_service: transcriptionResult.service });

          // Don't email pastor yet — user reviews first
          // await emailPastor(church.sender_email, church.pastor_name, puzzleUrl, sermon.title);

          results.push({ church: church.church_name, status: "puzzle sent (instant)", puzzleUrl });
        } else if (transcriptionResult.jobId) {
          // Got jobId — background polling will handle it
          await updateSermonRecord(sermonRecord.id, { job_id: transcriptionResult.jobId, status: "transcribing", transcription_service: transcriptionResult.service });

          results.push({ church: church.church_name, status: "transcription queued (polling in background)", jobId: transcriptionResult.jobId, service: transcriptionResult.service });
        } else {
          // No transcript and no jobId — waiting for captions to become available
          await updateSermonRecord(sermonRecord.id, { status: "waiting_for_captions", video_id: sermon.videoId });

          results.push({ church: church.church_name, status: "waiting for YouTube captions (will retry hourly)" });
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
