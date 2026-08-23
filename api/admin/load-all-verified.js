// Load ALL verified churches from Excel master list to database
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Read Excel file using Node built-ins + fetch
    const fs = await import('fs');
    const excelFile = "C:\\Users\\Bob\\Downloads\\Church_YouTube_MASTER_CURRENT_REGENERATED_2026-08-22_2204 (1).xlsx";

    // Use Python subprocess to read Excel and return JSON
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('[LoadAllVerified] Reading Excel file...');
    const { stdout } = await execAsync(`python3 -c "
import pandas as pd
import json
df = pd.read_excel(r'${excelFile}', sheet_name='Unique Master')
df_valid = df[df['Direct YouTube Video URL'].notna()].copy()
churches = []
for _, row in df_valid.iterrows():
    if pd.notna(row['Direct YouTube Video URL']) and pd.notna(row['Church']):
        churches.append({
            'church_name': str(row['Church']),
            'youtube_channel': str(row['Direct YouTube Video URL']),
            'city': str(row['City']) if pd.notna(row['City']) else 'Unknown',
            'state': str(row['State']) if pd.notna(row['State']) else 'Unknown'
        })
print(json.dumps(churches))
"`);

    const churches = JSON.parse(stdout);
    console.log(`[LoadAllVerified] Read ${churches.length} verified churches from Excel (U.S. + International)`);

    // Prepare insert data
    const toInsert = churches.map(c => ({
      church_name: c.church_name,
      youtube_channel: c.youtube_channel,
      pastor_name: "Pastor",
      sender_email: "bob@thepremierproperties.com",
    }));

    // Delete existing
    console.log('[LoadAllVerified] Deleting existing records...');
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
    }

    // Insert all verified churches
    console.log(`[LoadAllVerified] Inserting ${toInsert.length} churches...`);
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(toInsert),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      throw new Error(`Insert failed: ${insertRes.status} - ${err}`);
    }

    console.log('[LoadAllVerified] Success!');
    return res.json({
      success: true,
      deleted_old: existing.length,
      loaded_verified: toInsert.length,
      sample_churches: toInsert.slice(0, 5).map(c => c.church_name),
    });

  } catch (err) {
    console.error('[LoadAllVerified]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
