export default async function handler(req, res) {
  try {
    // Get all church_sermons (puzzles created)
    const puzzlesRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_sermons?order=created_at.desc&limit=100`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!puzzlesRes.ok) {
      const err = await puzzlesRes.text();
      return res.status(puzzlesRes.status).json({ error: err });
    }

    const puzzles = await puzzlesRes.json();

    // Get churches with their pastor names
    const churchesRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_accounts?select=church_name,pastor_name,id`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const churches = await churchesRes.json();
    const churchMap = Object.fromEntries(churches.map(c => [c.id, c]));

    const stats = {
      total_puzzles: puzzles.length,
      recent_puzzles: puzzles.slice(0, 20).map(p => ({
        church_id: p.church_account_id,
        church_name: churchMap[p.church_account_id]?.church_name || 'Unknown',
        pastor_name: churchMap[p.church_account_id]?.pastor_name || 'Unknown',
        sermon_title: p.sermon_title,
        created_at: p.created_at,
        status: p.status
      }))
    };

    return res.status(200).json(stats);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
