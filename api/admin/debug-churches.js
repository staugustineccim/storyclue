// Debug script to check what's actually in the database
export default async function handler(req, res) {
  try {
    // Get all churches with their YouTube URLs
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_accounts?select=id,church_name,youtube_url&order=id`,
      {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const churches = await response.json();

    if (!Array.isArray(churches)) {
      return res.status(500).json({ error: "Failed to fetch churches", response: churches });
    }

    // Analyze the data
    const analysis = {
      total_records: churches.length,
      with_urls: churches.filter(c => c.youtube_url).length,
      without_urls: churches.filter(c => !c.youtube_url).length,
      duplicates: {},
      unique_names: new Set(),
      sample_records: churches.slice(0, 10),
    };

    churches.forEach(c => {
      analysis.unique_names.add(c.church_name);
      if (!analysis.duplicates[c.church_name]) {
        analysis.duplicates[c.church_name] = 0;
      }
      analysis.duplicates[c.church_name]++;
    });

    analysis.unique_names = Array.from(analysis.unique_names).length;
    const duplicated = Object.entries(analysis.duplicates)
      .filter(([_, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));

    analysis.duplicated_churches = duplicated;

    return res.status(200).json(analysis);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
