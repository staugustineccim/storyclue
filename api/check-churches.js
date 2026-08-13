export default async function handler(req, res) {
  try {
    const countRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_accounts?select=count`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const data = await countRes.json();
    console.log('[Check] Count response:', JSON.stringify(data));

    const listRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_accounts?limit=500`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const churches = await listRes.json();
    console.log(`[Check] Got ${Array.isArray(churches) ? churches.length : 'unknown'} churches`);

    if (Array.isArray(churches) && churches.length > 0) {
      console.log('[Check] First church:', JSON.stringify(churches[0]));
    }

    return res.status(200).json({
      count: Array.isArray(churches) ? churches.length : 'error',
      first: churches[0],
      allNames: Array.isArray(churches) ? churches.map(c => c.church_name) : []
    });
  } catch (err) {
    console.error('[Check] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
