export default async function handler(req, res) {
  try {
    const res2 = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_accounts?limit=1`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res2.ok) {
      const err = await res2.text();
      return res.status(res2.status).json({ error: err });
    }

    const data = await res2.json();
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      return res.status(200).json({
        columns,
        sampleRecord: data[0]
      });
    }

    return res.status(200).json({ message: 'Table is empty' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
