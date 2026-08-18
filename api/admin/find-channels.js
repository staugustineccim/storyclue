// Search YouTube API for each church's actual channel
export default async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "YOUTUBE_API_KEY not set" });
  }

  const churches = [
    { name: "First Presbyterian Church of Gainesville", location: "Gainesville, FL" },
    { name: "First Baptist Church Hilliard", location: "Hilliard, FL" },
    { name: "Bible Baptist Church", location: "Palm Harbor, FL" },
    { name: "Bible Believers Baptist Church", location: "Jacksonville, FL" },
    { name: "Honeyville United Methodist Church", location: "Wewahitchka, FL" },
    { name: "Trinity Lutheran Church", location: "Trinity, FL" },
    { name: "First Presbyterian Church", location: "Haines City, FL" },
    { name: "Rock Harbor Church FL", location: "Florida" },
    { name: "King's Chapel", location: "Longwood, FL" },
    { name: "Grace Presbyterian Church", location: "Panama City, FL" },
    { name: "Pilgrim Rest Baptist Church", location: "Baker, FL" },
    { name: "Victory Baptist Church", location: "Zephyrhills, FL" },
    { name: "Summit Church", location: "Southwest Florida" },
    { name: "St. Paul Lutheran Church", location: "Lakeland, FL" },
    { name: "St. Barnabas Episcopal Church", location: "DeLand, FL" },
    { name: "Our Savior Lutheran Church", location: "Nokomis, FL" },
    { name: "Faith Assembly", location: "Orlando, FL" },
    { name: "Christian Family Chapel", location: "Jacksonville, FL" },
    { name: "Antioch Missionary Baptist Church", location: "Miami Gardens, FL" },
  ];

  try {
    const results = [];

    for (const church of churches) {
      const query = `${church.name} YouTube channel`;
      const url = `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(query)}&type=channel&part=snippet&key=${apiKey}&maxResults=1`;

      console.log(`[Find] Searching: ${church.name}`);
      const res = await fetch(url);
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        results.push({
          churchName: church.name,
          location: church.location,
          channelId: channel.id.channelId,
          channelTitle: channel.snippet.title,
          channelUrl: `https://www.youtube.com/channel/${channel.id.channelId}`,
        });
        console.log(`[Find] Found: ${channel.snippet.title} (${channel.id.channelId})`);
      } else {
        results.push({
          churchName: church.name,
          location: church.location,
          channelId: null,
          error: "No channel found",
        });
        console.log(`[Find] Not found: ${church.name}`);
      }
    }

    return res.json({
      total_searched: churches.length,
      found: results.filter(r => r.channelId).length,
      results,
    });

  } catch (err) {
    console.error('[Find] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
