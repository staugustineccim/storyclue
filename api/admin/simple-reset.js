// Simplest possible reset
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Get all IDs
    console.log('[SimpleReset] Fetching all IDs...');
    const allRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    if (!allRes.ok) {
      throw new Error(`Get failed: ${allRes.status}`);
    }

    const all = await allRes.json();
    console.log(`[SimpleReset] Got ${all.length} records`);

    if (all.length === 0) {
      return res.json({ msg: "No records to delete" });
    }

    // Build OR filter
    const idFilters = all.map((r, i) => `id.eq.${r.id}`).join(',or.');

    // Delete with filter
    console.log(`[SimpleReset] Deleting with filter...`);
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${idFilters}`, {
      method: 'DELETE',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    console.log(`[SimpleReset] Delete response: ${delRes.status}`);

    // Verify deletion
    const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=count()`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    console.log(`[SimpleReset] Verify response: ${verifyRes.status}`);

    return res.json({ deleted: all.length, verified: verifyRes.ok });

  } catch (err) {
    console.error('[SimpleReset]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
