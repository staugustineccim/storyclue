import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { pastorName, churchName, email, youtubeChannel, sendTime } = req.body;

  if (!pastorName || !churchName || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { error } = await supabase.from("church_accounts").insert({
    pastor_name: pastorName,
    church_name: churchName,
    sender_email: email,
    youtube_channel: youtubeChannel || null,
    send_time: sendTime || "14:00",
  });

  if (error) {
    console.error("church-signup error:", error);
    return res.status(500).json({ error: "Failed to save" });
  }

  return res.status(200).json({ ok: true });
}
