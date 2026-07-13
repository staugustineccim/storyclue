// Manual test endpoint — triggers full sermon pipeline for a specific video
// Usage: POST /api/test-sermon with { "videoId": "a39qncc_RlU", "secret": "storyclue-sunday-2024" }

async function transcribeVideo(videoId) {
  const encodedUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
  const res = await fetch(`https://api.supadata.ai/v1/transcript?url=${encodedUrl}`, {
    headers: { "x-api-key": process.env.SUPADATA_API_KEY },
  });
  const data = await res.json();
  if (!data || data.error) throw new Error(`Supadata error: ${JSON.stringify(data)}`);

  // Immediate response with content
  if (typeof data.content === "string") return data.content;
  if (Array.isArray(data.content)) return data.content.map(c => c.text || c).join(" ");
  if (data.transcript) return data.transcript;

  // Async job — poll for result
  if (data.jobId) {
    console.log(`[transcribe] Supadata jobId ${data.jobId} — polling...`);
    const deadline = Date.now() + 10 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 15000));
      const pollRes = await fetch(`https://api.supadata.ai/v1/transcript/${data.jobId}`, {
        headers: { "x-api-key": process.env.SUPADATA_API_KEY },
      });
      const pollData = await pollRes.json();
      if (pollData.status === "completed" || pollData.content || pollData.transcript) {
        if (typeof pollData.content === "string") return pollData.content;
        if (Array.isArray(pollData.content)) return pollData.content.map(c => c.text || c).join(" ");
        if (pollData.transcript) return pollData.transcript;
      }
      if (pollData.status === "failed") throw new Error(`Supadata job failed: ${JSON.stringify(pollData)}`);
      console.log(`[transcribe] status: ${pollData.status} — waiting...`);
    }
    throw new Error("Supadata transcription timed out after 10 minutes");
  }

  throw new Error(`Supadata unexpected response: ${JSON.stringify(data)}`);
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

  if (!data.content || !data.content[0]) {
    throw new Error(`Claude API error: ${JSON.stringify(data)}`);
  }

  const text = data.content[0].text;
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  } catch (e) {
    throw new Error(`Failed to parse puzzle JSON. Claude responded: ${text.slice(0, 200)}`);
  }
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
