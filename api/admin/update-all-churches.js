// Update all 45 churches with corrected YouTube channel URLs
export default async function handler(req, res) {
  const correctedChurches = [
    {"church_name":"Colonial Church St. Augustine","youtube_channel":"https://www.youtube.com/channel/UCSYGkbzVd5-EzAMEpf3EaGg"},
    {"church_name":"Grace and Faith Church","youtube_channel":"https://www.youtube.com/channel/UCYgA8blNuE8TgT8rTkTQwWg"},
    {"church_name":"The Church of Eleven22","youtube_channel":"https://www.youtube.com/channel/UCqB8wwurUvy5OifhjFR429Q"},
    {"church_name":"Oasis Church","youtube_channel":"https://www.youtube.com/channel/UCDQpws5NLVeShceF2YUpeUQ"},
    {"church_name":"House Of Faith","youtube_channel":"https://www.youtube.com/channel/UCNo3Qh7uqj_OqcW1jVj-jnA"},
    {"church_name":"Cape Christian","youtube_channel":"https://www.youtube.com/channel/UC1JdaJmVv5KbVvOHkSmug7g"},
    {"church_name":"Christ's Family Christian Church","youtube_channel":"https://www.youtube.com/channel/UCzei7ZcRVyTTYQX7cOEh9Og"},
    {"church_name":"Redemption Hill Church","youtube_channel":"https://www.youtube.com/channel/UCsQWRuSUR0imvK_gX6DFC3g"},
    {"church_name":"Central Florida Church of God","youtube_channel":"https://www.youtube.com/channel/UCaMU5dcXVSW_Y2jVm871tsQ"},
    {"church_name":"Florida Faith Church","youtube_channel":"https://www.youtube.com/channel/UC1qnFAsBfE8gW9yJqdoTACA"},
    {"church_name":"Faith Church Brooksville","youtube_channel":"https://www.youtube.com/channel/UCCw4buUG0pjbie24fSnHVRg"},
    {"church_name":"Paramount Church","youtube_channel":"https://www.youtube.com/channel/UC1pOJfwrVbF56uWoY1fSvdg"},
    {"church_name":"Florida Coast Church","youtube_channel":"https://www.youtube.com/channel/UC7JXbxf_yy1ZkQjSkMuBvww"},
    {"church_name":"First Church Miami","youtube_channel":"https://www.youtube.com/channel/UCDMjAFI9fkWFQ3_3Ju3thjA"},
    {"church_name":"Life Church Miami","youtube_channel":"https://www.youtube.com/channel/UCI40ETTae-F4aH2L30pdxgQ"},
    {"church_name":"Radiant Church","youtube_channel":"https://www.youtube.com/channel/UCtvD-CHWq4NShfNYUo_EnPQ"},
    {"church_name":"New Birth Baptist Church Miami","youtube_channel":"https://www.youtube.com/channel/UCr741acctc0tgk_PIadhM3g"},
    {"church_name":"First Baptist Church of Palm Coast","youtube_channel":"https://www.youtube.com/channel/UCCFt9Zi4-t9qd_YsjcUiNcQ"},
    {"church_name":"Pentecostal Tabernacle International","youtube_channel":"https://www.youtube.com/channel/UCwT9cEulNzRqOfsV8wXhVfg"},
    {"church_name":"Central Assembly","youtube_channel":"https://www.youtube.com/channel/UCLuet9HKn08Fk1_v3HRTuLg"},
    {"church_name":"Florida City First Assembly of God","youtube_channel":"https://www.youtube.com/channel/UCl8M0fMJG7f2bRcGqwxli_g"},
    {"church_name":"Open Door Church","youtube_channel":"https://www.youtube.com/channel/UC0g1bZnde2FaApESbymQ5IQ"},
    {"church_name":"Grace Gospel Church","youtube_channel":"https://www.youtube.com/channel/UCVJ4FbL4VnWtnr8oTWZ6TRQ"},
    {"church_name":"Grace Fellowship Church","youtube_channel":"https://www.youtube.com/channel/UCzsasACDePGWNUTTQpeb1-A"},
    {"church_name":"New Life Church Ministries","youtube_channel":"https://www.youtube.com/channel/UCGFKr_fuwBELtryrAy38dsg"},
    {"church_name":"Cornerstone Christian Church","youtube_channel":"https://www.youtube.com/channel/UCbRhDZn1GRuYMUFQ-B7sP2g"},
    {"church_name":"West Broward Church Of Christ","youtube_channel":"https://www.youtube.com/channel/UCwOwC4IM4CCk1ucFlkJhslg"},
    {"church_name":"Volusia County Baptist Church","youtube_channel":"https://www.youtube.com/channel/UCGcX-6CSIl8aBj566SZdxGw"},
    {"church_name":"Seminole Community Church","youtube_channel":"https://www.youtube.com/channel/UCx5X2X5lqaRhPY-Ks6ojDcQ"},
    {"church_name":"Central Baptist Church","youtube_channel":"https://www.youtube.com/channel/UCNdZBljkW90NauiFnBUhZ1g"},
    {"church_name":"Abundant Life Church","youtube_channel":"https://www.youtube.com/channel/UCkwIAZWVGGTPWe4CZcPTR_Q"},
    {"church_name":"Alive Church","youtube_channel":"https://www.youtube.com/channel/UCvckxCng678YXaNTnjmZbVQ"},
    {"church_name":"Central Christian Church","youtube_channel":"https://www.youtube.com/channel/UC2Y0zoW9I5pKCo5M4qbuOcw"},
    {"church_name":"River City Baptist Church","youtube_channel":"https://www.youtube.com/channel/UCTxzZvRBmtvl9iFktVA0YuQ"},
    {"church_name":"The River at Tampa Bay Church","youtube_channel":"https://www.youtube.com/channel/UCSGhWo0-HkBoEnUpBFhg-uA"},
    {"church_name":"Journey Church","youtube_channel":"https://www.youtube.com/channel/UC4n9Hi_wsA5FBOHfwKHhmaw"},
    {"church_name":"First Church Orlando","youtube_channel":"https://www.youtube.com/channel/UCc3sZahbZYH8T1E5hkV4--w"},
    {"church_name":"Spirit Life Worship Church","youtube_channel":"https://www.youtube.com/channel/UCelZqE0AzO6EqrkONZ6LkkA"},
    {"church_name":"Tampa Life Church","youtube_channel":"https://www.youtube.com/channel/UCDrHRXwgSKdWA_yN8_iA3kA"},
    {"church_name":"Relevant Church","youtube_channel":"https://www.youtube.com/channel/UCbTdCnD7mDKWDU3ax1akavA"},
    {"church_name":"Grace Community Church","youtube_channel":"https://www.youtube.com/channel/UCkZtzoWgSE3MG_GPyddDmGg"},
    {"church_name":"Highlands Church of Christ","youtube_channel":"https://www.youtube.com/channel/UCqy9JODCL6ErrtMpGQ1Z1og"},
    {"church_name":"Christ Fellowship","youtube_channel":"https://www.youtube.com/channel/UCmrlAwG8hE2csIsh4IGQzTA"},
    {"church_name":"Community Church of God","youtube_channel":"https://www.youtube.com/channel/UCvJ2pppMKjFrNbPMfHzWppA"},
    {"church_name":"The Pentecostals","youtube_channel":"https://www.youtube.com/channel/UCAEzWTGhdIvBx76w4hsuVpw"}
  ];

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    console.log(`[UpdateAll] Updating ${correctedChurches.length} churches...`);

    const updates = [];

    for (const church of correctedChurches) {
      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/church_accounts?church_name=eq.${encodeURIComponent(church.church_name)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ youtube_channel: church.youtube_channel }),
        }
      );

      if (!updateRes.ok) {
        console.error(`[UpdateAll] Failed to update ${church.church_name}: ${updateRes.status}`);
      } else {
        updates.push(church.church_name);
      }
    }

    console.log(`[UpdateAll] Updated ${updates.length}/${correctedChurches.length}`);
    return res.status(200).json({
      status: "success",
      message: `Updated ${updates.length} churches with corrected YouTube channel URLs`,
      updated: updates.length,
      total: correctedChurches.length,
    });
  } catch (err) {
    console.error("[UpdateAll] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
