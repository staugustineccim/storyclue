// Hybrid load: use YouTube Channel URLs where available, fall back to Direct Video URLs
import { execSync } from 'child_process';

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    console.log('[HybridLoad] Reading Excel to combine YouTube Channel + Direct Video URLs...');

    const pythonScript = `
import pandas as pd
import json

file_path = r"C:\\Users\\Bob\\Downloads\\Church_YouTube_MASTER_CLAUDE_READY_2026-08-22.xlsx"
df = pd.read_excel(file_path, sheet_name='Claude Transfer')

churches = []
for _, row in df.iterrows():
    church_name = str(row.get('Church', '')).strip() if pd.notna(row.get('Church')) else None

    # Prefer YouTube Channel, fall back to Direct Video URL
    youtube_url = None
    if pd.notna(row.get('YouTube Channel')):
        youtube_url = str(row.get('YouTube Channel')).strip()
    elif pd.notna(row.get('Direct Video URL')):
        youtube_url = str(row.get('Direct Video URL')).strip()

    if church_name and youtube_url and church_name != 'nan' and youtube_url != 'nan':
        churches.append({
            'church_name': church_name,
            'youtube_channel': youtube_url
        })

print(json.dumps(churches))
`;

    let churches = [];
    try {
      const output = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
      churches = JSON.parse(output);
      console.log(`[HybridLoad] Extracted ${churches.length} churches (YouTube Channel + Direct Video URLs)`);
    } catch (err) {
      console.error(`[HybridLoad] Python failed:`, err.message);
      throw new Error(`Failed to read Excel: ${err.message}`);
    }

    if (churches.length === 0) {
      throw new Error('No churches found in Excel');
    }

    // Delete all existing churches
    console.log('[HybridLoad] Deleting old churches...');
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const existing = await getRes.json();

    if (Array.isArray(existing) && existing.length > 0) {
      for (let i = 0; i < existing.length; i += 100) {
        const batch = existing.slice(i, i + 100);
        const ids = batch.map(r => `id=eq.${r.id}`).join(',or.');
        await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?${ids}`, {
          method: 'DELETE',
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        });
      }
    }

    console.log(`[HybridLoad] Deleted ${existing.length} old records`);

    // Prepare and insert
    const toInsert = churches.map(c => ({
      church_name: c.church_name,
      youtube_channel: c.youtube_channel,
      pastor_name: 'Pastor',
      sender_email: 'bob@thepremierproperties.com',
    }));

    console.log(`[HybridLoad] Inserting ${toInsert.length} churches...`);

    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += 100) {
      const batch = toInsert.slice(i, i + 100);
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
        },
        body: JSON.stringify(batch),
      });

      if (!insertRes.ok) {
        console.warn(`[HybridLoad] Batch ${i/100 + 1} returned ${insertRes.status}`);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`[HybridLoad] Complete! Loaded ${inserted} churches`);

    return res.json({
      success: true,
      deleted_old: existing.length,
      loaded: inserted,
      message: `Hybrid load complete. ${inserted} churches (YouTube Channel URLs + Direct Video URLs)`
    });

  } catch (err) {
    console.error('[HybridLoad] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
