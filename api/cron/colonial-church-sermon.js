// Runs daily at 1:00pm ET via Vercel cron
// Processes Colonial Church St. Augustine sermon with three-part context structure

export const config = {
  schedule: "0 5 * * *", // 1:00am ET (05:00 UTC during daylight saving)
};

async function getYouTubeCaptions(videoId) {
  try {
    const trackRes = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&type=list`);
    const trackXml = await trackRes.text();
    const trackMatch = trackXml.match(/lang_code='([^']*en[^']*)'[^>]*name='([^']*)'[^>]*kind='([^']*)'/);
    if (!trackMatch) throw new Error("No captions found");

    const langCode = trackMatch[1];
    const captionRes = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=${langCode}`);
    const captionXml = await captionRes.text();

    const textMatches = captionXml.match(/<text[^>]*>([^<]+)<\/text>/g);
    if (!textMatches) throw new Error("No caption text found");

    const transcript = textMatches
      .map(match => match.replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, " ").trim())
      .filter(text => text.length > 0)
      .join(" ");

    return { transcript, service: "youtube-captions" };
  } catch (err) {
    throw new Error(`YouTube captions error: ${err.message}`);
  }
}

async function submitSupadataJob(videoId) {
  const encodedUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
  const res = await fetch(`https://api.supadata.ai/v1/transcript?url=${encodedUrl}`, {
    headers: { "x-api-key": process.env.SUPADATA_API_KEY },
  });
  const data = await res.json();
  if (!data || data.error) throw new Error(`Supadata error: ${JSON.stringify(data)}`);

  if (typeof data.content === "string") return { transcript: data.content, jobId: null, service: "supadata" };
  if (Array.isArray(data.content)) return { transcript: data.content.map(c => c.text || c).join(" "), jobId: null, service: "supadata" };
  if (data.transcript) return { transcript: data.transcript, jobId: null, service: "supadata" };
  if (data.jobId) return { transcript: null, jobId: data.jobId, service: "supadata" };

  throw new Error(`Supadata unexpected response: ${JSON.stringify(data)}`);
}

async function generatePuzzle(transcript) {
  const res = await fetch("https://storyclue.ai/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      inputMode: "paste",
      chapterText: transcript,
      grade: "4",
      faith: "christian-protestant",
      language: "english",
    }),
  });

  if (!res.ok) throw new Error(`Generate API error: ${res.status}`);
  return await res.json();
}

async function sendEmail(to, subject, puzzleLink) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: "puzzles@storyclue.ai",
      to,
      subject,
      html: `
        <h2>${subject}</h2>
        <p>Your sermon-based crossword puzzle is ready!</p>
        <p><a href="${puzzleLink}" style="background-color: #2D5A1A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Play Puzzle</a></p>
        <p style="font-size: 12px; color: #666;">Each word includes the sermon's main teaching point, pastor's explanation, and biblical foundation.</p>
      `,
    }),
  });

  if (!res.ok) throw new Error(`Resend error: ${res.status}`);
  return await res.json();
}

export default async function handler(req, res) {
  const videoId = "t9g0Flin-pQ"; // Colonial Church sermon
  const recipientEmail = "bob@thepremierproperties.com";

  try {
    console.log(`[Cron] Processing sermon: ${videoId}`);

    // Step 1: Get transcript (try YouTube captions first, then Supadata)
    let transcript;
    try {
      const result = await getYouTubeCaptions(videoId);
      transcript = result.transcript;
      console.log(`[Cron] Got transcript from ${result.service}`);
    } catch (captionErr) {
      console.log(`[Cron] Captions failed, trying Supadata...`);
      const result = await submitSupadataJob(videoId);
      if (!result.transcript) {
        return res.status(202).json({
          status: "submitted",
          message: "Transcription job submitted to Supadata, will be processed asynchronously",
          jobId: result.jobId,
        });
      }
      transcript = result.transcript;
      console.log(`[Cron] Got transcript from Supadata`);
    }

    // Step 2: Generate puzzle with three-part sourceQuote structure
    console.log(`[Cron] Generating puzzle...`);
    const puzzle = await generatePuzzle(transcript);

    // Step 3: Send email with puzzle link
    console.log(`[Cron] Sending email to ${recipientEmail}...`);
    const puzzleLink = `https://storyclue.ai/play?p=${puzzle.encodedPuzzle}`;
    await sendEmail(recipientEmail, "Your Colonial Church Sermon Crossword", puzzleLink);

    console.log(`[Cron] ✅ Complete`);
    return res.status(200).json({
      status: "success",
      message: "Sermon processed and puzzle sent",
      videoId,
      email: recipientEmail,
      puzzleLink,
    });
  } catch (err) {
    console.error(`[Cron] Error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: err.message,
      videoId,
    });
  }
}
