// Manual trigger for Sunday sermon cron - run immediately
// This is the same logic as the scheduled cron but callable on-demand

// Email will be sent via sendStatusEmail function in main cron

async function getChannelIdFromUrl(channelUrl) {
  const directMatch = channelUrl.match(/\/channel\/(UC[^/?]+)/);
  if (directMatch) return directMatch[1];

  if (channelUrl.includes("/@") || channelUrl.includes("/c/") || channelUrl.includes("/user/")) {
    try {
      const res = await fetch(channelUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const match = html.match(/"channelId":"(UC[^"]+)"/);
      if (match) return match[1];
    } catch (err) {
      console.log(`[Channel] Failed to fetch: ${err.message}`);
    }
  }

  if (channelUrl.includes("/watch?v=") || channelUrl.includes("?v=")) {
    try {
      const res = await fetch(channelUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const match = html.match(/"channelId":"(UC[^"]+)"/);
      if (match) return match[1];
    } catch (err) {
      console.log(`[Channel] Failed to fetch: ${err.message}`);
    }
  }

  return null;
}

async function getYouTubeCaptions(videoId) {
  try {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
    const res = await withTimeout(fetch(url), 5000);

    if (!res.ok) {
      console.log(`[Church] Transcript not available (HTTP ${res.status})`);
      return null;
    }

    const text = await res.text();
    if (!text || text.length === 0) {
      console.log(`[Church] Empty response from YouTube`);
      return null;
    }

    const textMatches = text.match(/<text[^>]*>([^<]+)<\/text>/g);
    if (!textMatches || textMatches.length === 0) {
      console.log(`[Church] No text in transcript`);
      return null;
    }

    const captions = textMatches
      .map(match => {
        const content = match.match(/<text[^>]*>([^<]+)<\/text>/)[1];
        return content
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
      })
      .filter(text => text.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (captions.length < 100) {
      console.log(`[Church] Captions too short (${captions.length} chars)`);
      return null;
    }

    console.log(`[Church] Got transcript (${captions.length} characters)`);
    return captions;
  } catch (err) {
    console.log(`[Church] Error fetching transcript:`, err.message);
    return null;
  }
}

async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

async function getNewestVideo(channelUrl) {
  try {
    // Extract channel ID from URL
    let channelId = null;
    const directMatch = channelUrl.match(/\/channel\/(UC[^/?]+)/);
    if (directMatch) {
      channelId = directMatch[1];
    } else {
      // Try to fetch and parse the channel page for channel ID (with timeout)
      try {
        const res = await withTimeout(
          fetch(channelUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
          5000
        );
        const html = await res.text();
        const match = html.match(/"channelId":"(UC[^"]+)"/);
        if (match) channelId = match[1];
      } catch (err) {
        console.log(`[Video] Channel fetch failed: ${err.message}`);
      }
    }

    if (!channelId) return null;

    // Use RSS feed - this always works and doesn't require JavaScript
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRes = await withTimeout(fetch(rssUrl), 5000);
    if (!rssRes.ok) return null;

    const rssText = await rssRes.text();

    // Parse RSS for latest video
    const entryMatch = rssText.match(/<entry>\s*<id>yt:video:([a-zA-Z0-9_-]{11})<\/id>.*?<title>([^<]+)<\/title>.*?<published>([^<]+)<\/published>/s);
    if (!entryMatch) return null;

    return {
      videoId: entryMatch[1],
      title: entryMatch[2],
      published: new Date(entryMatch[3])
    };
  } catch (err) {
    console.log(`[Video] Error: ${err.message}`);
    return null;
  }
}

async function sendStatusEmail(results) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] RESEND_API_KEY not set, skipping`);
    return;
  }

  const seen = new Set();
  const uniqueResults = results.filter(r => {
    if (seen.has(r.church)) return false;
    seen.add(r.church);
    return true;
  });

  const stats = {
    total: uniqueResults.length,
    waiting: uniqueResults.filter(r => r.status.includes("waiting")).length,
    generated: uniqueResults.filter(r => r.status.includes("puzzle") || r.status.includes("transcript")).length,
    errors: uniqueResults.filter(r => r.status.includes("no channel") || r.error).length
  };

  const html = `<div style="font-family:Arial;max-width:700px;margin:0 auto;padding:20px;background:#fafafa">
