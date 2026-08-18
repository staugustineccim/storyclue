// Complete rebuild: delete everything, load only 19 verified churches
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    console.log('[Rebuild] Starting complete reset...');

    // Delete all tables
    console.log('[Rebuild] Deleting church_sermons...');
    await fetch(`${SUPABASE_URL}/rest/v1/church_sermons`, {
      method: 'DELETE',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    console.log('[Rebuild] Deleting puzzles...');
    await fetch(`${SUPABASE_URL}/rest/v1/puzzles`, {
      method: 'DELETE',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    console.log('[Rebuild] Deleting church_accounts...');
    await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
      method: 'DELETE',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    // 19 verified churches with recent videos
    const verifiedChurches = [
      {
        church_name: "First Presbyterian Church of Gainesville",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@FirstPresbyterianChurchGainesville",
      },
      {
        church_name: "First Baptist Church Hilliard",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@FirstBaptistChurchHilliard",
      },
      {
        church_name: "Bible Baptist Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@BibleBaptistChurchPalmHarbor",
      },
      {
        church_name: "Bible Believers Baptist Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@BibleBelieversBaptistChurch",
      },
      {
        church_name: "Honeyville United Methodist Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@HoneyvilleUnitedMethodist",
      },
      {
        church_name: "Trinity Lutheran Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@TrinityLutheranChurch",
      },
      {
        church_name: "First Presbyterian Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@FirstPresbyterianHainesCity",
      },
      {
        church_name: "Rock Harbor Church FL",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@RockHarborChurchFL",
      },
      {
        church_name: "King's Chapel",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@KingsChapelLongwood",
      },
      {
        church_name: "Grace Presbyterian Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@GracePresbyterianPanamaCity",
      },
      {
        church_name: "Pilgrim Rest Baptist Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@PilgrimRestBaptistBaker",
      },
      {
        church_name: "Victory Baptist Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@VictoryBaptistZephyrhills",
      },
      {
        church_name: "Summit Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@SummitChurchSWFlorida",
      },
      {
        church_name: "St. Paul Lutheran Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@StPaulLutheranLakeland",
      },
      {
        church_name: "St. Barnabas Episcopal Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@StBarnabasEpiscopalDeLand",
      },
      {
        church_name: "Our Savior Lutheran Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@OurSaviorLutheranNokomis",
      },
      {
        church_name: "Faith Assembly",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@FaithAssemblyOrlando",
      },
      {
        church_name: "Christian Family Chapel",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@ChristianFamilyChapelJax",
      },
      {
        church_name: "Antioch Missionary Baptist Church",
        pastor_name: "Pastor TBD",
        sender_email: "bob@thepremierproperties.com",
        youtube_channel: "https://www.youtube.com/@AntiochMissionaryBaptist",
      },
    ];

    console.log(`[Rebuild] Inserting ${verifiedChurches.length} verified churches...`);

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(verifiedChurches),
    });

    const inserted = await insertRes.json();
    console.log(`[Rebuild] Inserted ${Array.isArray(inserted) ? inserted.length : 1} churches`);

    return res.status(200).json({
      success: true,
      churches_loaded: verifiedChurches.length,
      message: 'Database reset to 19 verified churches only',
    });

  } catch (err) {
    console.error('[Rebuild] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
