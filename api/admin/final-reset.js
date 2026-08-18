// Final reset with proper WHERE clause deletion
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    console.log('[FinalReset] Fetching all church IDs...');

    // Get all records
    const allRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const all = await allRes.json();
    console.log(`[FinalReset] Found ${all.length} total records`);

    // Delete each one by ID
    if (all.length > 0) {
      const filter = all.map(r => `id.eq.${r.id}`).join(',or.');
      console.log(`[FinalReset] Deleting via filter...`);
      await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${filter}`, {
        method: 'DELETE',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      });
    }

    console.log('[FinalReset] Loading 19 verified churches...');

    const verified = [
      { church_name: "First Presbyterian Church of Gainesville", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@FirstPresbyterianChurchGainesville" },
      { church_name: "First Baptist Church Hilliard", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@FirstBaptistChurchHilliard" },
      { church_name: "Bible Baptist Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@BibleBaptistChurchPalmHarbor" },
      { church_name: "Bible Believers Baptist Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@BibleBelieversBaptistChurch" },
      { church_name: "Honeyville United Methodist Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@HoneyvilleUnitedMethodist" },
      { church_name: "Trinity Lutheran Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@TrinityLutheranChurch" },
      { church_name: "First Presbyterian Church Haines City", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@FirstPresbyterianHainesCity" },
      { church_name: "Rock Harbor Church FL", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@RockHarborChurchFL" },
      { church_name: "King's Chapel", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@KingsChapelLongwood" },
      { church_name: "Grace Presbyterian Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@GracePresbyterianPanamaCity" },
      { church_name: "Pilgrim Rest Baptist Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@PilgrimRestBaptistBaker" },
      { church_name: "Victory Baptist Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@VictoryBaptistZephyrhills" },
      { church_name: "Summit Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@SummitChurchSWFlorida" },
      { church_name: "St. Paul Lutheran Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@StPaulLutheranLakeland" },
      { church_name: "St. Barnabas Episcopal Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@StBarnabasEpiscopalDeLand" },
      { church_name: "Our Savior Lutheran Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@OurSaviorLutheranNokomis" },
      { church_name: "Faith Assembly", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@FaithAssemblyOrlando" },
      { church_name: "Christian Family Chapel", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@ChristianFamilyChapelJax" },
      { church_name: "Antioch Missionary Baptist Church", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com", youtube_channel: "https://www.youtube.com/@AntiochMissionaryBaptist" },
    ];

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(verified),
    });

    console.log(`[FinalReset] Insert response: ${insertRes.status}`);
    let inserted;
    try {
      inserted = await insertRes.json();
    } catch (e) {
      const text = await insertRes.text();
      console.log(`[FinalReset] Insert response text: ${text}`);
      inserted = text;
    }
    console.log(`[FinalReset] Inserted: ${Array.isArray(inserted) ? inserted.length : typeof inserted}`);

    return res.status(200).json({
      deleted: all.length,
      inserted: verified.length,
      success: true,
    });
  } catch (err) {
    console.error('[FinalReset] Error:', err.message);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
