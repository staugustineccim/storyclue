// Test endpoint to check AssemblyAI job status
export default async function handler(req, res) {
  const jobIds = [
    "04468c95-3844-4d09-9337-aa5766a5461b",
    "ff46c798-3032-43f7-8243-f9dbee28f704",
    "944a2b9e-aee0-4f3b-b904-b9438eead858"
  ];

  const results = [];

  for (const jobId of jobIds) {
    try {
      const apiRes = await fetch(`https://api.assemblyai.com/v2/transcript/${jobId}`, {
        headers: { "Authorization": process.env.ASSEMBLYAI_API_KEY },
      });

      const data = await apiRes.json();
      results.push({
        jobId,
        status: data.status,
        error: data.error,
        percentComplete: data.completed ? 100 : (data.processing ? "in progress" : "queued"),
      });
    } catch (err) {
      results.push({ jobId, error: err.message });
    }
  }

  return res.status(200).json(results);
}
