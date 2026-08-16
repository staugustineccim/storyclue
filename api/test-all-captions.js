// Test caption fetching for all 45 churches - shows results in table format

async function getYouTubeCaptions(videoId) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const watchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!watchRes.ok) {
      return { success: false, reason: `Watch page returned ${watchRes.status}` };
    }

    const html = await watchRes.text();
    const captionsMatch = html.match(/"captions":\{[^}]*"playerCaptionsTracklistRenderer":\{[^}]*"captionTracks":\s*(\[.*?\])/);

    if (!captionsMatch) {
      return { success: false, reason: "No captionTracks found in page" };
    }

    const captionTracks = JSON.parse(captionsMatch[1]);

    if (!captionTracks || captionTracks.length === 0) {
      return { success: false, reason: "captionTracks array empty" };
    }

    let trackUrl = null;
    for (const track of captionTracks) {
      if (track.languageCode === 'en') {
        trackUrl = track.baseUrl;
        break;
      }
    }

    if (!trackUrl && captionTracks[0]?.baseUrl) {
      trackUrl = captionTracks[0].baseUrl;
    }

    if (!trackUrl) {
      return { success: false, reason: "No caption track URL found" };
    }

    const captionRes = await fetch(trackUrl);
    if (!captionRes.ok) {
      return { success: false, reason: `Caption track returned ${captionRes.status}` };
    }

    const captionText = await captionRes.text();
    const textMatches = captionText.match(/<text[^>]*>([^<]+)<\/text>/g);

    if (!textMatches || textMatches.length === 0) {
      return { success: false, reason: "No text content in captions" };
    }

    const captions = textMatches
      .map(match => {
        const content = match.match(/<text[^>]*>([^<]+)<\/text>/)[1];
        return content.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      })
      .filter(text => text.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (captions.length < 100) {
      return { success: false, reason: `Captions too short (${captions.length} chars)` };
    }

    return { success: true, length: captions.length };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

export default async function handler(req, res) {
  try {
    // Get all churches from database
    const churchRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_accounts?select=id,church_name,youtube_channel&order=church_name.asc`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const churches = await churchRes.json();

    // Test each church's latest video
    const results = await Promise.all(
      churches.map(async (church) => {
        if (!church.youtube_channel) {
          return {
            church_name: church.church_name,
            youtube_channel: null,
            status: "no youtube URL",
            reason: "Missing youtube_channel"
          };
        }

        // Extract video ID from channel URL (get latest video)
        let videoId = null;
        try {
          const channelRes = await fetch(church.youtube_channel, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const channelHtml = await channelRes.text();

          // Look for video ID in channel page
          const videoMatch = channelHtml.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          if (videoMatch) {
            videoId = videoMatch[1];
          }
        } catch (err) {
          return {
            church_name: church.church_name,
            youtube_channel: church.youtube_channel,
            status: "error",
            reason: `Could not fetch channel: ${err.message}`
          };
        }

        if (!videoId) {
          return {
            church_name: church.church_name,
            youtube_channel: church.youtube_channel,
            status: "no videos found",
            reason: "Could not find video ID on channel"
          };
        }

        const captionResult = await getYouTubeCaptions(videoId);

        return {
          church_name: church.church_name,
          youtube_channel: church.youtube_channel,
          video_id: videoId,
          status: captionResult.success ? "✅ captions found" : "❌ no captions",
          reason: captionResult.success ? `${captionResult.length} chars` : captionResult.reason
        };
      })
    );

    // Generate HTML table
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Caption Test Results</title>
  <style>
    body { font-family: Arial; padding: 20px; background: #f5f5f5; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: #333; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .success { color: green; font-weight: bold; }
    .failed { color: red; font-weight: bold; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .summary { margin-bottom: 20px; padding: 15px; background: #e8f4f8; border-left: 4px solid #2196F3; }
  </style>
</head>
<body>
  <h1>Church Caption Test Results</h1>
  <div class="summary">
    <strong>Total:</strong> ${results.length} churches<br>
    <strong class="success">✅ With captions:</strong> ${results.filter(r => r.status.includes('✅')).length}<br>
    <strong class="failed">❌ No captions:</strong> ${results.filter(r => r.status.includes('❌')).length}<br>
    <strong>⚠️ Errors:</strong> ${results.filter(r => r.status === 'error' || r.status === 'no videos found').length}
  </div>

  <table>
    <thead>
      <tr>
        <th>Church</th>
        <th>YouTube Channel</th>
        <th>Status</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${results.map(r => `
        <tr>
          <td><strong>${r.church_name}</strong></td>
          <td>
            ${r.youtube_channel ? `<a href="${r.youtube_channel}" target="_blank">Open Channel</a>` : 'N/A'}
            ${r.video_id ? `<br><small><a href="https://www.youtube.com/watch?v=${r.video_id}" target="_blank">Video: ${r.video_id}</a></small>` : ''}
          </td>
          <td class="${r.status.includes('✅') ? 'success' : 'failed'}">${r.status}</td>
          <td><small>${r.reason}</small></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
