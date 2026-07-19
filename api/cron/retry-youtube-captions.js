// Runs hourly to retry YouTube captions for sermons waiting
// Uses Supabase REST API (no SDK, no WebSocket issues)

// ── Get YouTube captions (free, no transcription needed) ────────────────────
async function getYouTubeCaptions(videoId) {
  try {
    const trackRes = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&type=list`);
    const trackXml = await trackRes.text();

    const trackMatch = trackXml.match(/lang_code='([^']*en[^']*)'[^>]*name='([^']*)'[^>]*kind='([^']*)'/);
    if (!trackMatch) throw new Error("No captions found");

    const langCode = trackMatch[1];
    const captionRes = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=${langCode}`);
    const captionXml = await captionRes.text();

    const textMatches = captionXml.match(/<text[^>]*>([^<]+)<\/text>/g);
    if (!textMatches) throw new Error("No caption text found");

    const transcript = textMatches
      .map(match => match.replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, " ").trim())
      .filter(text => text.length > 0)
      .join(" ");

    return transcript;
  } catch (err) {
    throw new Error(`YouTube captions error: ${err.message}`);
  }
}

// ── Generate puzzle from sermon text ─────────────────────────────────────────
async function generateSermonPuzzle(sermonText, sermonTitle, churchName, pastorName) {
  const prompt = `You are creating a crossword puzzle from a church sermon to help the congregation remember what they heard today.

Sermon title: "${sermonTitle}"
Church: ${churchName}
Pastor: ${pastorName}

Full sermon transcript:
${sermonText.slice(0, 6000)}

CRITICAL RULES:
- IGNORE opening remarks, greetings, and casual chat (e.g., "I've been watching Colonial Church...", "look at your neighbor", audience participation calls)
- FOCUS ONLY on the core sermon teaching from the scripture passages being taught
- Every clue MUST reference the SCRIPTURE PASSAGES and teachings in THIS SERMON
- Reference the Bible passages, not generic definitions: "In Matthew 5, Jesus taught...", "The passage describes...", "This scripture illustrates..."
- NO generic Bible dictionary definitions. NO generic church vocabulary. NO generic theology.
- NO interpolation. NO filling in what you think the sermon meant.
- Example BAD: "A word said in church to express agreement" (generic theology)
- Example GOOD: "In Matthew 5, Jesus described those who hunger and thirst for righteousness as ___" (scripture-specific)

Your job is to pull out words from the SERMON TEACHING that are:
1. Directly quoted or emphasized by the pastor (words they repeated or highlighted)
2. Central to a specific story or illustration the pastor told (the object, person, concept, or action at the heart of their story)
3. Part of a specific scripture verse the pastor cited and explained
4. Part of specific action items or challenges the pastor gave
5. Key phrases the pastor used multiple times

For EACH word, generate TWO versions:

**CLUE** (scripture-based, bullet-point style):
- Reference what the SCRIPTURE PASSAGE teaches, not generic theology
- Ground every clue in the specific passage being taught: "In [book] [chapter], the passage says..."
- Example: "In Matthew 5, Jesus taught that those who _____ and _____ for righteousness are blessed" (Answer: HUNGER, THIRST)
- Example: "The Beatitudes describe those blessed when they mourn, when they are meek, when they..." (Answer: BLESSED)

**HINT** (direct reference to what pastor said):
- What the pastor actually said or emphasized about this word — can include brief direct quotes
- Example: "He said it shapes what we spiritually hunger for, like culture shapes food preferences"
- Example: "The book he told everyone to open to, chapter 5"

Rules:
- Every word must appear in the sermon text or be a direct reference to content in the sermon
- Clues must reference something specific from the sermon (a concept, story element, verse, or repeated theme)
- Hints should be direct enough to remind people what the pastor said
- Words must be single words, all caps, 3-15 letters, no spaces
- 15-20 words total
- If you cannot find specific source material for a word, DO NOT INCLUDE IT

Return ONLY valid JSON in this exact format:
{
  "title": "${sermonTitle} — Sermon Crossword",
  "words": [
    {"word": "WORD", "clue": "Thematic/bullet-point version", "hint": "Direct reference to what pastor said"}
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
    console.log(`[Retry] Would email ${toEmail} with puzzle: ${puzzleUrl}`);
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
async function getWaitingSermons() {
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/church_sermons?status=eq.waiting_for_captions&select=*,church_accounts(*)`,
    {
      headers: {
        "apikey": process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  return res.json();
}

async function updateSermonRecord(sermonId, updates) {
  return fetch(
    `${process.env.SUPABASE_URL}/rest/v1/church_sermons?id=eq.${sermonId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(updates),
    }
  );
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  console.log("[Retry] Handler started");

  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sermons = await getWaitingSermons();
    console.log(`[Retry] Found ${sermons?.length || 0} sermons waiting for captions`);
    const results = [];

    for (const sermon of sermons || []) {
      try {
        console.log(`[Retry] Retrying YouTube captions for: ${sermon.sermon_title}`);

        const transcript = await getYouTubeCaptions(sermon.video_id);
        console.log(`[Retry] Got captions! Generating puzzle...`);

        const puzzleData = await generateSermonPuzzle(
          transcript,
          sermon.sermon_title,
          sermon.church_accounts.church_name,
          sermon.church_accounts.pastor_name
        );

        const saveRes = await fetch(
          `${process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000"}/api/save-puzzle`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: puzzleData.title, words: puzzleData.words, grade: "adult", rows: 15, cols: 15 }),
          }
        );

        if (!saveRes.ok) throw new Error(`Failed to save puzzle: ${saveRes.status}`);

        const saveData = await saveRes.json();
        const puzzleUrl = `https://storyclue.ai/play/${saveData.slug}`;

        await updateSermonRecord(sermon.id, {
          puzzle_slug: saveData.slug,
          status: "sent",
          sent_at: new Date().toISOString(),
          transcription_service: "youtube-captions",
        });

        await emailPastor(
          sermon.church_accounts.sender_email,
          sermon.church_accounts.pastor_name,
          puzzleUrl,
          sermon.sermon_title
        );

        results.push({ sermon: sermon.sermon_title, status: "puzzle sent (from captions retry)", puzzleUrl });
      } catch (err) {
        console.log(`[Retry] ${sermon.sermon_title}: ${err.message}`);
        results.push({ sermon: sermon.sermon_title, status: "still waiting", error: err.message });
      }
    }

    return res.status(200).json({ checked: sermons?.length || 0, results });
  } catch (err) {
    console.error("[Retry] Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
