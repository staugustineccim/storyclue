// Load verified churches with confirmed YouTube channel URLs (from ChatGPT-verified Excel)
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 77 verified churches with confirmed YouTube Channel URLs (Column 6 of verified Excel sheet)
  const churches = [
    { church_name: "LakeHaven Church", youtube_channel: "https://www.youtube.com/@LakeHavenChurch" },
    { church_name: "St. Thomas Lutheran Church", youtube_channel: "https://www.youtube.com/c/StThomasLutheranChurchBloomington/featured" },
    { church_name: "Gloria Dei Lutheran Church", youtube_channel: "https://www.youtube.com/c/gatheredbygrace" },
    { church_name: "Atonement Lutheran Church", youtube_channel: "https://www.youtube.com/@ALC-OPKS" },
    { church_name: "Gethsemane Lutheran Church", youtube_channel: "https://www.youtube.com/@dapastorindaparish" },
    { church_name: "River Terrace Church", youtube_channel: "https://www.youtube.com/@riverterracechurch-eastlan6315" },
    { church_name: "Presbyterian Church of the Master", youtube_channel: "https://www.youtube.com/@PresbyterianChurchoftheMaster" },
    { church_name: "Lighthouse Church", youtube_channel: "https://music.youtube.com/@Lighthousenv" },
    { church_name: "First Congregational Church of Old Lyme", youtube_channel: "https://www.youtube.com/channel/UCHK-f6oqONi8JMRYO68-0AQ" },
    { church_name: "Hope Church LV", youtube_channel: "https://www.youtube.com/hopechurchlv" },
    { church_name: "Christ Church Exeter", youtube_channel: "https://www.youtube.com/channel/UC7r5NH29Lt2r9Ao3zK3tpOA" },
    { church_name: "Hudson Valley Church of Christ", youtube_channel: "https://www.youtube.com/@NYCCOCHudsonValleyChurch" },
    { church_name: "Pender United Methodist Church", youtube_channel: "https://www.youtube.com/c/PenderUMC/videos" },
    { church_name: "Olympia Unitarian Universalist Congregation", youtube_channel: "https://www.youtube.com/@OlyUUC" },
    { church_name: "Zion American Lutheran Church", youtube_channel: "https://www.youtube.com/@zioneureka" },
    { church_name: "Our Saviour's Lutheran Church", youtube_channel: "https://www.youtube.com/channel/UC5voFPlcChE0_itwa575nag" },
    { church_name: "Baptist Church in Warren", youtube_channel: "https://www.youtube.com/@kevinprov" },
    { church_name: "First Baptist Church of Dover", youtube_channel: "https://www.youtube.com/@firstbaptistchurchofdoverd6583/streams" },
    { church_name: "Covenant OPC Barre VT", youtube_channel: "https://www.youtube.com/@covenantopcbarrevt3992" },
    { church_name: "Second Presbyterian Church", youtube_channel: "https://www.youtube.com/@secondpresbyterianchurchpo2142" },
    { church_name: "Ebenezer Church", youtube_channel: "https://youtube.com/@ebenezerchurch105646" },
    { church_name: "Shiloh Baptist Church", youtube_channel: "https://www.youtube.com/@shilohchurchbridgeportctus9090" },
    { church_name: "Valley Presbyterian Church", youtube_channel: "https://www.youtube.com/channel/UCooJzF15QJOpISfBUWk_AHg" },
    { church_name: "Zion Lutheran Church & School", youtube_channel: "https://www.youtube.com/c/zionlutheranchurchandschoolbethaltoillinois/featured" },
    { church_name: "St. Joseph Parish", youtube_channel: "https://www.youtube.com/@st.josephparishdownersgrov7679" },
    { church_name: "Mile Hi Church", youtube_channel: "https://www.youtube.com/user/MileHiChurch" },
    { church_name: "Hope United Methodist Church", youtube_channel: "https://www.youtube.com/@HopeUMChurch" },
    { church_name: "First Lutheran Church of Redlands", youtube_channel: "https://www.youtube.com/@firstlutheranchurchofredla907" },
    { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/channel/UCm59pGZhOll64Teek5d9pwg" },
    { church_name: "Vestavia Hills Baptist Church", youtube_channel: "https://www.youtube.com/c/VestaviaHillsBaptistChurch" },
    { church_name: "Spirit of the Cross Church", youtube_channel: "https://www.youtube.com/channel/UCFUpH7ATEnlOEdkOuMBJe6g/videos" },
    { church_name: "Christ Church International", youtube_channel: "https://www.youtube.com/c/CCiDothan/videos" },
    { church_name: "Higher Ground Church", youtube_channel: "https://www.youtube.com/channel/UC5mfy7jWEUGuVMpQ6k6zx1A" },
    { church_name: "Berean Baptist Church", youtube_channel: "https://www.youtube.com/@bereanbaptistchurchnashvil915" },
    { church_name: "Cordova church of Christ", youtube_channel: "https://www.youtube.com/@cordovachurchofchrist" },
    { church_name: "First Christian Church", youtube_channel: "https://www.youtube.com/@FirstChristianChurch-LibertyKY" },
    { church_name: "Deeper Life Bible Church – Burlington", youtube_channel: "https://www.youtube.com/@DLBCBurlingtonNJ" },
    { church_name: "New Hope Presbyterian Church", youtube_channel: "https://www.youtube.com/@newhopebridgetonopc" },
    { church_name: "Union Congregational Church", youtube_channel: "https://www.youtube.com/unioncong1" },
    { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/@fpc2450" },
    { church_name: "First United Methodist Church", youtube_channel: "https://www.youtube.com/channel/UCtguRl7S_8G5R-h7tG0sXDA" },
    { church_name: "Faith Church PCA", youtube_channel: "https://www.youtube.com/@FaithChurch-FRPC" },
    { church_name: "Gospel Assembly Church", youtube_channel: "https://www.youtube.com/channel/UCTo4AH3-wBY-38P5Uypt2_A" },
    { church_name: "Milford Presbyterian Church", youtube_channel: "https://www.youtube.com/@MilfordPres" },
    { church_name: "Trinity Lutheran Church", youtube_channel: "https://www.youtube.com/@trinitylutheranchurchrichm8798" },
    { church_name: "St. James Ev. Lutheran Church", youtube_channel: "https://www.youtube.com/@StJamesPortage" },
    { church_name: "Plymouth Presbyterian Church", youtube_channel: "https://www.youtube.com/channel/UCjKS4jqa5m66MTNs2cK25Hg" },
    { church_name: "Christ Church Episcopal", youtube_channel: "https://www.youtube.com/christchurchepiscopalinrva/streams" },
    { church_name: "University Baptist Church", youtube_channel: "https://www.youtube.com/UniversityBaptistChurchCharlottesville" },
    { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/@fpcarlington/streams" },
    { church_name: "Swift Creek Baptist Church", youtube_channel: "https://www.youtube.com/@SwiftCreek" },
    { church_name: "Pickens First Baptist Church", youtube_channel: "https://www.youtube.com/c/PickensFirstBaptistChurch" },
    { church_name: "Bethesda Presbyterian Church", youtube_channel: "https://www.youtube.com/channel/UCFWwZlkaNy3WPZkAXhpLnNA" },
    { church_name: "Central United Methodist Church", youtube_channel: "https://www.youtube.com/c/CentralUnitedMethodistChurch" },
    { church_name: "St. John Lutheran Church", youtube_channel: "https://www.youtube.com/@st.johnlutheranchurch-vanc5277" },
    { church_name: "South Hill Bible Church", youtube_channel: "https://www.youtube.com/shbcspokane" },
    { church_name: "Grace Lutheran Church", youtube_channel: "https://www.youtube.com/@gracelbc" },
    { church_name: "Immanuel Lutheran Church", youtube_channel: "https://www.youtube.com/c/ImmanuelEverettLCMS" },
    { church_name: "Fauntleroy Church, UCC", youtube_channel: "https://www.youtube.com/c/FauntleroyChurchUCC" },
    { church_name: "Union Presbyterian Church of Endicott", youtube_channel: "https://www.youtube.com/@unionpresbyterianchurchofe6293" },
    { church_name: "Bible Baptist Church", youtube_channel: "https://www.youtube.com/@biblebaptistchurch-supplyn5922" },
    { church_name: "Skyland United Methodist Church", youtube_channel: "https://www.youtube.com/channel/UCwwfT2V-QyuLMcvOoA65aTQ" },
    { church_name: "Grier Heights Presbyterian Church", youtube_channel: "https://www.youtube.com/@grierheightspresbyterian7108" },
    { church_name: "Centenary United Methodist Church", youtube_channel: "https://www.youtube.com/channel/UC1tFCC-s6DSj-luushnmdSA" },
    { church_name: "Atlanta Telugu Church", youtube_channel: "https://www.youtube.com/c/atlantateluguchurch" },
    { church_name: "Grace Episcopal Church", youtube_channel: "https://www.youtube.com/channel/UCkSzPyR1BIOQRIOG4DsUVcQ" },
    { church_name: "First Baptist Church", youtube_channel: "https://www.youtube.com/channel/UCSJb1JacrL4s-dyDbBieeow" },
    { church_name: "The Refuge Owasso", youtube_channel: "https://www.youtube.com/@therefugeowasso5833" },
    { church_name: "ELIM Church", youtube_channel: "https://www.youtube.com/@ELIMChurchOklahomaCity" },
    { church_name: "Hillsong Church / Hillsong Worship", youtube_channel: "https://www.youtube.com/hillsong" },
    { church_name: "El Lugar de Su Presencia", youtube_channel: "https://www.youtube.com/channel/UCgdpiakw3lGkW27tSwptAow" },
    { church_name: "City Harvest Church", youtube_channel: "https://www.youtube.com/@cityharvestsg" },
    { church_name: "Calvary Temple", youtube_channel: "https://www.youtube.com/channel/UCYaE-blRyiy300gLC-yDRUQ" },
    { church_name: "Lagoinha Church (Igreja Batista da Lagoinha)", youtube_channel: "https://www.youtube.com/@LagoinhaIBL" },
    { church_name: "Planetshakers Church", youtube_channel: "https://www.youtube.com/@planetshakerstv" },
    { church_name: "Igreja Presbiteriana de Pinheiros", youtube_channel: "https://www.youtube.com/@ippinheiros" },
    { church_name: "Christ's Commission Fellowship (CCF)", youtube_channel: "https://www.youtube.com/@CCFmainTV" },
  ];

  try {
    console.log(`[LoadVerified] Starting load of ${churches.length} verified churches...`);

    // Delete all existing churches
    console.log("[LoadVerified] Deleting old churches...");
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

    console.log(`[LoadVerified] Deleted ${existing.length} old records`);

    // Prepare and insert new churches
    const toInsert = churches.map(c => ({
      church_name: c.church_name,
      youtube_channel: c.youtube_channel,
      pastor_name: "Pastor",
      sender_email: "bob@thepremierproperties.com",
    }));

    console.log(`[LoadVerified] Inserting ${toInsert.length} verified churches...`);

    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += 100) {
      const batch = toInsert.slice(i, i + 100);
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
        },
        body: JSON.stringify(batch),
      });

      if (!insertRes.ok) {
        console.warn(
          `[LoadVerified] Insert batch ${i / 100 + 1} returned ${insertRes.status}`
        );
      } else {
        inserted += batch.length;
      }
    }

    console.log(`[LoadVerified] Complete! Loaded ${inserted} verified churches`);

    return res.json({
      success: true,
      deleted_old: existing.length,
      loaded_verified: inserted,
      message: `Loaded ${inserted} verified churches with confirmed YouTube Channel URLs`,
    });
  } catch (err) {
    console.error("[LoadVerified] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
