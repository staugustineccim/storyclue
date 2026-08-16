// Simple endpoint to count churches in database
export default async function handler(req, res) {
  try {
    const churchRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_accounts?select=count=exact&limit=1`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    console.log(`[Count] Response: ${churchRes.status}`);
    const range = churchRes.headers.get('content-range');
    console.log(`[Count] Content-Range header: ${range}`);

    // Also fetch actual list
    const listRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_accounts?select=church_name&order=church_name.asc`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const churches = await listRes.json();
    const uniqueNames = new Set(churches.map(c => c.church_name));

    return res.status(200).json({
      total_records: churches.length,
      unique_churches: uniqueNames.size,
      content_range: range,
      sample: Array.from(uniqueNames).slice(0, 15)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
