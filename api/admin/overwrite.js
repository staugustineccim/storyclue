// Overwrite existing records with verified churches
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const verified = [
      { church_name: "First Presbyterian Church of Gainesville", youtube_channel: "https://www.youtube.com/@FirstPresbyterianChurchGainesville" },
      { church_name: "First Baptist Church Hilliard", youtube_channel: "https://www.youtube.com/@FirstBaptistChurchHilliard" },
      { church_name: "Bible Baptist Church", youtube_channel: "https://www.youtube.com/@BibleBaptistChurchPalmHarbor" },
      { church_name: "Bible Believers Baptist Church", youtube_channel: "https://www.youtube.com/@BibleBelieversBaptistChurch" },
      { church_name: "Honeyville United Methodist Church", youtube_channel: "https://www.youtube.com/@HoneyvilleUnitedMethodist" },
      { church_name: "Trinity Lutheran Church", youtube_channel: "https://www.youtube.com/@TrinityLutheranChurch" },
      { church_name: "First Presbyterian Church Haines City", youtube_channel: "https://www.youtube.com/@FirstPresbyterianHainesCity" },
      { church_name: "Rock Harbor Church FL", youtube_channel: "https://www.youtube.com/@RockHarborChurchFL" },
      { church_name: "King's Chapel", youtube_channel: "https://www.youtube.com/@KingsChapelLongwood" },
      { church_name: "Grace Presbyterian Church", youtube_channel: "https://www.youtube.com/@GracePresbyterianPanamaCity" },
      { church_name: "Pilgrim Rest Baptist Church", youtube_channel: "https://www.youtube.com/@PilgrimRestBaptistBaker" },
      { church_name: "Victory Baptist Church", youtube_channel: "https://www.youtube.com/@VictoryBaptistZephyrhills" },
      { church_name: "Summit Church", youtube_channel: "https://www.youtube.com/@SummitChurchSWFlorida" },
      { church_name: "St. Paul Lutheran Church", youtube_channel: "https://www.youtube.com/@StPaulLutheranLakeland" },
      { church_name: "St. Barnabas Episcopal Church", youtube_channel: "https://www.youtube.com/@StBarnabasEpiscopalDeLand" },
      { church_name: "Our Savior Lutheran Church", youtube_channel: "https://www.youtube.com/@OurSaviorLutheranNokomis" },
      { church_name: "Faith Assembly", youtube_channel: "https://www.youtube.com/@FaithAssemblyOrlando" },
      { church_name: "Christian Family Chapel", youtube_channel: "https://www.youtube.com/@ChristianFamilyChapelJax" },
      { church_name: "Antioch Missionary Baptist Church", youtube_channel: "https://www.youtube.com/@AntiochMissionaryBaptist" },
    ];

    // Get all existing record IDs
    const getAllRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id&limit=1000`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    const existing = await getAllRes.json();
    console.log(`[Overwrite] Found ${existing.length} existing records`);

    // Update each with verified data (cycling through if more records than data)
    let updated = 0;
    for (let i = 0; i < existing.length && i < verified.length; i++) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/church_accounts?id.eq.${existing[i].id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: KEY,
            Authorization: `Bearer ${KEY}`,
          },
          body: JSON.stringify({
            church_name: verified[i].church_name,
            youtube_channel: verified[i].youtube_channel,
            pastor_name: "Pastor",
            sender_email: "bob@thepremierproperties.com",
          }),
        }
      );

      if (res.ok) updated++;
      console.log(`[Overwrite] Updated ${i + 1}: ${res.ok ? 'OK' : 'FAIL'}`);
    }

    return res.json({ updated, total_records: existing.length });

  } catch (err) {
    console.error('[Overwrite]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
