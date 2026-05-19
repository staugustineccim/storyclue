/**
 * POST /api/tts
 *
 * Body: { text: "...", grade: "k" }
 * Returns: { audioBase64: "...", mimeType: "audio/mp3" }
 *
 * Grade-based voice tiers:
 *   K–2:   en-US-Neural2-H  (warmest/friendliest female Neural2 voice), higher pitch
 *   3–5:   en-US-Neural2-F  (warm female adult voice)
 *   6–12:  Web Speech API fallback (returns 204 — client handles it)
 *   adult: Web Speech API fallback (returns 204 — client handles it)
 *
 * Requires GOOGLE_TTS_API_KEY in Vercel environment variables.
 * To add: Vercel Dashboard → Your Project → Settings → Environment Variables
 * Get a key at: https://console.cloud.google.com → APIs & Services → Credentials
 * Enable: Cloud Text-to-Speech API
 *
 * If GOOGLE_TTS_API_KEY is not set, returns 501 so the client can fall back
 * gracefully to the Web Speech API.
 */

const VOICE_CONFIG = {
  k:       { name: "en-US-Neural2-H", pitch: 5.0,  speakingRate: 0.82 },
  "1":     { name: "en-US-Neural2-H", pitch: 3.5,  speakingRate: 0.85 },
  "2":     { name: "en-US-Neural2-H", pitch: 2.0,  speakingRate: 0.88 },
  "3":     { name: "en-US-Neural2-F", pitch: 1.0,  speakingRate: 0.92 },
  "4":     { name: "en-US-Neural2-F", pitch: 0.5,  speakingRate: 0.96 },
  "5":     { name: "en-US-Neural2-F", pitch: 0.0,  speakingRate: 1.0  },
  // 6th grade and above: client uses Web Speech API — this endpoint returns 204
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, grade = "3" } = req.body || {};

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "text required" });
  }

  // 6th grade and above: signal client to use Web Speech API
  const voiceCfg = VOICE_CONFIG[grade];
  if (!voiceCfg) {
    return res.status(204).end(); // No Content → client uses Web Speech API
  }

  // Check for API key
  if (!process.env.GOOGLE_TTS_API_KEY) {
    // Not configured yet — signal client to fall back to Web Speech API
    return res.status(501).json({ error: "Google TTS not configured" });
  }

  try {
    const r = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: { text: text.trim().slice(0, 500) },
          voice: {
            languageCode: "en-US",
            name: voiceCfg.name,
          },
          audioConfig: {
            audioEncoding: "MP3",
            pitch: voiceCfg.pitch,
            speakingRate: voiceCfg.speakingRate,
            effectsProfileId: ["handset-class-device"],
          },
        }),
      }
    );

    if (!r.ok) {
      const err = await r.text();
      console.error("Google TTS error:", err);
      // Fall back to Web Speech API signal
      return res.status(501).json({ error: "Google TTS request failed" });
    }

    const data = await r.json();
    return res.status(200).json({
      audioBase64: data.audioContent,
      mimeType: "audio/mp3",
    });

  } catch (err) {
    console.error("TTS handler error:", err);
    return res.status(501).json({ error: "TTS unavailable" });
  }
}
