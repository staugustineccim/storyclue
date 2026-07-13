// POST /api/webhooks/supadata-error
// Supadata calls this if transcription fails

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { error, errorMessage, metadata } = req.body;

    if (!metadata || !metadata.sermonId) {
      return res.status(400).json({ error: "Missing sermonId in metadata" });
    }

    const errorMsg = error || errorMessage || "Unknown transcription error";

    // Update sermon record with error status
    const { data: sermonRecord, error: fetchError } = await supabase
      .from("church_sermons")
      .select("*, church_accounts(*)")
      .eq("id", metadata.sermonId)
      .single();

    if (!fetchError && sermonRecord) {
      await supabase
        .from("church_sermons")
        .update({
          status: "error",
          error_message: errorMsg,
        })
        .eq("id", sermonRecord.id);

      // Email admin about the error
      if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "StoryClue <puzzles@storyclue.ai>",
            to: process.env.ADMIN_EMAIL,
            subject: `[ALERT] Sermon Transcription Failed — ${sermonRecord.church_accounts.church_name}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff3cd">
                <h2 style="color:#856404;margin-bottom:16px">Sermon Transcription Failed</h2>
                <p><strong>Church:</strong> ${sermonRecord.church_accounts.church_name}</p>
                <p><strong>Sermon:</strong> ${sermonRecord.sermon_title}</p>
                <p><strong>Video ID:</strong> ${sermonRecord.video_id}</p>
                <p><strong>Error:</strong> ${errorMsg}</p>
                <p style="margin-top:24px;color:#666;">
                  <a href="https://storyclue.ai/marketing-admin" style="color:#0066cc">View in Admin Dashboard</a>
                </p>
              </div>
            `,
          }),
        });
      }

      console.log(`[Church] Transcription error for ${sermonRecord.church_accounts.church_name}: ${errorMsg}`);
    }

    return res.status(200).json({ success: true, error: errorMsg });

  } catch (err) {
    console.error("[Church] Error webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
}
