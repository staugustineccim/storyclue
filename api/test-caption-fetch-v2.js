export default async function handler(req, res) {
  const videoId = "Tavv-NWjhQs"; // Test video from last cron run

  try {
    // Method 1: Try youtube-transcript-api via web endpoint
    console.log("Testing different caption APIs...\n");

    // Try the /watch?v= page and look for captions in the HTML
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await watchRes.text();

    // Look for captions data in the HTML (videoDetails.videoId often indicates captions exist)
    const hasCaptions = html.includes("captions") || html.includes("captionTracks");
    const captionTracksMatch = html.match(/"captionTracks":\[(.*?)\]/);

    // Try alternative: WebVTT format
    const vttUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=vtt`;
    const vttRes = await fetch(vttUrl);
    const vttText = await vttRes.text();

    // Try with different lang codes
    const autoLangUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
    const autoRes = await fetch(autoLangUrl);
    const autoText = await autoRes.text();

    // Check if video has captions track info
    const hasTracksInfo = html.includes('"kind":"asr"') || html.includes('"kind":"standard"');

    return res.status(200).json({
      video_id: videoId,
      tests: {
        page_loads: watchRes.status === 200,
        has_caption_mentions: hasCaptions,
        has_caption_tracks_in_html: !!captionTracksMatch,
        has_tracks_kind_info: hasTracksInfo,
        vtt_response: {
          status: vttRes.status,
          length: vttText.length,
          preview: vttText.substring(0, 300)
        },
        json3_response: {
          status: autoRes.status,
          length: autoText.length,
          preview: autoText.substring(0, 300)
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
