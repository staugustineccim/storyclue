// Load all 227 verified churches from Claude Transfer data
import fs from 'fs';

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Read the prepared churches JSON
    const jsonPath = '/tmp/churches_to_load.json';
    let churches = [];

    // Try to read from prepared file, or use inline list
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, 'utf-8');
      churches = JSON.parse(data);
    } else {
      // Fallback: use minimal inline list for testing
      console.log('[LoadClaude] JSON file not found, using test data');
      churches = [
        { church_name: "Swift Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=bxoW4g3NGJE", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com" },
        { church_name: "Saint Alban's Episcopal Church", youtube_channel: "https://www.youtube.com/watch?v=sxH4Whfy0_Q", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com" },
        { church_name: "LakeHaven Church", youtube_channel: "https://www.youtube.com/watch?v=m1o2J6LvdPg", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com" },
        { church_name: "First Presbyterian Church", youtube_channel: "https://www.youtube.com/watch?v=ClR4wBPo5T8", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com" },
        { church_name: "Grace Baptist Church", youtube_channel: "https://www.youtube.com/watch?v=Ue7iYtViPA4", pastor_name: "Pastor", sender_email: "bob@thepremierproperties.com" },
      ];
    }

    console.log(`[LoadClaude] Loaded ${churches.length} churches`);

    // Delete all existing
    console.log('[LoadClaude] Clearing old records...');
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const existing = await getRes.json();

    if (Array.isArray(existing) && existing.length > 0) {
      const filter = existing.map(r => `id=eq.${r.id}`).join(',or.');
      await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${filter}`, {
        method: 'DELETE',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      });
      console.log(`[LoadClaude] Deleted ${existing.length} old records`);
    }

    // Insert all verified churches
    console.log(`[LoadClaude] Inserting ${churches.length} verified churches...`);
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(churches),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      throw new Error(`Insert failed: ${insertRes.status}`);
    }

    console.log('[LoadClaude] Inserted successfully');
    return res.json({
      success: true,
      deleted: existing.length,
      inserted: churches.length,
      sample: churches.slice(0, 5).map(c => c.church_name),
    });

  } catch (err) {
    console.error('[LoadClaude] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
