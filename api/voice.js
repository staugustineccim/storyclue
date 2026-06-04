// ── /api/voice — ElevenLabs parent voice cloning ─────────────────────────────
// Handles three actions via ?action= query param:
//   clone    — POST: receives audio blob, creates ElevenLabs clone, returns voice_id
//   speak    — POST: receives text + voice_id, returns synthesized audio as base64
//   delete   — POST: deletes a voice from ElevenLabs
//
// IMPORTANT: ELEVENLABS_API_KEY must be set in Vercel environment variables.
// Never expose this key to the client — all ElevenLabs calls go through here.
//
// Free tier users (plan_level = 'free') fall back to a note that voice cloning
// is a paid feature. The client handles the fallback to Web Speech API.

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";
const API_KEY = process.env.ELEVENLABS_API_KEY;

// Celebration phrases used for the 30-second preview (Step 1)
const PREVIEW_PHRASES = [
  "Amazing job! You got it right!",
  "I am so proud of you!",
  "You are doing so wonderfully!",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = req.query.action || req.body?.action;

  if (!API_KEY) {
    return res.status(503).json({
      error: "Voice cloning not yet configured. Add ELEVENLABS_API_KEY to Vercel environment variables.",
      fallback: true,
    });
  }

  try {
    // ── Clone voice ────────────────────────────────────────────────────────
    if (action === "clone") {
      const { audioBase64, label = "Parent Voice", previewOnly = false } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: "No audio data provided" });
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioBase64.replace(/^data:[^;]+;base64,/, ""), "base64");

      // Determine MIME type (default to webm which MediaRecorder produces)
      const mimeMatch = audioBase64.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "audio/webm";
      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";

      // Build multipart form data for ElevenLabs
      const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
      const name = `StoryClue_${label.replace(/\s+/g, "_")}_${Date.now()}`;

      let formBody = "";
      formBody += `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\n${name}\r\n`;
      formBody += `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nStoryClue parent voice for ${label}\r\n`;

      const formPrefix = Buffer.from(formBody);
      const fileHeader = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="recording.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      );
      const formSuffix = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([formPrefix, fileHeader, audioBuffer, formSuffix]);

      const cloneRes = await fetch(`${ELEVENLABS_API}/voices/add`, {
        method: "POST",
        headers: {
          "xi-api-key": API_KEY,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": String(body.length),
        },
        body,
      });

      if (!cloneRes.ok) {
        const errText = await cloneRes.text();
        console.error("ElevenLabs clone error:", errText);
        return res.status(500).json({ error: "Could not create voice clone. Please try again." });
      }

      const cloneData = await cloneRes.json();
      const voiceId = cloneData.voice_id;

      // If preview-only, synthesize 3 short phrases and return them as base64 audio
      if (previewOnly) {
        const previews = [];
        for (const phrase of PREVIEW_PHRASES) {
          const audio = await synthesize(voiceId, phrase);
          if (audio) previews.push({ phrase, audioBase64: audio });
        }
        return res.status(200).json({ voiceId, previews });
      }

      return res.status(200).json({ voiceId });
    }

    // ── Speak (TTS synthesis) ──────────────────────────────────────────────
    if (action === "speak") {
      const { voiceId, text } = req.body;

      if (!voiceId || !text) {
        return res.status(400).json({ error: "voiceId and text required" });
      }

      const audio = await synthesize(voiceId, text);
      if (!audio) {
        return res.status(500).json({ error: "Synthesis failed" });
      }
      return res.status(200).json({ audioBase64: audio });
    }

    // ── Delete voice ───────────────────────────────────────────────────────
    if (action === "delete") {
      const { voiceId } = req.body;
      if (!voiceId) return res.status(400).json({ error: "voiceId required" });

      const delRes = await fetch(`${ELEVENLABS_API}/voices/${voiceId}`, {
        method: "DELETE",
        headers: { "xi-api-key": API_KEY },
      });
      return res.status(200).json({ deleted: delRes.ok });
    }

    // ── Generate personalized celebration phrases ──────────────────────────
    if (action === "generate-phrases") {
      const { voiceId, childName, parentLabel = "Parent" } = req.body;
      if (!voiceId || !childName) {
        return res.status(400).json({ error: "voiceId and childName required" });
      }

      const phrases = [
        `Amazing job ${childName}!`,
        `You got it ${childName} — I knew you could do it!`,
        `I am so proud of you ${childName}!`,
        `Way to go ${childName} — that is my superstar!`,
        `Keep going ${childName}, you are doing so well!`,
        `${childName}, you are absolutely brilliant!`,
        `I love you ${childName}, and I am cheering for you!`,
        `${childName}, you never give up — that makes me so happy!`,
      ];

      const results = [];
      for (const phrase of phrases) {
        const audio = await synthesize(voiceId, phrase);
        if (audio) results.push({ phrase, audioBase64: audio });
      }
      return res.status(200).json({ phrases: results });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error("Voice handler error:", err);
    return res.status(500).json({ error: "Voice service error. Please try again." });
  }
}

// ── Helper: synthesize text with a given ElevenLabs voice_id ─────────────────
async function synthesize(voiceId, text) {
  try {
    const r = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.6, similarity_boost: 0.85, style: 0.2, use_speaker_boost: true },
      }),
    });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    return `data:audio/mpeg;base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}
