// Load verified Florida churches from master list
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const floridaChurches = [
    { church_name: "LakeHaven Church", city: "Eustis", youtube_channel: "https://www.youtube.com/watch?v=m1o2J6LvdPg", verification_date: "2026-08-16", status: "Recent upload verified" },
    { church_name: "First Presbyterian Church", city: "Naples", youtube_channel: "https://www.youtube.com/watch?v=ClR4wBPo5T8", verification_date: "2026-08-16", status: "Recent upload verified" },
    { church_name: "Grace Baptist Church", city: "Quincy", youtube_channel: "https://www.youtube.com/watch?v=Ue7iYtViPA4", verification_date: "2026-08-16", status: "Recent upload verified" },
    { church_name: "St John's Cathedral", city: "Jacksonville", youtube_channel: "https://www.youtube.com/watch?v=UhUIpNBUBI0", verification_date: "2026-08-16", status: "Recent upload verified" },
    { church_name: "Grace Family Church", city: "Port St. Lucie", youtube_channel: "https://www.youtube.com/watch?v=lRNO5J1CP5M", verification_date: "2026-08-16", status: "Recovered qualified Phase 1 record" },
  ];

  try {
    // Delete all existing records
    console.log('[VerifiedFL] Deleting existing records...');
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const existing = await getRes.json();

    if (Array.isArray(existing) && existing.length > 0) {
      const filter = existing.map(r => `id=eq.${r.id}`).join(',or.');
      await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${filter}`, {
        method: 'DELETE',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      });
      console.log(`[VerifiedFL] Deleted ${existing.length} old records`);
    }

    // Prepare insert data
    const toInsert = floridaChurches.map(c => ({
      church_name: c.church_name,
      youtube_channel: c.youtube_channel,
      pastor_name: "Pastor",
      sender_email: "bob@thepremierproperties.com",
    }));

    // Insert verified churches
    console.log(`[VerifiedFL] Inserting ${toInsert.length} verified Florida churches...`);
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
      const err = await insertRes.text();
      throw new Error(`Insert failed: ${err}`);
    }

    console.log(`[VerifiedFL] Inserted successfully`);
    return res.json({
      success: true,
      deleted_old: existing.length,
      inserted_new: toInsert.length,
      churches: floridaChurches.map(c => `${c.church_name} (${c.city})`),
    });

  } catch (err) {
    console.error('[VerifiedFL] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
