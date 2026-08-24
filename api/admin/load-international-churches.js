// Load only the 6 international verified churches for testing
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 6 verified international churches
  const churches = [
    { church_name: "Hillsong Church / Hillsong Worship", youtube_channel: "https://www.youtube.com/hillsong" },
    { church_name: "Calvary Temple", youtube_channel: "https://www.youtube.com/channel/UCYaE-blRyiy300gLC-yDRUQ" },
    { church_name: "Lagoinha Church (Igreja Batista da Lagoinha)", youtube_channel: "https://www.youtube.com/@LagoinhaIBL" },
    { church_name: "Planetshakers Church", youtube_channel: "https://www.youtube.com/@planetshakerstv" },
    { church_name: "Igreja Presbiteriana de Pinheiros", youtube_channel: "https://www.youtube.com/@ippinheiros" },
    { church_name: "Christ's Commission Fellowship (CCF)", youtube_channel: "https://www.youtube.com/@CCFmainTV" },
  ];

  try {
    console.log(`[LoadIntl] Starting load of ${churches.length} international churches...`);

    // Delete all existing churches
    console.log("[LoadIntl] Deleting old churches...");
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const existing = await getRes.json();

    if (Array.isArray(existing) && existing.length > 0) {
      for (let i = 0; i < existing.length; i += 100) {
        const batch = existing.slice(i, i + 100);
        const ids = batch.map(r => `id=eq.${r.id}`).join(",or.");
        await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${ids}`, {
          method: "DELETE",
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        });
      }
    }

    console.log(`[LoadIntl] Deleted ${existing.length} old records`);

    // Prepare and insert new churches
    const toInsert = churches.map(c => ({
      church_name: c.church_name,
      youtube_channel: c.youtube_channel,
      pastor_name: "Pastor",
      sender_email: "bob@thepremierproperties.com",
    }));

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(toInsert),
    });

    if (!insertRes.ok) {
      throw new Error(`Insert failed: ${insertRes.status}`);
    }

    console.log(`[LoadIntl] Loaded ${churches.length} international churches`);

    return res.json({
      success: true,
      deleted_old: existing.length,
      loaded_intl: churches.length,
      message: `Loaded ${churches.length} international churches: Australia (2), Brazil (2), India (1), Philippines (1)`,
    });
  } catch (err) {
    console.error("[LoadIntl] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
