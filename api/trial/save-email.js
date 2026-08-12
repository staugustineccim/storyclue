// Save trial email signup for marketing

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log("[Trial] Supabase not configured, skipping email save");
      return res.status(200).json({ saved: false, reason: "database_not_configured" });
    }

    // Save to trial_signups table
    const res2 = await fetch(`${supabaseUrl}/rest/v1/trial_signups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email,
        signed_up_at: new Date().toISOString(),
      }),
    });

    const data = await res2.json();
    if (!res2.ok) {
      console.log("[Trial] Save failed:", data);
      return res.status(200).json({ saved: false, reason: "database_error" });
    }

    console.log(`[Trial] Email saved: ${email}`);
    return res.status(200).json({ saved: true });
  } catch (err) {
    console.error("[Trial] Error:", err.message);
    return res.status(200).json({ saved: false, reason: err.message });
  }
}
