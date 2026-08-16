export default async function handler(req, res) {
  try {
    const sermonRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_sermons?status=eq.waiting_for_captions&limit=5&select=id,sermon_title,video_id,church_account_id&order=created_at.desc`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const sermons = await sermonRes.json();
    
    const results = sermons.map(s => ({
      title: s.sermon_title,
      video_id: s.video_id,
      youtube_url: `https://www.youtube.com/watch?v=${s.video_id}`,
      status: s.status
    }));

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
