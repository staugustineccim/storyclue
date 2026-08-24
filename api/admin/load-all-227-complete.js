// Load all 227 churches: extract channel IDs from videos via YouTube API, then load into DB
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!YOUTUBE_API_KEY) {
    return res.status(400).json({ error: "YOUTUBE_API_KEY not set in Vercel environment" });
  }

  // All 227 churches with video IDs extracted from verified Excel file
  const allChurches227 = [
    { church_name: "Swift Presbyterian Church", video_id: "bxoW4g3NGJE" },
    { church_name: "Saint Alban's Episcopal Church", video_id: "sxH4Whfy0_Q" },
    { church_name: "La Casa de Cristo Lutheran Church", video_id: "kI4G-62jv_o" },
    { church_name: "St Paul's Episcopal Church", video_id: "Yq862bTGieY" },
    { church_name: "St Paul's Ventura", video_id: "hK-4WhBWoi0" },
    { church_name: "Fresno House of Prayer", video_id: "jV0CSE-s9fM" },
    { church_name: "River of Life Christian Fellowship", video_id: "N8Fyan3Csh8" },
    { church_name: "Just Show Up Church", video_id: "h7DUay5h5zU" },
    { church_name: "LakeHaven Church", video_id: "m1o2J6LvdPg" },
    { church_name: "First Presbyterian Church", video_id: "ClR4wBPo5T8" },
    { church_name: "Grace Baptist Church", video_id: "Ue7iYtViPA4" },
    { church_name: "St John's Cathedral", video_id: "UhUIpNBUBI0" },
    { church_name: "McPherson Baptist Church", video_id: "ccTuu4RFWJg" },
    { church_name: "Calvary Baptist Church", video_id: "viCCIUIfiHs" },
    { church_name: "Poplar Springs North Baptist Church", video_id: "b0LPEwxY87I" },
    { church_name: "West Valley Baptist Church", video_id: "q9AWRdR_5vs" },
    { church_name: "Lake Street Church", video_id: "ZtW0HZytXRk" },
    { church_name: "Park Manor Christian Church", video_id: "YCs5N-zrHSo" },
    { church_name: "Peace Lutheran Church", video_id: "d6JfAM7ENaU" },
    { church_name: "Westminster Presbyterian Church (PCA)", video_id: "6tN7P4MXi-8" },
    { church_name: "St. Timothy's Episcopal Church", video_id: "DSo0W-SMwoY" },
    { church_name: "First Reformed Church", video_id: "rVCUyH63Lq4" },
    { church_name: "Peace Church KC, UCC", video_id: "ToWgah2Z3Jw" },
    { church_name: "RCCG Dominion Palace", video_id: "mZ7D3cpkyEQ" },
    { church_name: "First Baptist Church", video_id: "44irobr5mzs" },
    { church_name: "Village Baptist Church", video_id: "TwOIRZhX6ww" },
    { church_name: "St. John's Congregational Church", video_id: "i79H4M7hRBc" },
    { church_name: "Holy Trinity Lutheran Church", video_id: "spy8U3zBSrU" },
    { church_name: "Royal Oak Church of Christ", video_id: "6GQzIvX1cts" },
    { church_name: "Calvary Bible Church East", video_id: "Ek-YwnmKouc" },
    { church_name: "First Presbyterian Church", video_id: "RdQMgLLxia8" },
    { church_name: "Living Word Church", video_id: "R4z4yuswqDQ" },
    { church_name: "Faith Lutheran Church", video_id: "_caf0VmlHFA" },
    { church_name: "Trinity Lutheran Church", video_id: "FtULmu17O68" },
    { church_name: "Presbyterian Church of the Master", video_id: "5hJfbOPAfxM" },
    { church_name: "Buckley Road Baptist Church", video_id: "3UjM5MR6rkg" },
    { church_name: "Salem Mennonite Church", video_id: "hHWTaBCh-34" },
    { church_name: "Gallery Church", video_id: "ILeCd0n6r_g" },
    { church_name: "St. Dunstan's Episcopal Church", video_id: "_vAjAfvhAws" },
    { church_name: "Killeen Church", video_id: "ljXQKpV5WRY" },
    { church_name: "Westminster Presbyterian Church", video_id: "RuCwdVdZ2-4" },
    { church_name: "ChangePoint Alaska", video_id: "fcb4hdsvuwE" },
    { church_name: "First Presbyterian Church Anchorage", video_id: "Co4ajNQxCEI" },
    { church_name: "GracePoint Church", video_id: "Zd8mD208xEc" },
    { church_name: "First Christian Church", video_id: "QKhQuUTyCSU" },
    { church_name: "Broadway Church of Christ", video_id: "Yod9pnRwSN4" },
    { church_name: "First Baptist Church of Lawrenceburg", video_id: "dJKf93PJqt8" },
    { church_name: "Trinity Presbyterian Church", video_id: "24EEoVd9HqY" },
    { church_name: "Gower Christian Church", video_id: "-qoHrm7dRqg" },
    { church_name: "First Presbyterian Church", video_id: "s6HQMi9JUqU" },
    { church_name: "Hope Lutheran Church", video_id: "Z7_Y1Pum794" },
    { church_name: "Bethany Lutheran Church", video_id: "qsAQU1vvmcA" },
    { church_name: "Christ Church", video_id: "IbhAueYJIbc" },
    { church_name: "Deeper Life Bible Church", video_id: "b6CeG10zOQQ" },
    { church_name: "First Presbyterian Church", video_id: "V1msi3OQcbU" },
    { church_name: "Christian Church of Los Alamos", video_id: "x8Ld9ZAkjs4" },
    { church_name: "Hermosa Church of Christ", video_id: "0Pw2_j5sses" },
    { church_name: "Christ the King Lutheran Church", video_id: "mHyyWKloAhE" },
    { church_name: "First Baptist Church Hendersonville", video_id: "NZkK03iR7uE" },
    { church_name: "Clifton United Methodist Church", video_id: "ClHid34F7bI" },
    { church_name: "Heritage Baptist Church", video_id: "vUIBicxO0WU" },
    { church_name: "Northtown Church of Christ", video_id: "lbVDB7cO670" },
    { church_name: "Trinity Church of the Nazarene", video_id: "TigruP8iEwc" },
    { church_name: "Westminster Presbyterian Church", video_id: "pJDTTJ84Zz8" },
    { church_name: "St. Gabriel's Episcopal Church", video_id: "IP52JFr93VA" },
    { church_name: "Christ Presbyterian Church", video_id: "lCXV0Pllcx4" },
    { church_name: "West End Baptist Church", video_id: "KTfLeT_s6rY" },
    { church_name: "Mount Gilead Church", video_id: "6yMcQps3YsQ" },
    { church_name: "North Jackson Church of Christ", video_id: "a9KKWWV_7yw" },
    { church_name: "Cordata Presbyterian Church", video_id: "2EIXuMj10lk" },
    { church_name: "First Baptist Church of Grafton", video_id: "boYZT7AEyQk" },
    { church_name: "Grace Lutheran Church", video_id: "H_hNbZmMmps" },
    { church_name: "St. Luke's Lutheran Church", video_id: "ASZdxuivlLg" },
    { church_name: "First Congregational UCC", video_id: "OihpR8-T-Hk" },
    { church_name: "The Presbyterian Church of Wyoming", video_id: "YFWN08bOWPc" },
    { church_name: "Christ Lutheran Church", video_id: "jQf3Vs5qGcI" },
    { church_name: "Apostolic Faith Church", video_id: "vOc47eumNnE" },
    { church_name: "Faith Apostolic Church", video_id: "irMStEno-qQ" },
    { church_name: "Pine Grove Missionary Baptist Church", video_id: "_KqryVv_TRc" },
    { church_name: "Southside Baptist Church", video_id: "D2s2-pbjoUM" },
    { church_name: "Highlands Church", video_id: "0DBywyGNzQ0" },
    { church_name: "Household of Faith", video_id: "wHwjm7wcEgU" },
    { church_name: "Mystic Congregational Church", video_id: "s2B9yLxRm1c" },
    { church_name: "First Congregational Church of Old Lyme", video_id: "UCHK-f6oqONi8JMRYO68-0AQ" },
    { church_name: "First Presbyterian Church", video_id: "zuoZBavetL8" },
    { church_name: "Westminster Presbyterian Church", video_id: "nnIyFtAEsc0" },
    { church_name: "Head of Christiana Presbyterian Church", video_id: "h3gHBiPvpIE" },
    { church_name: "Christ Church Exeter", video_id: "UC7r5NH29Lt2r9Ao3zK3tpOA" },
    { church_name: "First Reformed United Church of Christ", video_id: "n_O4W8KpU8k" },
    { church_name: "Fresh Life Church", video_id: "-tzWDn5VSw8" },
    { church_name: "Saint Elizabeth Orthodox Church", video_id: "33W5h8Hu0TA" },
    { church_name: "Idaho Falls Church of Christ", video_id: "SLTGMUOzPuQ" },
    { church_name: "First Presbyterian Church", video_id: "uZlZxfcK340" },
    { church_name: "Valley of Peace Lutheran Church", video_id: "Ej5CspYSmSg" },
    { church_name: "Hope Lutheran Church", video_id: "Da2jK0AwdiE" },
    { church_name: "Our Savior Evangelical Lutheran Church", video_id: "EtJtXXTot2U" },
    { church_name: "Zion American Lutheran Church", video_id: "FUDNZAXeICE" },
    { church_name: "St. Paul’s Lutheran Church", video_id: "qvUD4nF2bOk" },
    { church_name: "First Christian Church", video_id: "EQRv7MBhvEY" },
    { church_name: "McCabe United Methodist Church", video_id: "lcVAOfzdg6A" },
    { church_name: "First Congregational Church of Anchorage", video_id: "FPl7-R7pG5o" },
    { church_name: "True Light Missionary Baptist Church", video_id: "pERN8SjXodk" },
    { church_name: "The Well", video_id: "93UncGxujrs" },
    { church_name: "First Presbyterian Church", video_id: "Z2GoXq-JUYM" },
    { church_name: "Lord of Love Lutheran Church", video_id: "IMRlhmsw5zI" },
    { church_name: "Greater Mount Olive Baptist Church", video_id: "ZbNugN1wrNE" },
    { church_name: "One in the Spirit Christian Church", video_id: "sFdhEBDxKMo" },
    { church_name: "Garden of Prayer Family Worship Center", video_id: "P412f4Ko-tg" },
    { church_name: "Bethel United Church of Christ", video_id: "ukQdggOERqA" },
    { church_name: "Redeemer Lutheran Church", video_id: "2JzA0lb-g1s" },
    { church_name: "McPherson First United Methodist Church", video_id: "xTSVvWhgUMg" },
    { church_name: "Old First Church", video_id: "4hNj6lafWmk" },
    { church_name: "Holland Church", video_id: "cmo4lRSB7DY" },
    { church_name: "Our Saviour's Lutheran Church", video_id: "UC5voFPlcChE0_itwa575nag" },
    { church_name: "Baptist Church in Warren", video_id: "AqP_1jTA0dE" },
    { church_name: "First Baptist Church of Dover", video_id: "O0VpTliCS9w" },
    { church_name: "Old First Church", video_id: "4hNj6lafWmk" },
    { church_name: "Covenant OPC Barre VT", video_id: "-lIl5xgWvrM" },
    { church_name: "Trinity United Methodist Church", video_id: "SdsQpBplOm4" },
    { church_name: "First Baptist Church", video_id: "rwv1-Arfw0k" },
    { church_name: "St. John’s United Methodist Church", video_id: "ca9CTCKbmSc" },
    { church_name: "First Methodist Church", video_id: "L_nrA7BF2jw" },
    { church_name: "Peace First Lutheran Church", video_id: "4TELcPzctxk" },
    { church_name: "Barton Church", video_id: "w_HNDOMjEi4" },
    { church_name: "Community Presbyterian Church", video_id: "A_uE2ME7iO0" },
    { church_name: "Christ the King Lutheran Church", video_id: "SHJtHZlq79Q" },
    { church_name: "Derry Presbyterian Church", video_id: "BRXtx9t_A2Q" },
    { church_name: "Willow Street United Church of Christ", video_id: "jsb1qsjY8W4" },
    { church_name: "First Baptist Church", video_id: "m5wHitYDmP4" },
    { church_name: "St. John’s (Hain’s) UCC", video_id: "Cl_cOcHRMeg" },
    { church_name: "Second Presbyterian Church", video_id: "uedQOwDiov4" },
    { church_name: "Christ the King Lutheran Church", video_id: "tyUwAEIPSu4" },
    { church_name: "Ebenezer Church", video_id: "mavIPjgLcQc" },
    { church_name: "Shiloh Baptist Church", video_id: "CS-o-S_DsUs" },
    { church_name: "Valley Presbyterian Church", video_id: "UCooJzF15QJOpISfBUWk_AHg" },
    { church_name: "Zion Lutheran Church & School", video_id: "Jwn0qTK46xY" },
    { church_name: "St. Joseph Parish", video_id: "Pc-KWKcdAH0" },
    { church_name: "Mile Hi Church", video_id: "YvVsCEXRMt8" },
    { church_name: "Hope United Methodist Church", video_id: "RnwqJ6lKgTc" },
    { church_name: "First Lutheran Church of Redlands", video_id: "uoNFGiwvVmM" },
    { church_name: "First Presbyterian Church", video_id: "UCm59pGZhOll64Teek5d9pwg" },
    { church_name: "Vestavia Hills Baptist Church", video_id: "EnJZtDupzUw" },
    { church_name: "Spirit of the Cross Church", video_id: "UCFUpH7ATEnlOEdkOuMBJe6g" },
    { church_name: "Christ Church International", video_id: "DVpZqYzW7Ps" },
    { church_name: "Higher Ground Church", video_id: "UC5mfy7jWEUGuVMpQ6k6zx1A" },
    { church_name: "Berean Baptist Church", video_id: "_JclUG4synE" },
    { church_name: "Cordova church of Christ", video_id: "WdkSRBE-AQw" },
    { church_name: "First Christian Church", video_id: "nsruoGC5nTU" },
    { church_name: "Deeper Life Bible Church – Burlington", video_id: "LaUTOz6O2i0" },
    { church_name: "New Hope Presbyterian Church", video_id: "ZeRRLJLIjT8" },
    { church_name: "Union Congregational Church", video_id: "La17snliB2o" },
    { church_name: "First Presbyterian Church", video_id: "u0wzayXG6V8" },
    { church_name: "First United Methodist Church", video_id: "UCtguRl7S_8G5R-h7tG0sXDA" },
    { church_name: "Faith Church PCA", video_id: "KS3o4G2hg_c" },
    { church_name: "Gospel Assembly Church", video_id: "UCTo4AH3-wBY-38P5Uypt2_A" },
    { church_name: "Milford Presbyterian Church", video_id: "ty0xHxzMLGA" },
    { church_name: "Trinity Lutheran Church", video_id: "9VQSGmHo3YI" },
    { church_name: "St. James Ev. Lutheran Church", video_id: "aPIjKN7-8vE" },
    { church_name: "St. John’s Lutheran Church", video_id: "AjxYdiiuuXA" },
    { church_name: "Plymouth Presbyterian Church", video_id: "UCjKS4jqa5m66MTNs2cK25Hg" },
    { church_name: "Christ Church Episcopal", video_id: "sTJteDoesL8" },
    { church_name: "University Baptist Church", video_id: "oP7X4Tkza-8" },
    { church_name: "First Presbyterian Church", video_id: "ZV_NLAJTRJo" },
    { church_name: "Swift Creek Baptist Church", video_id: "jW_XU5EL4Ng" },
    { church_name: "Pickens First Baptist Church", video_id: "7rbnRqNW7dc" },
    { church_name: "Bethesda Presbyterian Church", video_id: "UCFWwZlkaNy3WPZkAXhpLnNA" },
    { church_name: "Central United Methodist Church", video_id: "jVOveSk1Fvs" },
    { church_name: "St. John’s Lutheran Church", video_id: "KBqBdepocP0" },
    { church_name: "St. John Lutheran Church", video_id: "IlKH_lbjQoY" },
    { church_name: "South Hill Bible Church", video_id: "6bppt_NS-QU" },
    { church_name: "Grace Lutheran Church", video_id: "Ey9ksbwYOSs" },
    { church_name: "Immanuel Lutheran Church", video_id: "a-G3h_JsGWQ" },
    { church_name: "Fauntleroy Church, UCC", video_id: "5PRGqv_QCLI" },
    { church_name: "Union Presbyterian Church of Endicott", video_id: "sfXhbrrzzgA" },
    { church_name: "Bible Baptist Church", video_id: "Yg0F02slW_o" },
    { church_name: "Skyland United Methodist Church", video_id: "UCwwfT2V-QyuLMcvOoA65aTQ" },
    { church_name: "Grier Heights Presbyterian Church", video_id: "Pe84lM8Gz_U" },
    { church_name: "Centenary United Methodist Church", video_id: "UC1tFCC-s6DSj-luushnmdSA" },
    { church_name: "Atlanta Telugu Church", video_id: "NG0DRUgOMeo" },
    { church_name: "Grace Episcopal Church", video_id: "UCkSzPyR1BIOQRIOG4DsUVcQ" },
    { church_name: "First Baptist Church", video_id: "UCSJb1JacrL4s-dyDbBieeow" },
    { church_name: "Church on the Rock", video_id: "IvZ0EMtF2c4" },
    { church_name: "The Refuge Owasso", video_id: "OkcRH4u9XA4" },
    { church_name: "ELIM Church", video_id: "z3OM5kXooSA" },
    { church_name: "Hillsong Church / Hillsong Worship", video_id: "R_dO8hFyJgk" },
    { church_name: "El Lugar de Su Presencia", video_id: "UCgdpiakw3lGkW27tSwptAow" },
    { church_name: "Calvary Temple", video_id: "UCYaE-blRyiy300gLC-yDRUQ" },
    { church_name: "Lagoinha Church (Igreja Batista da Lagoinha)", video_id: "KUNGTcQJpPc" },
    { church_name: "Igreja Presbiteriana de Pinheiros", video_id: "JMqT5QDgo7g" },
    { church_name: "Christ's Commission Fellowship (CCF)", video_id: "zRy5jiZ_3Zw" },
    { church_name: "First United Methodist Church of Florence", video_id: "n-QVntMBXB8" },
    { church_name: "Tanner Church of Christ", video_id: "XkBw88qndn0" },
    { church_name: "Cedar Grove Church of Christ", video_id: "l0Rb_Yx3c9k" },
    { church_name: "Bethel Lutheran Church", video_id: "kpWl9ou8UDk" },
    { church_name: "Our Savior's Lutheran Church", video_id: "P_pmGeXZ5ME" },
    { church_name: "St. Paul UMC", video_id: "ICMSihwMxSw" },
    { church_name: "Holy Trinity Lutheran Church", video_id: "bVz1KVReS_M" },
    { church_name: "First United Pentecostal Church of Augusta", video_id: "m15je33I_ug" },
    { church_name: "Dorset Church", video_id: "jsqI27XnEmI" },
    { church_name: "Barre Congregational Church", video_id: "o2MZwry84ko" },
    { church_name: "First Church of Monson", video_id: "dL1wJ5_WQ5w" },
    { church_name: "St. John Lutheran Church–Kramer", video_id: "rLGvwRoA2MQ" },
    { church_name: "Federated Church", video_id: "nWX5EzJP8kc" },
    { church_name: "St. Paul Lutheran Church", video_id: "PuC0V9M5ius" },
    { church_name: "Grace & Peace Presbyterian Church", video_id: "w9OqfF2EOzU" },
    { church_name: "Maplewood Presbyterian Church", video_id: "exHzNEVqsCc" },
    { church_name: "St. Andrew Lutheran Church", video_id: "TnwHFeyKA00" },
    { church_name: "Unity Presbyterian Church", video_id: "C3geUBve3Ns" },
    { church_name: "Oregon City Church of Christ", video_id: "TB2WduN4mAA" },
    { church_name: "St. Paul's United Methodist Church", video_id: "PtOP57_knrk" },
    { church_name: "First Baptist Church Pulaski", video_id: "kQBnb4rvQuw" },
    { church_name: "Paradise Church", video_id: "uBIpm226wdY" },
    { church_name: "Good Shepherd Lutheran Church", video_id: "PRt9tEnDQwQ" },
    { church_name: "Houghton Lake Global Methodist Church", video_id: "J69gDRq-Dz4" },
    { church_name: "Grace Lutheran Church", video_id: "sTJcVnhBmeg" },
    { church_name: "First Baptist Church of Lincoln", video_id: "g7v4uKWpjwU" },
    { church_name: "Bethel Church", video_id: "olkqjU6sCxA" },
    { church_name: "MGMC Hawaii", video_id: "EbI8OGmxdig" },
    { church_name: "Manna Church Hawaii", video_id: "5OrPfzJhT4o" },
    { church_name: "St. Andrew's Community Church", video_id: "-ntJwJju8e8" },
    { church_name: "Emmanuel Missionary Baptist Church", video_id: "DqC9UG573uA" },
    { church_name: "First United Methodist Church", video_id: "uk7xlNKqXR0" },
    { church_name: "Bethel Church", video_id: "iIZE0zM6TT0" },
    { church_name: "Open Door Baptist Church", video_id: "oLJUp04cigk" },
    { church_name: "Grace Family Church", video_id: "lRNO5J1CP5M" },
    { church_name: "First Mennonite Church of New Bremen", video_id: "YaeW72cHjwM" },
    { church_name: "Grace Church Chino", video_id: "7kluO7IF_kg" },
    { church_name: "St. Catherine of Siena Church", video_id: "cHWN7lVLiZY" },
    { church_name: "United Church of Colchester", video_id: "z314rSNCrIg" },
    { church_name: "St. Catherine of Siena", video_id: "lhj9uAvZmUY" },
];

  async function getChannelIdFromVideo(videoId) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${YOUTUBE_API_KEY}`
      );
      const data = await res.json();

      if (data.items?.[0]?.snippet?.channelId) {
        return data.items[0].snippet.channelId;
      }
    } catch (err) {
      console.log(`[Load227] Video ${videoId} lookup failed: ${err.message}`);
    }
    return null;
  }

  try {
    console.log(`[Load227] Processing ${allChurches227.length} churches...`);

    // Delete old records
    console.log("[Load227] Deleting old churches...");
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

    console.log(`[Load227] Deleted ${existing.length} old records`);

    // Extract channel IDs and prepare insert data
    const toInsert = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < allChurches227.length; i++) {
      const church = allChurches227[i];

      // Get channel ID from video
      const channelId = await getChannelIdFromVideo(church.video_id);

      if (channelId) {
        toInsert.push({
          church_name: church.church_name,
          youtube_channel: `https://www.youtube.com/channel/${channelId}`,
          pastor_name: "Pastor",
          sender_email: "bob@thepremierproperties.com",
        });
        successCount++;

        if ((i + 1) % 50 === 0) {
          console.log(`[Load227] Processed ${i + 1}/${allChurches227.length}...`);
        }
      } else {
        failCount++;
        console.log(`[Load227] Failed to get channel ID for: ${church.church_name}`);
      }

      // Rate limit YouTube API calls
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Insert into database in batches
    console.log(`[Load227] Inserting ${toInsert.length} churches into database...`);
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
        console.warn(`[Load227] Batch insert failed: ${insertRes.status}`);
      }
    }

    console.log(`[Load227] Complete!`);

    return res.json({
      success: true,
      deleted_old: existing.length,
      processed: allChurches227.length,
      extracted_channel_ids: successCount,
      failed: failCount,
      loaded: toInsert.length,
      message: `Extracted channel IDs for ${successCount}/${allChurches227.length} churches and loaded into database`,
    });
  } catch (err) {
    console.error("[Load227] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
