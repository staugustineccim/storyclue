export default async function handler(req, res) {
  const churches = [{"church_name":"Colonial Church St. Augustine","pastor_name":"Matt & Jill McCloghry","sender_email":"contact@colonialchurch.life","youtube_channel":"https://www.youtube.com/c/colonialchurchsta"},{"church_name":"Journey Church","pastor_name":"Adam Hardegree","sender_email":"info@journeychurch.org","youtube_channel":"https://www.youtube.com/user/JourneyChurchOrg"},{"church_name":"First Church Orlando","pastor_name":"Vance Rains","sender_email":"Contact@FirstChurchOrlando.org","youtube_channel":"https://www.youtube.com/channel/UCc3sZahbZYH8T1E5hkV4--w"},{"church_name":"Spirit Life Worship Church","pastor_name":"Michael Desroches","sender_email":"spiritlifeworshipchurch@gmail.com","youtube_channel":"https://www.youtube.com/c/pastoroncall"},{"church_name":"Tampa Life Church","pastor_name":"Robert Tisdale","sender_email":"admin@tampalife.church","youtube_channel":"https://www.youtube.com/c/TampaLifeChurch"}];

  try {
    console.log(`[BulkLoad] Inserting ${churches.length} churches...`);

    const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/church_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(churches),
    });

    const text = await insertRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('[BulkLoad] Response was not JSON:', text.substring(0, 500));
      throw new Error(`Supabase returned non-JSON: ${insertRes.status} ${text.substring(0, 200)}`);
    }

    console.log(`[BulkLoad] Response: ${insertRes.status}`, JSON.stringify(data).substring(0, 200));

    if (!insertRes.ok) {
      throw new Error(`Insert failed: ${insertRes.status} ${JSON.stringify(data)}`);
    }

    return res.status(200).json({
      message: `Successfully inserted ${churches.length} churches`,
      count: churches.length
    });

  } catch (err) {
    console.error('[BulkLoad] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
