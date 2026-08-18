// Just count what's actually in the database
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const churchRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=count()`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    const churches = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id,church_name&limit=20`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    }).then(r => r.json());

    return res.status(200).json({
      total_records: churches.length,
      first_20: churches,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
