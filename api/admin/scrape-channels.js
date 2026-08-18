// Scrape YouTube search results to find actual church channels
export default async function handler(req, res) {
  const churches = [
    "First Presbyterian Church Gainesville Florida",
    "First Baptist Church Hilliard Florida",
    "Bible Baptist Church Palm Harbor Florida",
    "Bible Believers Baptist Church Jacksonville Florida",
    "Honeyville United Methodist Church Wewahitchka Florida",
    "Trinity Lutheran Church Trinity Florida",
    "First Presbyterian Church Haines City Florida",
    "Rock Harbor Church Florida",
    "King's Chapel Longwood Florida",
    "Grace Presbyterian Church Panama City Florida",
    "Pilgrim Rest Baptist Church Baker Florida",
    "Victory Baptist Church Zephyrhills Florida",
    "Summit Church Southwest Florida",
    "St. Paul Lutheran Church Lakeland Florida",
    "St. Barnabas Episcopal Church DeLand Florida",
    "Our Savior Lutheran Church Nokomis Florida",
    "Faith Assembly Orlando Florida",
    "Christian Family Chapel Jacksonville Florida",
    "Antioch Missionary Baptist Church Miami Gardens Florida",
  ];

  try {
    const found = [];

    for (const church of churches) {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(church)}`;
      console.log(`[Scrape] Searching: ${church}`);

      const res = await fetch(searchUrl);
      const html = await res.text();

      // Look for channel URLs in the HTML
      const channelMatch = html.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);

      if (channelMatch) {
        const channelId = channelMatch[1];
        found.push({
          church,
          channelId,
          url: `https://www.youtube.com/channel/${channelId}`,
        });
        console.log(`[Scrape] Found: ${channelId}`);
      } else {
        found.push({ church, error: "Channel not found in search results" });
        console.log(`[Scrape] Not found: ${church}`);
      }
    }

    return res.json({
      total: churches.length,
      found_count: found.filter(f => f.channelId).length,
      results: found,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
