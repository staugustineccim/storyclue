// Check status of Supadata transcription job

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobId } = req.query;
  if (!jobId) {
    return res.status(400).json({ error: "jobId parameter required" });
  }

  try {
    // Check Supadata job status
    const checkRes = await fetch(
      `https://api.supadata.ai/v1/transcript/status?jobId=${jobId}`,
      {
        headers: { "x-api-key": process.env.SUPADATA_API_KEY },
      }
    );

    if (!checkRes.ok) {
      console.error(`Supadata status check failed: ${checkRes.status}`);
      return res.status(500).json({ error: "Could not check transcription status" });
    }

    const data = await checkRes.json();

    // Supadata returns status: "processing" | "complete" | "failed"
    if (data.status === "complete" && data.transcript) {
      return res.status(200).json({
        status: "complete",
        transcript: typeof data.transcript === "string"
          ? data.transcript
          : Array.isArray(data.transcript)
            ? data.transcript.map(t => t.text || t).join(" ")
            : String(data.transcript || ""),
      });
    }

    if (data.status === "failed") {
      return res.status(200).json({
        status: "failed",
        error: data.error || "Transcription failed",
      });
    }

    // Still processing
    return res.status(200).json({ status: "processing" });
  } catch (err) {
    console.error(`Transcription status error: ${err.message}`);
    return res.status(500).json({ error: "Status check failed" });
  }
}
