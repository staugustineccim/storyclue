// Simple load of churches with verified URLs
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const churches = [
    { church_name: "First Congregational UCC", youtube_channel: "https://www.youtube.com/watch?v=OF4CdgtNuRo" },
    { church_name: "LakeHaven Church", youtube_channel: "https://www.youtube.com/@LakeHavenChurch" },
    { church_name: "CrossLife Church", youtube_channel: "https://www.youtube.com/watch?v=dKXS64fuqPE" },
    { church_name: "St. Mary of the Lakes", youtube_channel: "https://www.youtube.com/@stmaryofthelakesvideos8308" },
    { church_name: "First Presbyterian Church Naples", youtube_channel: "https://www.youtube.com/watch?v=ClR4wBPo5T8" },
    { church_name: "First Presbyterian Church Gainesville", youtube_channel: "https://www.youtube.com/watch?v=CrpSphqgtQ8" },
    { church_name: "First City Church", youtube_channel: "https://www.youtube.com/watch?v=OHlAPzbbnFA" },
    { church_name: "Grace Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=Ue7iYtViPA4" },
    { church_name: "Rio Vista Church", youtube_channel: "https://www.youtube.com/watch?v=SQhFWVEzLkg" },
    { church_name: "St. Cyprian's Episcopal Church", youtube_channel: "https://www.youtube.com/watch?v=k_W1PgSSYa4" },
    { church_name: "First Presbyterian Church Haines City", youtube_channel: "https://www.youtube.com/watch?v=vqr4dmRVvZg" },
    { church_name: "Faith Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=uBzrKbMxjfY" },
    { church_name: "Park Lake Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=zhtcyRKIXrI" },
    { church_name: "Faith Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=3TCefX8SvPk" },
    { church_name: "Jesus Miracle Church", youtube_channel: "https://www.youtube.com/watch?v=LaOUlnm8dUs" },
    { church_name: "Grace Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=NAbD9ESraKc" },
  ];

  try {
    // Get all existing records
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const existing = await getRes.json();

    // Delete all if any exist
    if (Array.isArray(existing) && existing.length > 0) {
      const filter = existing.map(r => `id=eq.${r.id}`).join(',or.');
      await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${filter}`, {
        method: 'DELETE',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      });
    }

    // Add pastor/email fields
    const toInsert = churches.map(c => ({
      ...c,
      pastor_name: "Pastor",
      sender_email: "bob@thepremierproperties.com",
    }));

    // Insert
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(toInsert),
    });

    const result = await insertRes.text();
    return res.json({ success: insertRes.ok, inserted: churches.length });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
