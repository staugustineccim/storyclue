export default async function handler(req, res) {
  try {
    // Get one of the waiting sermons
    const sermonRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/church_sermons?status=eq.waiting_for_captions&limit=1&order=created_at.desc`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const sermons = await sermonRes.json();
    if (!sermons.length) {
      return res.status(200).json({ message: "No waiting sermons" });
    }

    const sermon = sermons[0];
    const videoId = sermon.video_id;

    console.log(`Testing caption fetch for video: ${videoId}`);

    // Test YouTube caption API
    const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
    console.log(`Caption URL: ${captionUrl}`);

    const captionRes = await fetch(captionUrl);
    console.log(`Caption API Status: ${captionRes.status}`);

    const captionText = await captionRes.text();
    console.log(`Caption Response Length: ${captionText.length}`);
    console.log(`First 500 chars: ${captionText.substring(0, 500)}`);

    // Also test if we can access the video page directly
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const videoRes = await fetch(videoPageUrl);
    console.log(`Video Page Status: ${videoRes.status}`);

    return res.status(200).json({
      sermon: {
        title: sermon.sermon_title,
        video_id: videoId,
        status: sermon.status,
        created_at: sermon.created_at
      },
      caption_test: {
        url: captionUrl,
        status: captionRes.status,
        response_length: captionText.length,
        response_preview: captionText.substring(0, 500)
      },
      video_page_status: videoRes.status
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
