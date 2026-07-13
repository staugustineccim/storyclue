// Runs every 30 seconds via Vercel cron
// Polls Supadata for completed transcription jobs and generates puzzles

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Poll Supadata for transcription result ──────────────────────────────────
async function checkTranscriptionStatus(jobId) {
  const res = await fetch(`https://api.supadata.ai/v1/transcript/${jobId}`, {
    headers: { "x-api-key": process.env.SUPADATA_API_KEY },
  });
  const data = await res.json();
  if (!data) throw new Error("Empty Supadata response");

  // Check for completion
  if (typeof data.content === "string") return { transcript: data.content, done: true };
  if (Array.isArray(data.content)) return { transcript: data.content.map(c => c.text || c).join(" "), done: true };
  if (data.transcript) return { transcript: data.transcript, done: true };

  // Check for error
  if (data.status === "failed" || data.error) {
    return { done: true, error: data.error || "Transcription failed" };
  }

  // Still processing
  if (data.status === "processing" || data.status === "queued") {
    return { done: false };
  }

  // Unknown state
  return { done: false };
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

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const results = [];

  // Find all sermons still transcribing
  const { data: transcribingSermons, error } = await supabase
    .from("church_sermons")
    .select("*, church_accounts(*)")
    .eq("status", "transcribing")
    .not("job_id", "is", null);

  if (error) return res.status(500).json({ error: error.message });

  for (const sermon of transcribingSermons || []) {
    try {
      // Check transcription status
      const statusResult = await checkTranscriptionStatus(sermon.job_id);

      if (statusResult.error) {
        // Transcription failed
        await supabase
          .from("church_sermons")
          .update({ status: "error", error_message: statusResult.error })
          .eq("id", sermon.id);

        results.push({ sermon: sermon.sermon_title, status: "error", error: statusResult.error });
        continue;
      }

      if (!statusResult.done) {
        // Still processing
        results.push({ sermon: sermon.sermon_title, status: "still transcribing" });
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
      const slug = `${sermon.sermon_title.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)}-sermon-${Date.now()}`;
      const saveRes = await fetch(`${process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000"}/api/save-puzzle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title: puzzleData.title, words: puzzleData.words, grade: "adult", source: "church" }),
      });

      if (!saveRes.ok) {
        throw new Error(`Failed to save puzzle: ${saveRes.status}`);
      }

      const puzzleUrl = `https://storyclue.ai/play/${slug}`;

      // Update sermon record
      await supabase
        .from("church_sermons")
        .update({
          puzzle_slug: slug,
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", sermon.id);

      // Email pastor
      await emailPastor(
        sermon.church_accounts.sender_email,
        sermon.church_accounts.pastor_name,
        puzzleUrl,
        sermon.sermon_title
      );

      results.push({ sermon: sermon.sermon_title, status: "puzzle sent", puzzleUrl });

    } catch (err) {
      console.error(`[Church Polling] Error for ${sermon.sermon_title}:`, err);
      results.push({ sermon: sermon.sermon_title, status: "error", error: err.message });
    }
  }

  return res.status(200).json({ checked: transcribingSermons?.length || 0, results });
}
