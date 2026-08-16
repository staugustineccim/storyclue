// Test caption fetching on a single video
export default async function handler(req, res) {
  const videoId = req.query.v || "_muM7kEmk9E"; // Abundant Life with captions

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const watchRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const html = await watchRes.text();

    // Find captionTracks in the page - just look for the pattern and extract JSON manually
    const idx = html.indexOf('"captionTracks":');
    if (idx === -1) {
      return res.status(200).json({
        video_id: videoId,
        found: false,
        reason: "captionTracks string not found"
      });
    }

    // Find the opening bracket
    const bracketIdx = html.indexOf('[', idx);
    if (bracketIdx === -1) {
      return res.status(200).json({
        video_id: videoId,
        found: false,
        reason: "Opening bracket not found"
      });
    }

    // Find the closing bracket by counting braces
    let depth = 0;
    let endIdx = bracketIdx;
    for (let i = bracketIdx; i < html.length; i++) {
      if (html[i] === '[' || html[i] === '{') depth++;
      if (html[i] === ']' || html[i] === '}') depth--;
      if (html[i] === ']' && depth === 0) {
        endIdx = i + 1;
        break;
      }
    }

    const captionTracksJson = html.substring(bracketIdx, endIdx);
    let captionTracks;
    try {
      captionTracks = JSON.parse(captionTracksJson);
    } catch (e) {
      return res.status(200).json({
        video_id: videoId,
        found: false,
        reason: `JSON parse failed: ${e.message}`,
        sample: captionTracksJson.substring(0, 200)
      });
    }

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