<h2>Church Sermon Cron Results</h2>
<div style="background:#f0f0f0;padding:15px;border-radius:5px;margin:15px 0">
  <p><strong>Total churches processed:</strong> ${stats.total}</p>
  <p style="color:green"><strong>✅ Transcripts fetched:</strong> ${stats.generated}</p>
  <p style="color:orange"><strong>⏳ Waiting for captions:</strong> ${stats.waiting}</p>
  <p style="color:red"><strong>❌ Errors/Skipped:</strong> ${stats.errors}</p>
</div>
<table style="width:100%;border-collapse:collapse;background:white">
  <tr style="background:#333;color:white">
    <th style="padding:12px;text-align:left">Church</th>
    <th style="padding:12px;text-align:left">Status</th>
    <th style="padding:12px;text-align:left">Details</th>
  </tr>
  ${uniqueResults.map(r => `
  <tr style="border-bottom:1px solid #ddd">
    <td style="padding:12px"><strong>${r.church}</strong></td>
    <td style="padding:12px">${r.status}</td>
    <td style="padding:12px"><small>${r.reason || r.error || 'N/A'}</small></td>
  </tr>
  `).join('')}
</table>
<p style="color:#999;font-size:11px;margin-top:20px">Timestamp: ${new Date().toISOString()}</p>
</div>`;

  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StoryClue <puzzles@storyclue.ai>",
        to: "bob@thepremierproperties.com",
        subject: `✅ Manual Cron Run: ${stats.total} churches (${stats.generated} transcripts fetched)`,
        html: html
      })
    });
    const data = await emailRes.json();
    console.log(`[Email] Response:`, data);
  } catch (err) {
    console.error(`[Email] Failed: ${err.message}`);
  }
}

export default async function handler(req, res) {
  console.log(`[Cron] Manual run started`);

  try {
    const churchRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_accounts?select=id,church_name,pastor_name,sender_email,youtube_channel&limit=1000&order=church_name.asc`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!churchRes.ok) {
      return res.status(500).json({ error: `DB query failed: ${churchRes.status}` });
    }

    let churches = await churchRes.json();
    console.log(`[Cron] DB returned ${Array.isArray(churches) ? churches.length : 0} records`);
    if (!Array.isArray(churches)) churches = [];

    // Deduplicate by church_name - keep first occurrence only
    const seen = new Set();
    const uniqueChurches = [];
    for (const church of churches) {
      if (!seen.has(church.church_name)) {
        seen.add(church.church_name);
        uniqueChurches.push(church);
      }
    }

    console.log(`[Cron] Found ${uniqueChurches.length} unique churches (from ${churches.length} total records)`);

    const results = [];

    // Process churches in parallel (3 at a time to avoid overwhelming APIs)
    for (let i = 0; i < uniqueChurches.length; i += 3) {
      const batch = uniqueChurches.slice(i, i + 3);
      await Promise.all(
        batch.map(async (church) => {
          try {
            if (!church.youtube_channel) {
              results.push({ church: church.church_name, status: "no youtube URL", reason: "Missing URL" });
              return;
            }

            const video = await getNewestVideo(church.youtube_channel);
            if (!video) {
              results.push({ church: church.church_name, status: "no videos", reason: "No videos found on channel" });
              return;
            }

            const captions = await getYouTubeCaptions(video.videoId);
            if (!captions) {
              results.push({
                church: church.church_name,
                status: "waiting for captions",
                reason: `Video: ${video.title} | ${video.published.toISOString().split('T')[0]}`
              });
              return;
            }

            results.push({
              church: church.church_name,
              status: "✅ transcript fetched",
              reason: `Video: ${video.title} | ${captions.length} chars fetched`
            });
          } catch (churchErr) {
            results.push({
              church: church.church_name,
              status: "error",
              reason: churchErr.message
            });
          }
        })
      );
    }

    // Queue email send in background (don't wait for it)
    sendStatusEmail(results).catch(err => console.error(`[Email] Error:`, err));

    return res.status(200).json({
      message: `Processed ${results.length} churches. Email sent to bob@thepremierproperties.com`,
      results: results
    });
  } catch (err) {
    console.error(`[Cron] Error: ${err.message}`);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
