// Test if we can fetch YouTube @ channel and extract channelId
export default async function handler(req, res) {
  try {
    const url = "https://www.youtube.com/@FirstPresbyterianChurchGainesville";
    console.log(`[TestYT] Fetching ${url}`);

    const pageRes = await fetch(url);
    const html = await pageRes.text();
    console.log(`[TestYT] Got ${html.length} bytes`);

    // Try different regex patterns
    const patterns = [
      /"channelId":"(UC[^"]+)"/,
      /"\/channel\/(UC[^"]+)"/,
      /ucid":"(UC[^"]+)"/,
      /"channel":"{"id":"(UC[^"]+)"/,
    ];

    const results = {};
    patterns.forEach((pat, i) => {
      const match = html.match(pat);
      results[`pattern_${i}`] = match ? match[1] : null;
    });

    // Show HTML snippet around first 'UC'
    const ucIndex = html.indexOf('UC');
    const snippet = html.substring(Math.max(0, ucIndex - 50), Math.min(html.length, ucIndex + 100));

    return res.json({
      url,
      htmlLength: html.length,
      patternsFound: results,
      htmlSnippetNearUC: snippet,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
