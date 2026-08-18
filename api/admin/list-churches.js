// List all churches with YouTube URLs and last updated
export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    const fetchRes = await fetch(
      `${supabaseUrl}/rest/v1/church_accounts?select=church_name,youtube_channel,updated_at&order=church_name.asc&limit=100`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!fetchRes.ok) {
      return res.status(500).json({ error: `Fetch failed: ${fetchRes.status}` });
    }

    const churches = await fetchRes.json();

    return res.status(200).json({
      total: churches.length,
      churches: churches.map((c, i) => ({
        "#": i + 1,
        church: c.church_name,
        youtube_url: c.youtube_channel,
        updated_at: c.updated_at ? new Date(c.updated_at).toISOString().split('T')[0] : 'N/A',
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
