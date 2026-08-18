// Admin endpoint: Complete clean sweep of churches and sermons
// Deletes all records and reloads 45 churches fresh

const CHURCHES = [{"church_name":"Colonial Church St. Augustine","pastor_name":"Matt & Jill McCloghry","sender_email":"contact@colonialchurch.life","youtube_channel":"https://www.youtube.com/c/colonialchurchsta"},{"church_name":"Grace and Faith Church","pastor_name":"Rob Scarallo","sender_email":"office@graceandfaith.church","youtube_channel":"https://www.youtube.com/c/graceandfaithchurch"},{"church_name":"The Church of Eleven22","pastor_name":"Joby Martin","sender_email":"communication@coe22.com","youtube_channel":"https://www.youtube.com/channel/UCqB8wwurUvy5OifhjFR429Q"},{"church_name":"Oasis Church","pastor_name":"Steve & Kristin Coad","sender_email":"steve@oasischurch.ag","youtube_channel":"https://www.youtube.com/@OasisChurchFL941"},{"church_name":"House Of Faith","pastor_name":"Guillermo Velazquez","sender_email":"hello@hofmiami.com","youtube_channel":"https://www.youtube.com/c/HouseOfFaith"},{"church_name":"Cape Christian","pastor_name":"Kyle Jackson","sender_email":"info@capechristian.com","youtube_channel":"https://www.youtube.com/c/CapeChristian"},{"church_name":"Christ's Family Christian Church","pastor_name":"Patrick Haas","sender_email":"patrick@cfcc.church","youtube_channel":"https://www.youtube.com/@cfcc.church"},{"church_name":"Redemption Hill Church","pastor_name":"Chad Clement","sender_email":"chad@rh-church.com","youtube_channel":"https://www.youtube.com/@RHchurchTLH"},{"church_name":"Central Florida Church of God","pastor_name":"Stan Holder","sender_email":"info@flcog.cc","youtube_channel":"https://www.youtube.com/channel/UCaMU5dcXVSW_Y2jVm871tsQ"},{"church_name":"Florida Faith Church","pastor_name":"Dr. Van Dorn","sender_email":"info@floridafaithchurch.com","youtube_channel":"https://www.youtube.com/channel/UC1qnFAsBfE8gW9yJqdoTACA"},{"church_name":"Faith Church Brooksville","pastor_name":"Anthony Alonso","sender_email":"office@faithepc.net","youtube_channel":"https://www.youtube.com/channel/UCCw4buUG0pjbie24fSnHVRg"},{"church_name":"Paramount Church","pastor_name":"John Fonville","sender_email":"admin@paramountchurch.com","youtube_channel":"https://www.youtube.com/c/ParamountChurch"},{"church_name":"Florida Coast Church","pastor_name":"Rev. Dr. Larry Trotter","sender_email":"larry@floridacoastchurch.org","youtube_channel":"https://www.youtube.com/@floridacoastchurch"},{"church_name":"First Church Miami","pastor_name":"Audrey Warren","sender_email":"Operations@firstchurchmiami.org","youtube_channel":"https://www.youtube.com/@firstchurchmiami"},{"church_name":"Life Church Miami","pastor_name":"David & Miriam Mayoral","sender_email":"info@lifechurchmiami.com","youtube_channel":"https://www.youtube.com/@LifeChurchMiami"},{"church_name":"Radiant Church","pastor_name":"Aaron Burke","sender_email":"aaronrburke@weareradiant.com","youtube_channel":"https://www.youtube.com/channel/UCtvD-CHWq4NShfNYUo_EnPQ"},{"church_name":"New Birth Baptist Church Miami","pastor_name":"Bishop Victor T. Curry","sender_email":"info@nbbcmiami.org","youtube_channel":"https://www.youtube.com/c/newbirthbaptistchurchmiami"},{"church_name":"First Baptist Church of Palm Coast","pastor_name":"Kevin Lautar","sender_email":"fbcmail@fbcpc.org","youtube_channel":"https://www.youtube.com/channel/UCCFt9Zi4-t9qd_YsjcUiNcQ"},{"church_name":"Pentecostal Tabernacle International","pastor_name":"Rev. Dr. Omar A. Williams","sender_email":"info@pentab.org","youtube_channel":"https://www.youtube.com/c/pentabint"},{"church_name":"Central Assembly","pastor_name":"Jon Hamilton","sender_email":"jhamilton@christianfm.com","youtube_channel":"https://www.youtube.com/@centralassemblyvero"},{"church_name":"Florida City First Assembly of God","pastor_name":"Jeff & Angie Jennings","sender_email":"office@floridacityfirst.org","youtube_channel":"https://www.youtube.com/channel/UCl8M0fMJG7f2bRcGqwxli_g"},{"church_name":"Open Door Church","pastor_name":"Pastor Jim","sender_email":"opendoorchurchfl@gmail.com","youtube_channel":"https://www.youtube.com/c/OpenDoorChurch"},{"church_name":"Grace Gospel Church","pastor_name":"Greg Elmquist","sender_email":"[email protected]","youtube_channel":"https://www.youtube.com/channel/UCVJ4FbL4VnWtnr8oTWZ6TRQ"},{"church_name":"Grace Fellowship Church","pastor_name":"Pastor Keegan O'Connell-Jones","sender_email":"contact@gracesarasota.org","youtube_channel":"https://www.youtube.com/@gracefellowshipchurchfl"},{"church_name":"New Life Church Ministries","pastor_name":"Rev. Dr. Victor E. Gooden","sender_email":"newlife.daytona@gmail.com","youtube_channel":"https://www.youtube.com/channel/UCGFKr_fuwBELtryrAy38dsg"},{"church_name":"Cornerstone Christian Church","pastor_name":"Freddie Calvy","sender_email":"cornerstoneofjacksonville@comcast.net","youtube_channel":"https://www.youtube.com/channel/UCbRhDZn1GRuYMUFQ-B7sP2g"},{"church_name":"West Broward Church Of Christ","pastor_name":"Kevin Patterson","sender_email":"[email protected]","youtube_channel":"https://www.youtube.com/channel/UCwOwC4IM4CCk1ucFlkJhslg"},{"church_name":"Volusia County Baptist Church","pastor_name":"Mark Siers","sender_email":"[email protected]","youtube_channel":"https://www.youtube.com/@volusiacountybaptistchurch4097"},{"church_name":"Seminole Community Church","pastor_name":"Jerry Walsh","sender_email":"seminolechurch.com","youtube_channel":"https://www.youtube.com/@seminolecommunitychurch3634"},{"church_name":"Central Baptist Church","pastor_name":"Andy Bloom or Lonnie Moore","sender_email":"info@centralbaptistocala.org","youtube_channel":"https://www.youtube.com/channel/UCNdZBljkW90NauiFnBUhZ1g"},{"church_name":"Abundant Life Church","pastor_name":"Sean & Erin Thomas","sender_email":"info@ablchurch.com","youtube_channel":"https://www.youtube.com/channel/UCkwIAZWVGGTPWe4CZcPTR_Q"},{"church_name":"Alive Church","pastor_name":"Ken & Tabatha Claytor","sender_email":"icampus@myalivechurch.org","youtube_channel":"https://www.youtube.com/c/alivechurchlive"},{"church_name":"Central Christian Church","pastor_name":"Donna Oberkreser","sender_email":"PastorDonna@clearwaterdisciples.org","youtube_channel":"https://www.youtube.com/@clearwaterdisciples.org"},{"church_name":"River City Baptist Church","pastor_name":"Bryan Samms","sender_email":"info@rivercitybaptist.church","youtube_channel":"https://www.youtube.com/channel/UCTxzZvRBmtvl9iFktVA0YuQ"},{"church_name":"The River at Tampa Bay Church","pastor_name":"Dr. Rodney Howard-Browne","sender_email":"rodneyhowardbrowne@yahoo.com","youtube_channel":"https://www.youtube.com/user/rodneyhowardbrowne"},{"church_name":"Journey Church","pastor_name":"Adam Hardegree","sender_email":"info@journeychurch.org","youtube_channel":"https://www.youtube.com/user/JourneyChurchOrg"},{"church_name":"First Church Orlando","pastor_name":"Vance Rains","sender_email":"Contact@FirstChurchOrlando.org","youtube_channel":"https://www.youtube.com/channel/UCc3sZahbZYH8T1E5hkV4--w"},{"church_name":"Spirit Life Worship Church","pastor_name":"Michael Desroches","sender_email":"spiritlifeworshipchurch@gmail.com","youtube_channel":"https://www.youtube.com/c/pastoroncall"},{"church_name":"Tampa Life Church","pastor_name":"Robert Tisdale","sender_email":"admin@tampalife.church","youtube_channel":"https://www.youtube.com/c/TampaLifeChurch"},{"church_name":"Relevant Church","pastor_name":"Chris & Liz Sarno","sender_email":"info@relevantfl.org","youtube_channel":"https://www.youtube.com/c/RelevantChurch"},{"church_name":"Grace Community Church","pastor_name":"Chip Bennett","sender_email":"grace@gracesarasota.com","youtube_channel":"https://www.youtube.com/channel/UCkZtzoWgSE3MG_GPyddDmGg"},{"church_name":"Highlands Church of Christ","pastor_name":"Randal Myers","sender_email":"secretary@hcofc.org","youtube_channel":"https://www.youtube.com/channel/UCqy9JODCL6ErrtMpGQ1Z1og"},{"church_name":"Christ Fellowship","pastor_name":"Todd & Julie Mullins","sender_email":"hello@christfellowship.church","youtube_channel":"https://www.youtube.com/@ChristFellowship.Church"},{"church_name":"Community Church of God","pastor_name":"Pastor Jeffrey Compere","sender_email":"unity@communitycog.org","youtube_channel":"https://www.youtube.com/@CCOGFL"},{"church_name":"The Pentecostals","pastor_name":"Jimmy Toney","sender_email":"music@thepentecostalrgnv.com","youtube_channel":"https://www.youtube.com/channel/UCAEzWTGhdIvBx76w4hsuVpw"}];

