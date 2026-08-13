import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, '../Florida_Churches_FINAL_Database.csv');

export default async function handler(req, res) {
  // Check if CSV exists (for local testing)
  if (!fs.existsSync(csvPath)) {
    console.log(`CSV not found at ${csvPath}, skipping load`);
    return res.status(200).json({ message: 'CSV not available in production' });
  }

  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const churches = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const church = {};
      headers.forEach((header, idx) => {
        const value = values[idx]?.trim() || null;
        church[header] = value === '' || value === 'null' ? null : value;
      });
      churches.push(church);
    }

    console.log(`[Load] Inserting ${churches.length} churches...`);

    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < churches.length; i += batchSize) {
      const batch = churches.slice(i, i + batchSize);
      const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/church_accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(batch),
      });

      if (!insertRes.ok) {
        const err = await insertRes.text();
        console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, err);
      } else {
        inserted += batch.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} churches inserted`);
      }
    }

    return res.status(200).json({
      message: `Loaded ${inserted} churches`,
      total: churches.length
    });

  } catch (err) {
    console.error('[Load] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
