// Runs every minute via Vercel cron
// Polls Supadata for completed transcription jobs and generates puzzles
// Uses Supabase REST API (no SDK, no WebSocket issues)

// ── Poll Supadata for transcription result ──────────────────────────────────
async function checkSupadataStatus(jobId) {
  const res = await fetch(`https://api.supadata.ai/v1/transcript/${jobId}`, {
    headers: { "x-api-key": process.env.SUPADATA_API_KEY },
  });
  const data = await res.json();
  if (!data) throw new Error("Empty Supadata response");

  if (typeof data.content === "string") return { transcript: data.content, done: true };
  if (Array.isArray(data.content)) return { transcript: data.content.map(c => c.text || c).join(" "), done: true };
  if (data.transcript) return { transcript: data.transcript, done: true };

  if (data.status === "failed" || data.error) {
    return { done: true, error: data.error || "Transcription failed" };
  }

  if (data.status === "processing" || data.status === "queued") {
    return { done: false };
  }

  return { done: false };
}

// ── Poll AssemblyAI for transcription result ────────────────────────────────
async function checkAssemblyAIStatus(jobId) {
  const res = await fetch(`https://api.assemblyai.com/v2/transcript/${jobId}`, {
    headers: { "Authorization": process.env.ASSEMBLYAI_API_KEY },
  });

  const data = await res.json();
  if (!res.ok) {
    return { done: true, error: data.error || "AssemblyAI API error" };
  }

  if (data.status === "completed") {
    return { transcript: data.text, done: true };
  }

  if (data.status === "failed") {
    return { done: true, error: data.error || "Transcription failed" };
  }

  // Still processing
  return { done: false };
}

// ── Check transcription status (handles Supadata and AssemblyAI) ────────────
async function checkTranscriptionStatus(jobId, service) {
  if (service === "assemblyai") {
    return await checkAssemblyAIStatus(jobId);
  } else {
    return await checkSupadataStatus(jobId);
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
async function getTranscribingSermons() {
  try {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_sermons?status=eq.transcribing&select=*,church_accounts(*)`,
      {
        headers: {
          "apikey": process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    console.log(`[Poll] Supabase response: ${res.status}`);
    const data = await res.json();
    console.log(`[Poll] Got ${data?.length || 0} sermons from Supabase`);
    return data;
  } catch (err) {
    console.error("[Poll] Error fetching sermons:", err.message);
    throw err;
  }
}

async function updateSermonRecord(sermonId, updates) {
  const res = await fetch(
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
  return res.json();
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  console.log("[Poll] Handler started");

  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log("[Poll] Authorization failed");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sermons = await getTranscribingSermons();
    const results = [];
    const debug = { sermonCount: sermons?.length || 0, processedSermons: [] };

    for (const sermon of sermons || []) {
      try {
        const service = sermon.transcription_service || "supadata";
        console.log(`[Poll] Checking sermon: ${sermon.sermon_title}, service: ${service}, jobId: ${sermon.job_id}`);
        const statusResult = await checkTranscriptionStatus(sermon.job_id, service);
        console.log(`[Poll] Status result:`, JSON.stringify(statusResult));

        if (statusResult.error) {
          console.log(`[Poll] Got error: ${statusResult.error}`);
          await updateSermonRecord(sermon.id, { status: "error", error_message: statusResult.error });
          results.push({ sermon: sermon.sermon_title, status: "error", error: statusResult.error });
          continue;
        }

        if (!statusResult.done) {
          console.log(`[Poll] Still transcribing`);
          results.push({ sermon: sermon.sermon_title, status: "still transcribing", service });
          continue;
        }

        console.log(`[Poll] Transcription done, generating puzzle...`);

        if (!sermon.church_accounts) {
          console.error(`[Poll] ERROR: No church_accounts data for sermon ${sermon.id}`);
          results.push({ sermon: sermon.sermon_title, status: "error", error: "Missing church account data" });
          continue;
        }

        // Transcription done — generate puzzle
        const puzzleData = await generateSermonPuzzle(
          statusResult.transcript,
          sermon.sermon_title,
          sermon.church_accounts.church_name,
          sermon.church_accounts.pastor_name
        );

        // Save puzzle
        const saveRes = await fetch(`${process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000"}/api/save-puzzle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: puzzleData.title, words: puzzleData.words, grade: "adult", rows: 15, cols: 15 }),
        });

        if (!saveRes.ok) {
          throw new Error(`Failed to save puzzle: ${saveRes.status}`);
        }

        const saveData = await saveRes.json();
        const slug = saveData.slug;
        const puzzleUrl = `https://storyclue.ai/play/${slug}`;

        // Update sermon record
        await updateSermonRecord(sermon.id, {
          puzzle_slug: slug,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        // Email pastor
        await emailPastor(
          sermon.church_accounts.sender_email,
          sermon.church_accounts.pastor_name,
          puzzleUrl,
          sermon.sermon_title
        );

        results.push({ sermon: sermon.sermon_title, status: "puzzle sent", puzzleUrl });

      } catch (err) {
        results.push({ sermon: sermon.sermon_title, status: "error", error: err.message });
        debug.processedSermons.push({ title: sermon.sermon_title, error: err.message });
      }
    }

    return res.status(200).json({ checked: sermons?.length || 0, results, debug });

  } catch (err) {
    console.error("[Church Polling] Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
