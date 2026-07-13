// POST /api/webhooks/supadata-complete
// Supadata calls this when transcription is complete
// This is the async continuation of the cron job

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { content, transcript, metadata } = req.body;

    if (!metadata || !metadata.sermonId) {
      return res.status(400).json({ error: "Missing sermonId in metadata" });
    }

    // Extract transcript from Supadata response
    const transcriptText = content || transcript;
    if (!transcriptText) {
      return res.status(400).json({ error: "No transcript in Supadata response" });
    }

    // Fetch sermon record to get church info
    const { data: sermonRecord, error: fetchError } = await supabase
      .from("church_sermons")
      .select("*, church_accounts(*)")
      .eq("id", metadata.sermonId)
      .single();

    if (fetchError || !sermonRecord) {
      console.error("Error fetching sermon record:", fetchError);
      return res.status(404).json({ error: "Sermon record not found" });
    }

    const church = sermonRecord.church_accounts;

    // Generate puzzle from transcript
    const puzzleData = await generateSermonPuzzle(
      transcriptText,
      sermonRecord.sermon_title,
      church.church_name,
      church.pastor_name
    );

    // Save puzzle
    const slug = `${sermonRecord.sermon_title.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)}-sermon-${Date.now()}`;
    const saveRes = await fetch(`${process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000"}/api/save-puzzle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title: puzzleData.title, words: puzzleData.words, grade: "adult", source: "church" }),
    });

    if (!saveRes.ok) {
      throw new Error(`Failed to save puzzle: ${saveRes.status}`);
    }

    const puzzleUrl = `https://storyclue.ai/play/${slug}`;

    // Update sermon record with puzzle info
    const { error: updateError } = await supabase
      .from("church_sermons")
      .update({
        puzzle_slug: slug,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", sermonRecord.id);

    if (updateError) {
      console.error("Error updating sermon record:", updateError);
      return res.status(500).json({ error: "Failed to update sermon record" });
    }

    // Email pastor
    await emailPastor(church.sender_email, church.pastor_name, puzzleUrl, sermonRecord.sermon_title);

    console.log(`[Church] Webhook: Puzzle generated and emailed to ${church.church_name}`);
    return res.status(200).json({ success: true, puzzleUrl });

  } catch (err) {
    console.error("[Church] Webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
}
