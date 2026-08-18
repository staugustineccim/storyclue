// Load real churches with actual YouTube URLs from user research
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  const churchData = [
    { name: "First Congregational UCC", location: "Ocala", url: "https://www.youtube.com/watch?v=OF4CdgtNuRo" },
    { name: "LakeHaven Church", location: "Eustis", url: "https://www.youtube.com/@LakeHavenChurch" },
    { name: "CrossLife Church", location: "Oviedo", url: "https://www.youtube.com/watch?v=dKXS64fuqPE" },
    { name: "St. Mary of the Lakes", location: "Eustis", url: "https://www.youtube.com/@stmaryofthelakesvideos8308" },
    { name: "First Presbyterian Church", location: "Naples", url: "https://www.youtube.com/watch?v=ClR4wBPo5T8" },
    { name: "First Presbyterian Church", location: "Gainesville", url: "https://www.youtube.com/watch?v=CrpSphqgtQ8" },
    { name: "First City Church", location: "Pensacola", url: "https://www.youtube.com/watch?v=OHlAPzbbnFA" },
    { name: "Grace Baptist Church", location: "Quincy", url: "https://www.youtube.com/watch?v=Ue7iYtViPA4" },
    { name: "Rio Vista Church", location: "Fort Lauderdale", url: "https://www.youtube.com/watch?v=SQhFWVEzLkg" },
    { name: "St. Cyprian's Episcopal Church", location: "St. Augustine", url: "https://www.youtube.com/watch?v=k_W1PgSSYa4" },
    { name: "First Presbyterian Church", location: "Haines City", url: "https://www.youtube.com/watch?v=vqr4dmRVvZg" },
    { name: "Faith Baptist Church", location: "Titusville", url: "https://www.youtube.com/watch?v=uBzrKbMxjfY" },
    { name: "Park Lake Presbyterian Church", location: "Orlando", url: "https://www.youtube.com/watch?v=zhtcyRKIXrI" },
    { name: "Faith Lutheran Church", location: "Sebring", url: "https://www.youtube.com/watch?v=3TCefX8SvPk" },
    { name: "Jesus Miracle Church", location: "Miami", url: "https://www.youtube.com/watch?v=LaOUlnm8dUs" },
    { name: "Grace Presbyterian Church", location: "Panama City", url: "https://www.youtube.com/watch?v=NAbD9ESraKc" },
  ];

  try {
    // Delete all existing records
    console.log('[LoadReal] Clearing existing records...');
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const existing = await getRes.json();

    if (existing.length > 0) {
      const filter = existing.map(r => `id=eq.${r.id}`).join(',or.');
      await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${filter}`, {
        method: 'DELETE',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      });
      console.log(`[LoadReal] Deleted ${existing.length} old records`);
    }

    // For each church, resolve video URLs to channel URLs
    const resolved = [];
    for (const church of churchData) {
      let youtubeChannel = church.url;

      // If it's a video URL, try to get the channel
      if (church.url.includes('watch?v=')) {
        const videoId = church.url.match(/v=([^&]+)/)?.[1];
        if (videoId && YOUTUBE_API_KEY) {
          try {
            const vidRes = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${YOUTUBE_API_KEY}`
            );
            const vidData = await vidRes.json();
            if (vidData.items?.[0]?.snippet?.channelId) {
              youtubeChannel = `https://www.youtube.com/channel/${vidData.items[0].snippet.channelId}`;
              console.log(`[LoadReal] Resolved ${videoId} to channel: ${vidData.items[0].snippet.channelId}`);
            }
          } catch (err) {
            console.log(`[LoadReal] Could not resolve video ${videoId}: ${err.message}`);
          }
        }
      }

      resolved.push({
        church_name: church.name,
        youtube_channel: youtubeChannel,
        pastor_name: "Pastor",
        sender_email: "bob@thepremierproperties.com",
      });
    }

    // Insert resolved churches
    console.log(`[LoadReal] Inserting ${resolved.length} churches...`);
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(resolved),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      throw new Error(`Insert failed: ${err}`);
    }

    const inserted = await insertRes.json();
    console.log(`[LoadReal] Inserted ${Array.isArray(inserted) ? inserted.length : 1} records`);

    return res.json({
      success: true,
      deleted_old: existing.length,
      inserted_new: resolved.length,
      churches: resolved.slice(0, 3),
    });

  } catch (err) {
    console.error('[LoadReal] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
