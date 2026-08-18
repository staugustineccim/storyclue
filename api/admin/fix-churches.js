// Fix the church database: remove duplicates, populate youtube_channel with correct URLs
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Step 1: Get all churches
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=*&order=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const allChurches = await getRes.json();
    console.log(`[Fix] Total records: ${allChurches.length}`);

    // Step 2: Find duplicates — keep highest ID, delete lower IDs
    const nameMap = {};
    const toDelete = [];

    allChurches.forEach(church => {
      if (!nameMap[church.church_name]) {
        nameMap[church.church_name] = church.id;
      } else if (church.id > nameMap[church.church_name]) {
        toDelete.push(nameMap[church.church_name]);
        nameMap[church.church_name] = church.id;
      } else {
        toDelete.push(church.id);
      }
    });

    console.log(`[Fix] Found ${toDelete.length} duplicates to delete`);

    // Delete duplicates in batches
    for (let i = 0; i < toDelete.length; i += 100) {
      const batch = toDelete.slice(i, i + 100);
      const ids = batch.map(id => `id.eq.${id}`).join(',or.');
      await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${ids}`, {
        method: 'DELETE',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      });
    }

    // Step 3: Correct 45 church YouTube channels
    const churchData = {
      "Colonial Church St. Augustine": "https://www.youtube.com/channel/UCSYGkbzVd5-EzAMEpf3EaGg",
      "Grace and Faith Church": "https://www.youtube.com/channel/UCYgA8blNuE8TgT8rTkTQwWg",
      "The Church of Eleven22": "https://www.youtube.com/channel/UCqB8wwurUvy5OifhjFR429Q",
      "Oasis Church": "https://www.youtube.com/channel/UCDQpws5NLVeShceF2YUpeUQ",
      "House Of Faith": "https://www.youtube.com/channel/UCNo3Qh7uqj_OqcW1jVj-jnA",
      "Cape Christian": "https://www.youtube.com/channel/UC1JdaJmVv5KbVvOHkSmug7g",
      "Christ's Family Christian Church": "https://www.youtube.com/channel/UCzei7ZcRVyTTYQX7cOEh9Og",
      "Redemption Hill Church": "https://www.youtube.com/channel/UCsQWRuSUR0imvK_gX6DFC3g",
      "Central Florida Church of God": "https://www.youtube.com/channel/UCaMU5dcXVSW_Y2jVm871tsQ",
      "Florida Faith Church": "https://www.youtube.com/channel/UC1qnFAsBfE8gW9yJqdoTACA",
      "Faith Church Brooksville": "https://www.youtube.com/channel/UCCw4buUG0pjbie24fSnHVRg",
      "Paramount Church": "https://www.youtube.com/channel/UC1pOJfwrVbF56uWoY1fSvdg",
      "Florida Coast Church": "https://www.youtube.com/channel/UC7JXbxf_yy1ZkQjSkMuBvww",
      "First Church Miami": "https://www.youtube.com/channel/UCDMjAFI9fkWFQ3_3Ju3thjA",
      "Life Church Miami": "https://www.youtube.com/channel/UCI40ETTae-F4aH2L30pdxgQ",
      "Radiant Church": "https://www.youtube.com/channel/UCtvD-CHWq4NShfNYUo_EnPQ",
      "New Birth Baptist Church Miami": "https://www.youtube.com/channel/UCr741acctc0tgk_PIadhM3g",
      "First Baptist Church of Palm Coast": "https://www.youtube.com/channel/UCCFt9Zi4-t9qd_YsjcUiNcQ",
      "Pentecostal Tabernacle International": "https://www.youtube.com/channel/UCwT9cEulNzRqOfsV8wXhVfg",
      "Central Assembly": "https://www.youtube.com/channel/UCLuet9HKn08Fk1_v3HRTuLg",
      "Florida City First Assembly of God": "https://www.youtube.com/channel/UCl8M0fMJG7f2bRcGqwxli_g",
      "Open Door Church": "https://www.youtube.com/channel/UC0g1bZnde2FaApESbymQ5IQ",
      "Grace Gospel Church": "https://www.youtube.com/channel/UCVJ4FbL4VnWtnr8oTWZ6TRQ",
      "Grace Fellowship Church": "https://www.youtube.com/channel/UCzsasACDePGWNUTTQpeb1-A",
      "New Life Church Ministries": "https://www.youtube.com/channel/UCGFKr_fuwBELtryrAy38dsg",
      "Cornerstone Christian Church": "https://www.youtube.com/channel/UCbRhDZn1GRuYMUFQ-B7sP2g",
      "West Broward Church Of Christ": "https://www.youtube.com/channel/UCwOwC4IM4CCk1ucFlkJhslg",
      "Volusia County Baptist Church": "https://www.youtube.com/channel/UCGcX-6CSIl8aBj566SZdxGw",
      "Seminole Community Church": "https://www.youtube.com/channel/UCx5X2X5lqaRhPY-Ks6ojDcQ",
      "Central Baptist Church": "https://www.youtube.com/channel/UCNdZBljkW90NauiFnBUhZ1g",
      "Abundant Life Church": "https://www.youtube.com/channel/UCkwIAZWVGGTPWe4CZcPTR_Q",
      "Alive Church": "https://www.youtube.com/channel/UCvckxCng678YXaNTnjmZbVQ",
      "Central Christian Church": "https://www.youtube.com/channel/UC2Y0zoW9I5pKCo5M4qbuOcw",
      "River City Baptist Church": "https://www.youtube.com/channel/UCTxzZvRBmtvl9iFktVA0YuQ",
      "The River at Tampa Bay Church": "https://www.youtube.com/channel/UCSGhWo0-HkBoEnUpBFhg-uA",
      "Journey Church": "https://www.youtube.com/channel/UC4n9Hi_wsA5FBOHfwKHhmaw",
      "First Church Orlando": "https://www.youtube.com/channel/UCc3sZahbZYH8T1E5hkV4--w",
      "Spirit Life Worship Church": "https://www.youtube.com/channel/UCelZqE0AzO6EqrkONZ6LkkA",
      "Tampa Life Church": "https://www.youtube.com/channel/UCDrHRXwgSKdWA_yN8_iA3kA",
      "Relevant Church": "https://www.youtube.com/channel/UCbTdCnD7mDKWDU3ax1akavA",
      "Grace Community Church": "https://www.youtube.com/channel/UCkZtzoWgSE3MG_GPyddDmGg",
      "Highlands Church of Christ": "https://www.youtube.com/channel/UCqy9JODCL6ErrtMpGQ1Z1og",
      "Christ Fellowship": "https://www.youtube.com/channel/UCmrlAwG8hE2csIsh4IGQzTA",
      "Community Church of God": "https://www.youtube.com/channel/UCvJ2pppMKjFrNbPMfHzWppA",
      "The Pentecostals": "https://www.youtube.com/channel/UCAEzWTGhdIvBx76w4hsuVpw",
    };

    // Step 4: Get remaining churches and update youtube_channel
    const afterDeleteRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id,church_name`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const remainingChurches = await afterDeleteRes.json();

    let updated = 0;
    const notFound = [];

    for (const church of remainingChurches) {
      const youtubeUrl = churchData[church.church_name];
      if (!youtubeUrl) {
        notFound.push(church.church_name);
        continue;
      }

      await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?id=eq.${church.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
        },
        body: JSON.stringify({ youtube_channel: youtubeUrl }),
      });
      updated++;
    }

    return res.status(200).json({
      deleted_duplicates: toDelete.length,
      updated_channels: updated,
      total_remaining: remainingChurches.length,
      not_found: notFound,
    });

  } catch (err) {
    console.error('[Fix] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
