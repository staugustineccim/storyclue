// Manual test endpoint — triggers full sermon pipeline for a specific video
// Usage: POST /api/test-sermon with { "videoId": "a39qncc_RlU", "secret": "storyclue-sunday-2024" }

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function transcribeVideo(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const submitRes = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      "Authorization": process.env.ASSEMBLYAI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audio_url: videoUrl }),
  });
  const { id, error } = await submitRes.json();
  if (error) throw new Error(`AssemblyAI submit: ${error}`);

  // Poll up to 8 minutes
  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 10000));
    const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { "Authorization": process.env.ASSEMBLYAI_API_KEY },
    });
    const data = await pollRes.json();
    if (data.status === "completed") return data.text;
    if (data.status === "error") throw new Error(`AssemblyAI: ${data.error}`);
  }
  throw new Error("Transcription timed out");
}

async function generatePuzzle(transcript) {
  const prompt = `You are creating a crossword puzzle from a church sermon to help the congregation remember what they heard today.

Sermon title: "Sunday Sermon"
Church: Colonial Church St. Augustine
Pastor: Jonathan Rivera

Full sermon transcript:
${transcript.slice(0, 6000)}

Your job is to identify the pastor's MAIN POINTS and KEY ILLUSTRATIONS — the things they repeated, emphasized, or built their outline around. These become the crossword words.

Look for:
1. The numbered or named points the pastor walked through
2. Key scripture words or names the pastor kept returning to
3. Memorable illustrations or stories the pastor used
4. Words or phrases the pastor asked the congregation to repeat out loud
5. The central challenge or call to action at the end

Rules:
- Every word must connect directly to something the pastor actually said
- Clues must reference the specific story or point from THIS sermon, not generic definitions
- Words must be single words, all caps, 3-15 letters, no spaces
- 15-20 words total
- Clues written at a conversational adult level — like you're reminding a friend what the pastor said

Return ONLY valid JSON:
{
  "title": "Sunday Sermon — Crossword",
  "words": [
    {"word": "WORD", "clue": "Clue referencing the specific sermon point or story"}
  ]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text;
  return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { videoId, secret } = req.body;
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "Unauthorized" });
  if (!videoId) return res.status(400).json({ error: "videoId required" });

  try {
    console.log(`[test-sermon] Transcribing ${videoId}...`);
    const transcript = await transcribeVideo(videoId);
    console.log(`[test-sermon] Transcript length: ${transcript.length} chars`);

    console.log(`[test-sermon] Generating puzzle...`);
    const puzzle = await generatePuzzle(transcript);
    console.log(`[test-sermon] Generated ${puzzle.words.length} words`);

    return res.status(200).json({
      transcript: transcript.slice(0, 500) + "...",
      puzzle,
    });
  } catch (err) {
    console.error("[test-sermon] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
