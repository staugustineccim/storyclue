// Check status of a Supadata transcription job.
//
// Fixed 2026-10-26: the job lookup now uses the same endpoint shape as the
// (working) church sermon cron — GET /v1/transcript/{jobId} — instead of the
// unverified /v1/transcript/status?jobId= form, and the transcript is read
// from `content` (string or segment array) as well as the legacy `transcript`
// field. The old endpoint shape is tried once as a fallback if the job
// endpoint does not answer.

function extractTranscript(data) {
  if (!data) return null;
  if (typeof data.content === "string") return data.content;
  if (Array.isArray(data.content)) return data.content.map(c => c.text || c).join(" ");
  if (typeof data.transcript === "string") return data.transcript;
  if (Array.isArray(data.transcript)) return data.transcript.map(t => t.text || t).join(" ");
  return null;
}

async function fetchJob(jobId) {
  const headers = { "x-api-key": process.env.SUPADATA_API_KEY };
  const primary = await fetch(
    `https://api.supadata.ai/v1/transcript/${encodeURIComponent(jobId)}`,
    { headers }
  );
  if (primary.ok) return primary.json();
  const legacy = await fetch(
    `https://api.supadata.ai/v1/transcript/status?jobId=${encodeURIComponent(jobId)}`,
    { headers }
  );
  if (legacy.ok) return legacy.json();
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobId } = req.query;
  if (!jobId) {
    return res.status(400).json({ error: "jobId parameter required" });
  }
  if (!process.env.SUPADATA_API_KEY) {
    return res.status(503).json({ error: "Transcription is not configured." });
  }

  try {
    const data = await fetchJob(jobId);
    if (!data) {
      return res.status(502).json({ error: "Could not check transcription status" });
    }

    const transcript = extractTranscript(data);
    if ((data.status === "complete" || transcript) && transcript) {
      return res.status(200).json({ status: "complete", transcript });
    }
    if (data.status === "failed" || data.status === "error") {
      return res.status(200).json({
        status: "failed",
        error: data.error || "Transcription failed",
      });
    }
    return res.status(200).json({ status: "processing" });
  } catch (err) {
    console.error(`Transcription status error: ${err.message}`);
    return res.status(500).json({ error: "Status check failed" });
  }
}
