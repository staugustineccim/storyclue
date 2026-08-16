// Test caption fetching on a single video
export default async function handler(req, res) {
  const videoId = req.query.v || "_muM7kEmk9E"; // Abundant Life with captions

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const watchRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const html = await watchRes.text();

    // New regex - simpler and more robust
    const captionsMatch = html.match(/"captionTracks":\s*(\[\{[^}]*"baseUrl"[^}]*(?:\{[^}]*\}[^}]*)*\}(?:,\{[^}]*"baseUrl"[^}]*(?:\{[^}]*\}[^}]*)*\})*\])/);

    if (!captionsMatch) {
      return res.status(200).json({
        video_id: videoId,
        found: false,
        reason: "No captionTracks matched by regex"
      });
    }

    const captionTracks = JSON.parse(captionsMatch[1]);

    if (!captionTracks || captionTracks.length === 0) {
      return res.status(200).json({
        video_id: videoId,
        found: false,
        reason: "captionTracks array empty"
      });
    }

    return res.status(200).json({
      video_id: videoId,
      found: true,
      caption_count: captionTracks.length,
      tracks: captionTracks.map(t => ({
        language: t.languageCode,
        name: t.name?.simpleText,
        kind: t.kind,
        baseUrl: t.baseUrl?.substring(0, 100)
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
