// Test if PATCH works on even one record
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Get first record ID
    const listRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id&limit=1`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const records = await listRes.json();

    if (!records[0]) {
      return res.json({ error: "No records found" });
    }

    const recordId = records[0].id;
    console.log(`[TestPatch] Testing PATCH on ID: ${recordId}, type: ${typeof recordId}`);

    // Try to update just one record
    const filterStr = `id=eq.${recordId}`;
    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/church_accounts?${filterStr}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
        },
        body: JSON.stringify({
          church_name: "First Presbyterian Church of Gainesville",
          youtube_channel: "https://www.youtube.com/@FirstPresbyterianChurchGainesville",
        }),
      }
    );

    console.log(`[TestPatch] PATCH response: ${patchRes.status}`);
    const result = await patchRes.text();
    console.log(`[TestPatch] Response body: ${result.substring(0, 500)}`);

    return res.json({
      recordId,
      filterStr,
      patchStatus: patchRes.status,
      patchOk: patchRes.ok,
      responsePreview: result.substring(0, 200),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
