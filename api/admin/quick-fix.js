// One-time cleanup — will delete this after running
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    console.log('[QuickFix] Starting cleanup...');

    // Step 1: Delete all sermons to clear transient data
    console.log('[QuickFix] Clearing church_sermons...');
    await fetch(`${SUPABASE_URL}/rest/v1/church_sermons`, {
      method: 'DELETE',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    // Step 2: Delete all puzzles
    console.log('[QuickFix] Clearing puzzles...');
    await fetch(`${SUPABASE_URL}/rest/v1/puzzles`, {
      method: 'DELETE',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    // Step 3: Get all churches, find and remove duplicates
    console.log('[QuickFix] Fetching all churches...');
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=*`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const allChurches = await getRes.json();
    console.log(`[QuickFix] Found ${allChurches.length} total church records`);

    // Find duplicates
    const nameMap = {};
    const idsToDelete = [];
    allChurches.forEach(c => {
      if (!nameMap[c.church_name]) {
        nameMap[c.church_name] = c.id;
      } else {
        idsToDelete.push(c.id);
      }
    });

    console.log(`[QuickFix] Deleting ${idsToDelete.length} duplicate records`);

    // Delete in batches
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const batch = idsToDelete.slice(i, i + 50);
      const filter = batch.map((_, idx) => `id.eq.${batch[idx]}`).join(',or.');
      await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${filter}`, {
        method: 'DELETE',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      });
    }

    // Step 4: Update youtube_channel for all remaining churches
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

    // Fetch clean list and update
    console.log('[QuickFix] Fetching remaining churches...');
    const freshRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id,church_name`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const freshChurches = await freshRes.json();
    console.log(`[QuickFix] After dedup: ${freshChurches.length} churches remain`);

    let updated = 0;
    for (const church of freshChurches) {
      const url = churchData[church.church_name];
      if (url) {
        await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?id=eq.${church.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: KEY,
            Authorization: `Bearer ${KEY}`,
          },
          body: JSON.stringify({ youtube_channel: url }),
        });
        updated++;
      }
    }

    console.log(`[QuickFix] Updated ${updated} churches with youtube_channel`);
    return res.status(200).json({
      success: true,
      deleted_duplicates: idsToDelete.length,
      final_church_count: freshChurches.length,
      updated_channels: updated,
    });

  } catch (err) {
    console.error('[QuickFix] Error:', err.message);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
