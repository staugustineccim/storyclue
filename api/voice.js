// ── /api/voice — ElevenLabs parent voice cloning ─────────────────────────────
// Handles three actions via ?action= query param:
//   clone    — POST: receives audio blob, creates ElevenLabs clone, returns voice_id
//   speak    — POST: receives text + voice_id, returns synthesized audio as base64
//   delete   — POST: deletes a voice from ElevenLabs
//
// IMPORTANT: ELEVENLABS_API_KEY must be set in Vercel environment variables.
// Never expose this key to the client — all ElevenLabs calls go through here.
//
// ── COST CONTROL: Audio caching ──────────────────────────────────────────────
// ElevenLabs charges per character synthesized. Most phrases (celebrations,
// song clue previews) are identical every session. We cache synthesized audio
// in Supabase Storage so each unique (voiceId + text) combination is only
// synthesized ONCE — ever. Repeat plays are free.
//
// Cache key: voices-cache/{voiceId}/{sha256(text).slice(0,16)}.mp3
// Stored in the same "voice-recordings-private" bucket (private, signed URLs).
// Expected savings: 95%+ reduction in ElevenLabs character usage for families
// who do repeated puzzle sessions.

import { createHash } from "crypto";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";
const API_KEY = process.env.ELEVENLABS_API_KEY;

const CACHE_BUCKET = "voice-recordings-private";

// Lazy Supabase client — uses dynamic import so a Node.js 20 / Supabase
// compatibility error at import time cannot crash the voice module.
let _supabaseAdmin = undefined;
async function getSupabase() {
  if (_supabaseAdmin !== undefined) return _supabaseAdmin;
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import("@supabase/supabase-js");
      _supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    } else {
      _supabaseAdmin = null;
    }
  } catch (err) {
    console.error("[voice] Supabase init failed (cache disabled):", err?.message);
    _supabaseAdmin = null;
  }
  return _supabaseAdmin;
}

function cacheKey(voiceId, text) {
  const hash = createHash("sha256").update(text.trim().toLowerCase()).digest("hex").slice(0, 16);
  return `voices-cache/${voiceId}/${hash}.mp3`;
}

async function getFromCache(voiceId, text) {
  const supabaseAdmin = await getSupabase();
  if (!supabaseAdmin) return null;
  try {
    const path = cacheKey(voiceId, text);
    const { data, error } = await supabaseAdmin.storage
      .from(CACHE_BUCKET)
      .download(path);
    if (error || !data) return null;
    const buf = Buffer.from(await data.arrayBuffer());
    return `data:audio/mpeg;base64,${buf.toString("base64")}`;
  } catch { return null; }
}

async function saveToCache(voiceId, text, audioBase64) {
  const supabaseAdmin = await getSupabase();
  if (!supabaseAdmin) return;
  try {
    const path = cacheKey(voiceId, text);
    const base64Data = audioBase64.replace(/^data:[^;]+;base64,/, "");
    const buf = Buffer.from(base64Data, "base64");
    await supabaseAdmin.storage
      .from(CACHE_BUCKET)
      .upload(path, buf, { contentType: "audio/mpeg", upsert: false });
    // upsert:false — don't overwrite, saves a write if already cached
  } catch { /* cache write failure is non-fatal */ }
}

// Celebration phrases used for the 30-second preview (Step 1)
const PREVIEW_PHRASES = [
  "Amazing job! You got it right!",
  "I am so proud of you!",
  "You are doing so wonderfully!",
];

// Increase body size limit for base64 audio blobs
export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = req.query.action || req.body?.action;

  // Diagnostic: log what we received so Vercel logs show the call
  console.log("[voice] action:", action, "| hasKey:", !!API_KEY, "| bodyKeys:", Object.keys(req.body || {}));

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
      const base64Data = audioBase64.replace(/^data:[^;]+;base64,/, "");
      const audioBuffer = Buffer.from(base64Data, "base64");

      // Detect MIME type — iOS Safari produces audio/mp4, Android produces audio/webm
      const mimeMatch = audioBase64.match(/^data:([^;,]+)/);
      const rawMime   = mimeMatch ? mimeMatch[1].toLowerCase() : "audio/webm";
      // Normalise to a MIME ElevenLabs accepts
      const mimeType  = rawMime.includes("mp4") || rawMime.includes("m4a") || rawMime.includes("aac")
        ? "audio/mp4"
        : rawMime.includes("ogg") ? "audio/ogg"
        : "audio/webm";
      const ext = mimeType === "audio/mp4" ? "m4a" : mimeType === "audio/ogg" ? "ogg" : "webm";

      console.log("[voice] clone: mimeType=", mimeType, "ext=", ext, "bufLen=", audioBuffer.length);

      // Use native FormData (Node.js 18 built-in) — much more reliable than
      // manual multipart construction, handles Content-Type/boundary automatically.
      const voiceName = `StoryClue_${label.replace(/\s+/g, "_")}_${Date.now()}`;
      const form = new FormData();
      form.append("name", voiceName);
      form.append("description", `StoryClue parent voice — ${label}`);
      form.append(
        "files",
        new Blob([audioBuffer], { type: mimeType }),
        `recording.${ext}`
      );

      const cloneRes = await fetch(`${ELEVENLABS_API}/voices/add`, {
        method: "POST",
        headers: { "xi-api-key": API_KEY },
        // Do NOT set Content-Type manually — FormData sets it with the boundary
        // Do NOT set Content-Length — Node.js fetch manages it
        body: form,
      });

      if (!cloneRes.ok) {
        const errText = await cloneRes.text();
        console.error("[voice] ElevenLabs clone error:", cloneRes.status, errText);
        // Return the actual ElevenLabs error so it shows in the UI for debugging
        let friendlyMsg = "Could not create voice clone. Please try again.";
        try {
          const errJson = JSON.parse(errText);
          if (errJson?.detail?.message) friendlyMsg = errJson.detail.message;
          else if (errJson?.detail) friendlyMsg = String(errJson.detail);
        } catch {}
        return res.status(500).json({ error: friendlyMsg, elevenlabsStatus: cloneRes.status });
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

    // ── Speak (TTS synthesis with caching) ────────────────────────────────
    if (action === "speak") {
      const { voiceId, text } = req.body;

      if (!voiceId || !text) {
        return res.status(400).json({ error: "voiceId and text required" });
      }

      // Check cache first — no ElevenLabs call needed if already synthesized
      const cached = await getFromCache(voiceId, text);
      if (cached) {
        return res.status(200).json({ audioBase64: cached, fromCache: true });
      }

      // Not cached — synthesize and save
      const audio = await synthesize(voiceId, text);
      if (!audio) {
        return res.status(500).json({ error: "Synthesis failed" });
      }
      saveToCache(voiceId, text, audio); // fire-and-forget, non-blocking
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