export default async function handler(req, res) {
  // Security: require secret token in header
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== process.env.ADMIN_RESET_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    console.log("[Reset] Starting clean sweep...");

    // Step 1: Delete all church_sermons (has foreign key to church_accounts)
    console.log("[Reset] Deleting all church_sermons...");
    const deleteSermons = await fetch(`${supabaseUrl}/rest/v1/church_sermons`, {
      method: "DELETE",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });
    const sermonCount = deleteSermons.headers.get("content-range")?.split("/")[1] || "unknown";
    console.log(`[Reset] Deleted ${sermonCount} sermon records`);

    // Step 2: Delete all church_accounts
    console.log("[Reset] Deleting all church_accounts...");
    const deleteChurches = await fetch(`${supabaseUrl}/rest/v1/church_accounts`, {
      method: "DELETE",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });
    const churchCount = deleteChurches.headers.get("content-range")?.split("/")[1] || "unknown";
    console.log(`[Reset] Deleted ${churchCount} church records`);

    // Step 3: Insert fresh churches
    console.log(`[Reset] Inserting ${CHURCHES.length} churches...`);
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/church_accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(CHURCHES),
    });

    if (!insertRes.ok) {
      const text = await insertRes.text();
      throw new Error(`Insert failed: ${insertRes.status} ${text}`);
    }

    console.log(`[Reset] ✅ Successfully inserted ${CHURCHES.length} churches`);

    return res.status(200).json({
      status: "success",
      message: "Clean sweep complete",
      deleted: {
        sermons: sermonCount,
        churches: churchCount,
      },
      inserted: CHURCHES.length,
      nextStep: "Run sunday-sermon cron to detect videos and generate puzzles",
    });
  } catch (err) {
    console.error("[Reset] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
