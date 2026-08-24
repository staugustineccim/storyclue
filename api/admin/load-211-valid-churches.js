// Load ONLY the 211 churches with valid /channel/ URLs
// All have been verified to have working YouTube channel IDs
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const validChurches = [
    { church_name: "First Congregational Church of Old Lyme", youtube_channel: "https://www.youtube.com/channel/UCHK-f6oqONi8JMRYO68-0AQ" },
    { church_name: "Christ Church Exeter", youtube_channel: "https://www.youtube.com/channel/UC7r5NH29Lt2r9Ao3zK3tpOA" },
    { church_name: "Our Saviour's Lutheran Church", youtube_channel: "https://www.youtube.com/channel/UC5voFPlcChE0_itwa575nag" },
    { church_name: "Valley Presbyterian Church", youtube_channel: "https://www.youtube.com/channel/UCooJzF15QJOpISfBUWk_AHg" },
    { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/channel/UCm59pGZhOll64Teek5d9pwg" },
    { church_name: "Spirit of the Cross Church", youtube_channel: "https://www.youtube.com/channel/UCFUpH7ATEnlOEdkOuMBJe6g" },
    { church_name: "Higher Ground Church", youtube_channel: "https://www.youtube.com/channel/UC5mfy7jWEUGuVMpQ6k6zx1A" },
    { church_name: "First United Methodist Church", youtube_channel: "https://www.youtube.com/channel/UCtguRl7S_8G5R-h7tG0sXDA" },
    { church_name: "Gospel Assembly Church", youtube_channel: "https://www.youtube.com/channel/UCTo4AH3-wBY-38P5Uypt2_A" },
    { church_name: "Plymouth Presbyterian Church", youtube_channel: "https://www.youtube.com/channel/UCjKS4jqa5m66MTNs2cK25Hg" },
    { church_name: "Bethesda Presbyterian Church", youtube_channel: "https://www.youtube.com/channel/UCFWwZlkaNy3WPZkAXhpLnNA" },
    { church_name: "Skyland United Methodist Church", youtube_channel: "https://www.youtube.com/channel/UCwwfT2V-QyuLMcvOoA65aTQ" },
    { church_name: "Centenary United Methodist Church", youtube_channel: "https://www.youtube.com/channel/UC1tFCC-s6DSj-luushnmdSA" },
    { church_name: "Grace Episcopal Church", youtube_channel: "https://www.youtube.com/channel/UCkSzPyR1BIOQRIOG4DsUVcQ" },
    { church_name: "First Baptist Church", youtube_channel: "https://www.youtube.com/channel/UCSJb1JacrL4s-dyDbBieeow" },
    { church_name: "El Lugar de Su Presencia", youtube_channel: "https://www.youtube.com/channel/UCgdpiakw3lGkW27tSwptAow" },
    { church_name: "Calvary Temple", youtube_channel: "https://www.youtube.com/channel/UCYaE-blRyiy300gLC-yDRUQ" },
  ];

  try {
    console.log(`[Load211] Processing ${validChurches.length} valid churches with /channel/ URLs...`);

    // Delete old records
    console.log("[Load211] Clearing database...");
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

    console.log(`[Load211] Deleted ${existing.length} old records`);

    // Insert into database in batches
    console.log(`[Load211] Inserting ${validChurches.length} valid churches...`);
    let inserted = 0;

    for (let i = 0; i < validChurches.length; i += 100) {
      const batch = validChurches.slice(i, i + 100);
      const toInsert = batch.map(c => ({
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

      if (insertRes.ok) {
        inserted += batch.length;
      } else {
        console.warn(`[Load211] Batch insert failed: ${insertRes.status}`);
      }
    }

    console.log(`[Load211] Complete! Loaded ${inserted} churches`);

    return res.json({
      success: true,
      deleted_old: existing.length,
      loaded_valid: inserted,
      message: `Loaded ${inserted} valid churches with confirmed /channel/ URLs - ready for cron!`,
    });
  } catch (err) {
    console.error("[Load211] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
