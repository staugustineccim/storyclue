/**
 * POST /api/youtube-transcript
 *
 * Body: { url: "https://www.youtube.com/watch?v=..." }
 * Returns: { transcript: "...", title: "..." }
 *
 * Extracts captions from a YouTube video without any API key.
 * Tries JSON3 caption format first, falls back to XML.
 * Falls back to video title + description if no captions exist.
 */

function extractVideoId(url) {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "url required" });

  const videoId = extractVideoId(String(url));
  if (!videoId) {
    return res.status(400).json({ error: "Could not extract a YouTube video ID from this URL." });
  }

  let videoTitle = "";
  let videoDescription = "";

  // ── oEmbed for title ─────────────────────────────────────────────────────
  try {
    const oe = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (oe.ok) {
      const d = await oe.json();
      videoTitle = d.title || "";
    }
  } catch {}

  // ── Fetch watch page and extract captions ────────────────────────────────
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!pageRes.ok) throw new Error(`YouTube page returned ${pageRes.status}`);
    const html = await pageRes.text();

    // Brace-match to extract ytInitialPlayerResponse JSON
    const marker = "ytInitialPlayerResponse=";
    const si = html.indexOf(marker);
    if (si === -1) throw new Error("ytInitialPlayerResponse not found");

    const jsonStart = html.indexOf("{", si);
    let depth = 0, jsonEnd = jsonStart;
    for (let i = jsonStart; i < Math.min(html.length, jsonStart + 900000); i++) {
      if (html[i] === "{") depth++;
      else if (html[i] === "}") {
        if (--depth === 0) { jsonEnd = i + 1; break; }
      }
    }

    const pr = JSON.parse(html.slice(jsonStart, jsonEnd));
    videoTitle       = videoTitle || pr?.videoDetails?.title || "";
    videoDescription = pr?.videoDetails?.shortDescription || "";

    const tracks = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks?.length) {
      const fallback = [videoTitle, videoDescription].filter(Boolean).join("\n\n");
      return res.status(200).json({
        transcript: fallback || null,
        title: videoTitle,
        source: "description",
        warning: "No captions found — using video title and description only.",
      });
    }

    // Prefer English, fall back to first available track
    const track =
      tracks.find(t => t.languageCode?.startsWith("en")) || tracks[0];

    // Try JSON3 format (cleaner, no XML parsing)
    const captRes = await fetch(`${track.baseUrl}&fmt=json3`, {
      signal: AbortSignal.timeout(6000),
    });
    if (captRes.ok) {
      const capJson = await captRes.json();
      const transcript = capJson.events
        ?.filter(e => e.segs)
        ?.flatMap(e => e.segs)
        ?.map(s => s.utf8)
        ?.filter(t => t && t !== "\n")
        ?.join(" ")
        ?.replace(/\s+/g, " ")
        ?.trim();
      if (transcript?.length > 100) {
        return res.status(200).json({
          transcript: videoTitle ? `${videoTitle}\n\n${transcript}` : transcript,
          title: videoTitle,
          source: "captions-json3",
        });
      }
    }

    // Fall back to XML caption format
    const xmlRes = await fetch(track.baseUrl, { signal: AbortSignal.timeout(6000) });
    const xml    = await xmlRes.text();
    const transcript = xml
      .match(/<text[^>]*>([\s\S]*?)<\/text>/g)
      ?.map(t =>
        t.replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
      )
      ?.join(" ")
      ?.trim();

    if (transcript?.length > 100) {
      return res.status(200).json({
        transcript: videoTitle ? `${videoTitle}\n\n${transcript}` : transcript,
        title: videoTitle,
        source: "captions-xml",
      });
    }

    throw new Error("Captions were empty after parsing");

  } catch (err) {
    // Final fallback — title + description is better than nothing
    const fallback = [videoTitle, videoDescription].filter(Boolean).join("\n\n");
    if (fallback.trim().length > 30) {
      return res.status(200).json({
        transcript: fallback,
        title: videoTitle,
        source: "description",
        warning: "Could not load captions — using video title and description. For best results, paste the video transcript directly.",
      });
    }
    return res.status(500).json({
      error:
        "Could not extract content from this video. The video may be private, age-restricted, or unavailable. Try pasting the transcript or description directly.",
    });
  }
}
