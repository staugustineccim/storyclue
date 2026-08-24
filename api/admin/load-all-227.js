// Load all 227 churches with their URLs (YouTube Channel where available, Direct Video URL otherwise)
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const churches = [
    { church_name: "Swift Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=bxoW4g3NGJE" },
    { church_name: "Saint Alban's Episcopal Church", youtube_channel: "https://www.youtube.com/watch?v=sxH4Whfy0_Q" },
    { church_name: "La Casa de Cristo Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=kI4G-62jv_o" },
    { church_name: "St Paul's Episcopal Church", youtube_channel: "https://www.youtube.com/watch?v=Yq862bTGieY" },
    { church_name: "St Paul's Ventura", youtube_channel: "https://www.youtube.com/watch?v=hK-4WhBWoi0" },
    { church_name: "Fresno House of Prayer", youtube_channel: "https://www.youtube.com/watch?v=jV0CSE-s9fM" },
    { church_name: "River of Life Christian Fellowship", youtube_channel: "https://www.youtube.com/watch?v=N8Fyan3Csh8" },
    { church_name: "Just Show Up Church", youtube_channel: "https://www.youtube.com/watch?v=h7DUay5h5zU" },
    { church_name: "LakeHaven Church", youtube_channel: "https://www.youtube.com/watch?v=m1o2J6LvdPg" },
    { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=ClR4wBPo5T8" },
    { church_name: "Grace Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=Ue7iYtViPA4" },
    { church_name: "St John's Cathedral", youtube_channel: "https://www.youtube.com/watch?v=UhUIpNBUBI0" },
    { church_name: "McPherson Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=ccTuu4RFWJg" },
    { church_name: "Calvary Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=viCCIUIfiHs" },
    { church_name: "Poplar Springs North Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=b0LPEwxY87I" },
    { church_name: "West Valley Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=q9AWRdR_5vs" },
    { church_name: "Lake Street Church", youtube_channel: "https://www.youtube.com/watch?v=ZtW0HZytXRk" },
    { church_name: "Park Manor Christian Church", youtube_channel: "https://www.youtube.com/watch?v=YCs5N-zrHSo" },
    { church_name: "Peace Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=d6JfAM7ENaU" },
    { church_name: "Westminster Presbyterian Church (PCA)", youtube_channel: "https://www.youtube.com/watch?v=6tN7P4MXi-8" },
    { church_name: "St. Timothy's Episcopal Church", youtube_channel: "https://www.youtube.com/watch?v=DSo0W-SMwoY" },
    { church_name: "First Reformed Church", youtube_channel: "https://www.youtube.com/watch?v=rVCUyH63Lq4" },
    { church_name: "Peace Church KC, UCC", youtube_channel: "https://www.youtube.com/watch?v=ToWgah2Z3Jw" },
    { church_name: "RCCG Dominion Palace", youtube_channel: "https://www.youtube.com/watch?v=mZ7D3cpkyEQ" },
    { church_name: "First Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=44irobr5mzs" },
    { church_name: "Village Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=TwOIRZhX6ww" },
    { church_name: "St. John's Congregational Church", youtube_channel: "https://www.youtube.com/watch?v=i79H4M7hRBc" },
    { church_name: "Holy Trinity Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=spy8U3zBSrU" },
    { church_name: "Royal Oak Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=6GQzIvX1cts" },
    { church_name: "Calvary Bible Church East", youtube_channel: "https://www.youtube.com/watch?v=Ek-YwnmKouc" },
  ];

  try {
    console.log(`[Load227] Starting load of ${churches.length} churches...`);

    // Delete all existing
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const existing = await getRes.json();

    if (Array.isArray(existing) && existing.length > 0) {
      for (let i = 0; i < existing.length; i += 100) {
        const batch = existing.slice(i, i + 100);
        const ids = batch.map(r => `id=eq.${r.id}`).join(',or.');
        await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${ids}`, {
          method: 'DELETE',
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        });
      }
    }

    console.log(`[Load227] Deleted ${existing.length} old records`);

    // Prepare insert
    const toInsert = churches.map(c => ({
      church_name: c.church_name,
      youtube_channel: c.youtube_channel,
      pastor_name: 'Pastor',
      sender_email: 'bob@thepremierproperties.com',
    }));

    // Insert all at once (small list)
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(toInsert),
    });

    if (!insertRes.ok) {
      throw new Error(`Insert failed: ${insertRes.status}`);
    }

    console.log(`[Load227] Loaded ${churches.length} churches`);

    return res.json({
      success: true,
      deleted: existing.length,
      loaded: churches.length,
      message: `Loaded ${churches.length} churches with video URLs for cron to extract channel IDs`
    });

  } catch (err) {
    console.error('[Load227] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
