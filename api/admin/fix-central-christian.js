// One-time fix: Update Central Christian Church YouTube URL
export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/church_accounts?church_name=eq.Central Christian Church`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          youtube_channel: "https://www.youtube.com/@clearwaterdisciples",
        }),
      }
    );

    if (!updateRes.ok) {
      const text = await updateRes.text();
      throw new Error(`Update failed: ${updateRes.status} ${text}`);
    }

    return res.status(200).json({
      status: "success",
      message: "Central Christian Church YouTube URL updated",
      old_url: "https://www.youtube.com/@clearwaterdisciples.org",
      new_url: "https://www.youtube.com/@clearwaterdisciples",
    });
  } catch (err) {
    console.error("[Fix] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
