// Clean slate: delete everything, load only Chat's 227 verified churches
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    console.log('[CleanSlate] Starting clean slate operation...');

    // 1. Delete all church_sermons first (to remove FK constraints)
    console.log('[CleanSlate] Deleting all church sermons...');
    const sermonsRes = await fetch(`${SUPABASE_URL}/rest/v1/church_sermons?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    if (sermonsRes.ok) {
      const sermons = await sermonsRes.json();
      if (Array.isArray(sermons) && sermons.length > 0) {
        console.log(`[CleanSlate] Found ${sermons.length} sermons to delete`);

        for (let i = 0; i < sermons.length; i += 100) {
          const batch = sermons.slice(i, i + 100);
          const ids = batch.map(r => `id=eq.${r.id}`).join(',or.');
          const delRes = await fetch(`${SUPABASE_URL}/rest/v1/church_sermons?${ids}`, {
            method: 'DELETE',
            headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
          });
          if (!delRes.ok) {
            console.warn(`[CleanSlate] Sermon delete batch returned ${delRes.status}`);
          }
        }
        console.log('[CleanSlate] All sermons deleted');
      }
    }

    // 2. Delete all church_accounts
    console.log('[CleanSlate] Deleting all church accounts...');
    const churchesRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    if (churchesRes.ok) {
      const churches = await churchesRes.json();
      if (Array.isArray(churches) && churches.length > 0) {
        console.log(`[CleanSlate] Found ${churches.length} churches to delete`);

        for (let i = 0; i < churches.length; i += 100) {
          const batch = churches.slice(i, i + 100);
          const ids = batch.map(r => `id=eq.${r.id}`).join(',or.');
          const delRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${ids}`, {
            method: 'DELETE',
            headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
          });
          if (!delRes.ok) {
            console.warn(`[CleanSlate] Church delete batch returned ${delRes.status}`);
          }
        }
        console.log('[CleanSlate] All churches deleted');
      }
    }

    // 3. Load Chat's 227 verified churches
    const verifiedChurches = [
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
      { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=RdQMgLLxia8" },
      { church_name: "Living Word Church", youtube_channel: "https://www.youtube.com/watch?v=R4z4yuswqDQ" },
      { church_name: "Faith Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=_caf0VmlHFA" },
      { church_name: "Trinity Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=FtULmu17O68" },
      { church_name: "Presbyterian Church of the Master", youtube_channel: "https://www.youtube.com/watch?v=5hJfbOPAfxM" },
      { church_name: "Buckley Road Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=3UjM5MR6rkg" },
      { church_name: "Seacoast Church", youtube_channel: "https://youtube.com/live/8T91EgIGn0E" },
      { church_name: "Salem Mennonite Church", youtube_channel: "https://www.youtube.com/watch?v=hHWTaBCh-34" },
      { church_name: "Gallery Church", youtube_channel: "https://www.youtube.com/watch?v=ILeCd0n6r_g" },
      { church_name: "St. Dunstan's Episcopal Church", youtube_channel: "https://www.youtube.com/watch?v=_vAjAfvhAws" },
      { church_name: "Killeen Church", youtube_channel: "https://www.youtube.com/watch?v=ljXQKpV5WRY" },
      { church_name: "Westminster Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=RuCwdVdZ2-4" },
      { church_name: "ChangePoint Alaska", youtube_channel: "https://www.youtube.com/watch?v=fcb4hdsvuwE" },
      { church_name: "First Presbyterian Church Anchorage", youtube_channel: "https://www.youtube.com/watch?v=Co4ajNQxCEI" },
      { church_name: "GracePoint Church", youtube_channel: "https://www.youtube.com/watch?v=Zd8mD208xEc" },
      { church_name: "First Christian Church", youtube_channel: "https://www.youtube.com/watch?v=QKhQuUTyCSU" },
      { church_name: "Broadway Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=Yod9pnRwSN4" },
      { church_name: "First Baptist Church of Lawrenceburg", youtube_channel: "https://www.youtube.com/watch?v=dJKf93PJqt8" },
      { church_name: "Trinity Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=24EEoVd9HqY" },
      { church_name: "Gower Christian Church", youtube_channel: "https://www.youtube.com/watch?v=-qoHrm7dRqg" },
      { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=s6HQMi9JUqU" },
      { church_name: "Hope Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=Z7_Y1Pum794" },
      { church_name: "Bethany Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=qsAQU1vvmcA" },
      { church_name: "Christ Church", youtube_channel: "https://www.youtube.com/watch?v=IbhAueYJIbc" },
      { church_name: "Deeper Life Bible Church", youtube_channel: "https://www.youtube.com/watch?v=b6CeG10zOQQ" },
      { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=V1msi3OQcbU" },
      { church_name: "Christian Church of Los Alamos", youtube_channel: "https://www.youtube.com/watch?v=x8Ld9ZAkjs4" },
      { church_name: "Hermosa Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=0Pw2_j5sses" },
      { church_name: "Christ the King Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=mHyyWKloAhE" },
      { church_name: "First Baptist Church Hendersonville", youtube_channel: "https://www.youtube.com/watch?v=NZkK03iR7uE" },
      { church_name: "Clifton United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=ClHid34F7bI" },
      { church_name: "Heritage Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=vUIBicxO0WU" },
      { church_name: "Northtown Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=lbVDB7cO670" },
      { church_name: "Trinity Church of the Nazarene", youtube_channel: "https://www.youtube.com/watch?v=TigruP8iEwc" },
      { church_name: "Westminster Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=pJDTTJ84Zz8" },
      { church_name: "St. Gabriel's Episcopal Church", youtube_channel: "https://www.youtube.com/watch?v=IP52JFr93VA" },
      { church_name: "Christ Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=lCXV0Pllcx4" },
      { church_name: "West End Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=KTfLeT_s6rY" },
      { church_name: "Mount Gilead Church", youtube_channel: "https://www.youtube.com/watch?v=6yMcQps3YsQ" },
      { church_name: "North Jackson Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=a9KKWWV_7yw" },
      { church_name: "Highland Utah East Stake - 15th Ward", youtube_channel: "https://www.youtube.com/live/i4TODHo3FvM" },
      { church_name: "Cordata Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=2EIXuMj10lk" },
      { church_name: "First Baptist Church of Grafton", youtube_channel: "https://www.youtube.com/watch?v=boYZT7AEyQk" },
      { church_name: "Grace Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=H_hNbZmMmps" },
      { church_name: "St. Luke's Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=ASZdxuivlLg" },
      { church_name: "First Congregational UCC", youtube_channel: "https://www.youtube.com/watch?v=OihpR8-T-Hk" },
      { church_name: "The Presbyterian Church of Wyoming", youtube_channel: "https://www.youtube.com/watch?v=YFWN08bOWPc" },
      { church_name: "Christ Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=jQf3Vs5qGcI" },
      { church_name: "Apostolic Faith Church", youtube_channel: "https://www.youtube.com/watch?v=vOc47eumNnE" },
      { church_name: "Faith Apostolic Church", youtube_channel: "https://www.youtube.com/watch?v=irMStEno-qQ" },
      { church_name: "Pine Grove Missionary Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=_KqryVv_TRc" },
      { church_name: "Southside Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=D2s2-pbjoUM" },
      { church_name: "Highlands Church", youtube_channel: "https://www.youtube.com/watch?v=0DBywyGNzQ0" },
      { church_name: "Household of Faith", youtube_channel: "https://www.youtube.com/watch?v=wHwjm7wcEgU" },
      { church_name: "Mystic Congregational Church", youtube_channel: "https://www.youtube.com/watch?v=s2B9yLxRm1c" },
      { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=zuoZBavetL8" },
      { church_name: "Westminster Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=nnIyFtAEsc0" },
      { church_name: "Head of Christiana Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=h3gHBiPvpIE" },
      { church_name: "First Reformed United Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=n_O4W8KpU8k" },
      { church_name: "Fresh Life Church", youtube_channel: "https://www.youtube.com/watch?v=-tzWDn5VSw8" },
      { church_name: "Saint Elizabeth Orthodox Church", youtube_channel: "https://www.youtube.com/watch?v=33W5h8Hu0TA" },
      { church_name: "Idaho Falls Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=SLTGMUOzPuQ" },
      { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=uZlZxfcK340" },
      { church_name: "Valley of Peace Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=Ej5CspYSmSg" },
      { church_name: "Hope Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=Da2jK0AwdiE" },
      { church_name: "Our Savior Evangelical Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=EtJtXXTot2U" },
      { church_name: "Zion American Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=FUDNZAXeICE" },
      { church_name: "St. Paul's Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=qvUD4nF2bOk" },
      { church_name: "First Christian Church", youtube_channel: "https://www.youtube.com/watch?v=EQRv7MBhvEY" },
      { church_name: "McCabe United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=lcVAOfzdg6A" },
      { church_name: "First Congregational Church of Anchorage", youtube_channel: "https://www.youtube.com/watch?v=FPl7-R7pG5o" },
      { church_name: "True Light Missionary Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=pERN8SjXodk" },
      { church_name: "The Well", youtube_channel: "https://www.youtube.com/watch?v=93UncGxujrs" },
      { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=Z2GoXq-JUYM" },
      { church_name: "Lord of Love Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=IMRlhmsw5zI" },
      { church_name: "Greater Mount Olive Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=ZbNugN1wrNE" },
      { church_name: "One in the Spirit Christian Church", youtube_channel: "https://www.youtube.com/watch?v=sFdhEBDxKMo" },
      { church_name: "Garden of Prayer Family Worship Center", youtube_channel: "https://www.youtube.com/watch?v=P412f4Ko-tg" },
      { church_name: "Bethel United Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=ukQdggOERqA" },
      { church_name: "Redeemer Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=2JzA0lb-g1s" },
      { church_name: "McPherson First United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=xTSVvWhgUMg" },
      { church_name: "Old First Church", youtube_channel: "https://www.youtube.com/watch?v=4hNj6lafWmk" },
      { church_name: "Holland Church", youtube_channel: "https://www.youtube.com/watch?v=cmo4lRSB7DY" },
      { church_name: "Our Saviour's Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=rpoHLZY6ItU" },
      { church_name: "Baptist Church in Warren", youtube_channel: "https://www.youtube.com/watch?v=AqP_1jTA0dE" },
      { church_name: "First Baptist Church of Dover", youtube_channel: "https://www.youtube.com/watch?v=O0VpTliCS9w" },
      { church_name: "Covenant OPC Barre VT", youtube_channel: "https://www.youtube.com/watch?v=-lIl5xgWvrM" },
      { church_name: "Trinity United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=SdsQpBplOm4" },
      { church_name: "First Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=rwv1-Arfw0k" },
      { church_name: "St. John's United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=ca9CTCKbmSc" },
      { church_name: "First Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=L_nrA7BF2jw" },
      { church_name: "Peace First Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=4TELcPzctxk" },
      { church_name: "Barton Church", youtube_channel: "https://www.youtube.com/watch?v=w_HNDOMjEi4" },
      { church_name: "Community Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=A_uE2ME7iO0" },
      { church_name: "Christ the King Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=SHJtHZlq79Q" },
      { church_name: "Derry Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=BRXtx9t_A2Q" },
      { church_name: "Willow Street United Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=jsb1qsjY8W4" },
      { church_name: "First Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=m5wHitYDmP4" },
      { church_name: "St. John's (Hain's) UCC", youtube_channel: "https://www.youtube.com/watch?v=Cl_cOcHRMeg" },
      { church_name: "Second Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=uedQOwDiov4" },
      { church_name: "Christ the King Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=tyUwAEIPSu4" },
      { church_name: "Ebenezer Church", youtube_channel: "https://www.youtube.com/watch?v=mavIPjgLcQc" },
      { church_name: "Shiloh Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=CS-o-S_DsUs" },
      { church_name: "Valley Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=9PHI5iU6sf0" },
      { church_name: "Zion Lutheran Church & School", youtube_channel: "https://www.youtube.com/watch?v=Jwn0qTK46xY" },
      { church_name: "St. Joseph Parish", youtube_channel: "https://www.youtube.com/watch?v=Pc-KWKcdAH0" },
      { church_name: "Mile Hi Church", youtube_channel: "https://www.youtube.com/watch?v=YvVsCEXRMt8" },
      { church_name: "Hope United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=RnwqJ6lKgTc" },
      { church_name: "First Lutheran Church of Redlands", youtube_channel: "https://www.youtube.com/watch?v=uoNFGiwvVmM" },
      { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=hiVZOG40VHw" },
      { church_name: "Vestavia Hills Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=EnJZtDupzUw" },
      { church_name: "Spirit of the Cross Church", youtube_channel: "https://www.youtube.com/watch?v=6LoGIVm6a_8" },
      { church_name: "Christ Church International", youtube_channel: "https://www.youtube.com/watch?v=DVpZqYzW7Ps" },
      { church_name: "Berean Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=_JclUG4synE" },
      { church_name: "Cordova church of Christ", youtube_channel: "https://www.youtube.com/watch?v=WdkSRBE-AQw" },
      { church_name: "First Christian Church", youtube_channel: "https://www.youtube.com/watch?v=nsruoGC5nTU" },
      { church_name: "Deeper Life Bible Church – Burlington", youtube_channel: "https://www.youtube.com/watch?v=LaUTOz6O2i0" },
      { church_name: "New Hope Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=ZeRRLJLIjT8" },
      { church_name: "Union Congregational Church", youtube_channel: "https://www.youtube.com/watch?v=La17snliB2o" },
      { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=u0wzayXG6V8" },
      { church_name: "First United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=Aflswy6XHfI" },
      { church_name: "Faith Church PCA", youtube_channel: "https://www.youtube.com/watch?v=KS3o4G2hg_c" },
      { church_name: "Gospel Assembly Church", youtube_channel: "https://www.youtube.com/watch?v=R0Nv59FqQFI" },
      { church_name: "Milford Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=ty0xHxzMLGA" },
      { church_name: "Trinity Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=9VQSGmHo3YI" },
      { church_name: "St. James Ev. Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=aPIjKN7-8vE" },
      { church_name: "St. John's Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=AjxYdiiuuXA" },
      { church_name: "Plymouth Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=6jmaJDdqbI8" },
      { church_name: "Christ Church Episcopal", youtube_channel: "https://www.youtube.com/watch?v=sTJteDoesL8" },
      { church_name: "University Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=oP7X4Tkza-8" },
      { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=ZV_NLAJTRJo" },
      { church_name: "Swift Creek Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=jW_XU5EL4Ng" },
      { church_name: "Pickens First Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=7rbnRqNW7dc" },
      { church_name: "Bethesda Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=Ob6DLQQY3pU" },
      { church_name: "Central United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=jVOveSk1Fvs" },
      { church_name: "St. John's Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=KBqBdepocP0" },
      { church_name: "St. John Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=IlKH_lbjQoY" },
      { church_name: "South Hill Bible Church", youtube_channel: "https://www.youtube.com/watch?v=6bppt_NS-QU" },
      { church_name: "Grace Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=Ey9ksbwYOSs" },
      { church_name: "Immanuel Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=a-G3h_JsGWQ" },
      { church_name: "Fauntleroy Church, UCC", youtube_channel: "https://www.youtube.com/watch?v=5PRGqv_QCLI" },
      { church_name: "Union Presbyterian Church of Endicott", youtube_channel: "https://www.youtube.com/watch?v=sfXhbrrzzgA" },
      { church_name: "Bible Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=Yg0F02slW_o" },
      { church_name: "Skyland United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=gIsApjaYeeo" },
      { church_name: "Grier Heights Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=Pe84lM8Gz_U" },
      { church_name: "Atlanta Telugu Church", youtube_channel: "https://www.youtube.com/watch?v=NG0DRUgOMeo" },
      { church_name: "Grace Episcopal Church", youtube_channel: "https://www.youtube.com/watch?v=LXRbQm0641w" },
      { church_name: "First Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=aJmtWPtTBwg" },
      { church_name: "Church on the Rock", youtube_channel: "https://www.youtube.com/watch?v=IvZ0EMtF2c4" },
      { church_name: "The Refuge Owasso", youtube_channel: "https://www.youtube.com/watch?v=OkcRH4u9XA4" },
      { church_name: "ELIM Church", youtube_channel: "https://www.youtube.com/watch?v=z3OM5kXooSA" },
      { church_name: "Hillsong Church / Hillsong Worship", youtube_channel: "https://www.youtube.com/watch?v=R_dO8hFyJgk" },
      { church_name: "El Lugar de Su Presencia", youtube_channel: "https://www.youtube.com/watch?v=xqAD1WrWQjU" },
      { church_name: "Calvary Temple", youtube_channel: "https://www.youtube.com/watch?v=YFyWls38ekg" },
      { church_name: "Lagoinha Church (Igreja Batista da Lagoinha)", youtube_channel: "https://www.youtube.com/watch?v=KUNGTcQJpPc" },
      { church_name: "Igreja Presbiteriana de Pinheiros", youtube_channel: "https://www.youtube.com/watch?v=JMqT5QDgo7g" },
      { church_name: "Christ's Commission Fellowship (CCF)", youtube_channel: "https://www.youtube.com/watch?v=zRy5jiZ_3Zw" },
      { church_name: "First United Methodist Church of Florence", youtube_channel: "https://www.youtube.com/watch?v=n-QVntMBXB8" },
      { church_name: "Tanner Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=XkBw88qndn0" },
      { church_name: "Cedar Grove Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=l0Rb_Yx3c9k" },
      { church_name: "Bethel Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=kpWl9ou8UDk" },
      { church_name: "Our Savior's Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=P_pmGeXZ5ME" },
      { church_name: "St. Paul UMC", youtube_channel: "https://www.youtube.com/watch?v=ICMSihwMxSw" },
      { church_name: "Holy Trinity Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=bVz1KVReS_M" },
      { church_name: "First United Pentecostal Church of Augusta", youtube_channel: "https://www.youtube.com/watch?v=m15je33I_ug" },
      { church_name: "Dorset Church", youtube_channel: "https://www.youtube.com/watch?v=jsqI27XnEmI" },
      { church_name: "Barre Congregational Church", youtube_channel: "https://www.youtube.com/watch?v=o2MZwry84ko" },
      { church_name: "First Church of Monson", youtube_channel: "https://www.youtube.com/watch?v=dL1wJ5_WQ5w" },
      { church_name: "St. John Lutheran Church–Kramer", youtube_channel: "https://www.youtube.com/watch?v=rLGvwRoA2MQ" },
      { church_name: "Federated Church", youtube_channel: "https://www.youtube.com/watch?v=nWX5EzJP8kc" },
      { church_name: "St. Paul Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=PuC0V9M5ius" },
      { church_name: "Grace & Peace Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=w9OqfF2EOzU" },
      { church_name: "Maplewood Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=exHzNEVqsCc" },
      { church_name: "St. Andrew Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=TnwHFeyKA00" },
      { church_name: "Unity Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=C3geUBve3Ns" },
      { church_name: "Oregon City Church of Christ", youtube_channel: "https://www.youtube.com/watch?v=TB2WduN4mAA" },
      { church_name: "St. Paul's United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=PtOP57_knrk" },
      { church_name: "First Baptist Church Pulaski", youtube_channel: "https://www.youtube.com/watch?v=kQBnb4rvQuw" },
      { church_name: "Paradise Church", youtube_channel: "https://www.youtube.com/watch?v=uBIpm226wdY" },
      { church_name: "Good Shepherd Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=PRt9tEnDQwQ" },
      { church_name: "Houghton Lake Global Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=J69gDRq-Dz4" },
      { church_name: "Grace Lutheran Church", youtube_channel: "https://www.youtube.com/watch?v=sTJcVnhBmeg" },
      { church_name: "First Baptist Church of Lincoln", youtube_channel: "https://www.youtube.com/watch?v=g7v4uKWpjwU" },
      { church_name: "Bethel Church", youtube_channel: "https://www.youtube.com/watch?v=olkqjU6sCxA" },
      { church_name: "MGMC Hawaii", youtube_channel: "https://www.youtube.com/watch?v=EbI8OGmxdig" },
      { church_name: "Manna Church Hawaii", youtube_channel: "https://www.youtube.com/watch?v=5OrPfzJhT4o" },
      { church_name: "St. Andrew's Community Church", youtube_channel: "https://www.youtube.com/watch?v=-ntJwJju8e8" },
      { church_name: "Emmanuel Missionary Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=DqC9UG573uA" },
      { church_name: "First United Methodist Church", youtube_channel: "https://www.youtube.com/watch?v=uk7xlNKqXR0" },
      { church_name: "Bethel Church", youtube_channel: "https://www.youtube.com/watch?v=iIZE0zM6TT0" },
      { church_name: "Open Door Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=oLJUp04cigk" },
      { church_name: "Grace Family Church", youtube_channel: "https://www.youtube.com/watch?v=lRNO5J1CP5M" },
      { church_name: "First Mennonite Church of New Bremen", youtube_channel: "https://www.youtube.com/watch?v=YaeW72cHjwM" },
      { church_name: "Grace Church Chino", youtube_channel: "https://www.youtube.com/watch?v=7kluO7IF_kg" },
      { church_name: "St. Catherine of Siena Church", youtube_channel: "https://www.youtube.com/watch?v=cHWN7lVLiZY" },
      { church_name: "United Church of Colchester", youtube_channel: "https://www.youtube.com/watch?v=z314rSNCrIg" },
      { church_name: "St. Catherine of Siena", youtube_channel: "https://www.youtube.com/watch?v=lhj9uAvZmUY" },
    ];

    console.log(`[CleanSlate] Loading ${verifiedChurches.length} verified churches only...`);

    const toInsert = verifiedChurches.map(c => ({
      church_name: c.church_name,
      youtube_channel: c.youtube_channel,
      pastor_name: 'Pastor',
      sender_email: 'bob@thepremierproperties.com',
    }));

    // Insert in batches
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += 100) {
      const batch = toInsert.slice(i, i + 100);
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
        },
        body: JSON.stringify(batch),
      });

      if (!insertRes.ok) {
        console.warn(`[CleanSlate] Insert batch ${i/100 + 1} returned ${insertRes.status}`);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`[CleanSlate] Complete! Loaded ${inserted} verified churches`);

    return res.json({
      success: true,
      sermons_deleted: sermons?.length || 0,
      churches_deleted: churches?.length || 0,
      churches_loaded: inserted,
      message: `Clean slate complete. Deleted all old data. Loaded ${inserted} verified churches from Chat.`
    });

  } catch (err) {
    console.error('[CleanSlate] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
