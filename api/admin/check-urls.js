// Check what youtube_channel values are actually in DB
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const sample = await fetch(
      `${SUPABASE_URL}/rest/v1/church_accounts?select=church_name,youtube_channel&limit=30`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
    ).then(r => r.json());

    return res.json({
      total_sampled: sample.length,
      with_urls: sample.filter(c => c.youtube_channel).length,
      sample: sample.map(c => ({ name: c.church_name, url: c.youtube_channel ? c.youtube_channel.substring(0, 50) : 'NULL' })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
