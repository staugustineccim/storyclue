// Test the new caption fetching logic
async function getYouTubeCaptions(videoId) {
  try {
    console.log(`[Church] Checking for YouTube captions on video ${videoId}...`);

    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!watchRes.ok) {
      console.log(`[Church] Could not fetch watch page (HTTP ${watchRes.status})`);
      return null;
    }

    const html = await watchRes.text();
    const captionTracksMatch = html.match(/"captionTracks":\s*(\[.*?\])/);

    if (!captionTracksMatch) {
      console.log(`[Church] No caption tracks found on page`);
      return null;
    }

    try {
      const captionTracks = JSON.parse(captionTracksMatch[1]);

      if (!captionTracks || captionTracks.length === 0) {
        console.log(`[Church] Caption tracks array is empty`);
        return null;
      }

      let trackUrl = null;
      for (const track of captionTracks) {
        if (track.languageCode === 'en' || track.languageCode?.includes('en')) {
          trackUrl = track.baseUrl;
          console.log(`[Church] Found English caption track`);
          break;
        }
      }

      if (!trackUrl) {
        trackUrl = captionTracks[0].baseUrl;
        console.log(`[Church] Using first available caption track: ${captionTracks[0].languageCode}`);
      }

      const captionRes = await fetch(trackUrl);
      if (!captionRes.ok) {
        console.log(`[Church] Could not fetch caption track (HTTP ${captionRes.status})`);
        return null;
      }

      const captionText = await captionRes.text();

      const lines = captionText.split('\n');
      const captions = lines
        .filter(line => line.trim() && !line.includes('-->') && !line.startsWith('WEBVTT'))
        .join(' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (captions.length < 100) {
        console.log(`[Church] Captions too short (${captions.length} chars), likely not ready yet`);
        return null;
      }

      console.log(`[Church] Got YouTube captions (${captions.length} characters)`);
      return captions;
    } catch (parseErr) {
      console.log(`[Church] Error parsing caption data:`, parseErr.message);
      return null;
    }
  } catch (err) {
    console.log(`[Church] Error fetching YouTube captions:`, err.message);
    return null;
  }
}

export default async function handler(req, res) {
  const videoId = req.query.v || "mGIhEB5yK6U"; // Default test video

  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await watchRes.text();
    const captionTracksMatch = html.match(/"captionTracks":\s*(\[.*?\])/);

    const captions = await getYouTubeCaptions(videoId);

    return res.status(200).json({
      video_id: videoId,
      watch_page_ok: watchRes.ok,
      caption_tracks_found: !!captionTracksMatch,
      has_captions: !!captions,
      caption_length: captions?.length || 0,
      preview: captions?.substring(0, 300) || "No captions found",
      html_preview: html.substring(0, 1000)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
