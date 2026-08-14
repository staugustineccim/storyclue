export default async function handler(req, res) {
  const churches = [
    {"church_name":"Colonial Church St. Augustine","city":"St. Augustine","youtube_url":"https://www.youtube.com/colonialchurchsta","pastor_name":"Matt & Jill McCloghry","pastor_email":"contact@colonialchurch.life","church_email":"info@colonialchurch.life","phone":"(904) 824-3456"},
    {"church_name":"Grace and Faith Church","city":"Tampa","youtube_url":"https://www.youtube.com/c/graceandfaithchurch","pastor_name":"Rob Scarallo","pastor_email":"","church_email":"office@graceandfaith.church","phone":"(813) 855-8491"},
    {"church_name":"The Church of Eleven22","city":"Jacksonville","youtube_url":"https://www.youtube.com/channel/UCqB8wwurUvy5OifhjFR429Q","pastor_name":"Joby Martin","pastor_email":"","church_email":"communication@coe22.com","phone":"(904) 396-5900"},
    {"church_name":"Florida Gardens Baptist Church","city":"Lake Worth","youtube_url":"https://www.youtube.com/@gofgbc","pastor_name":"Lou Giampaglia","pastor_email":"","church_email":"","phone":"(561) 964-6822"},
    {"church_name":"Oasis Church","city":"Bradenton","youtube_url":"https://www.youtube.com/@OasisChurchFL941","pastor_name":"Steve & Kristin Coad","pastor_email":"steve@oasischurch.ag","church_email":"","phone":"(941) 747-0241"},
    {"church_name":"Island Community Church","city":"Merritt Island","youtube_url":"https://www.youtube.com/channel/UCCxoQEchmViGiPh6C9t2iVQ","pastor_name":"Dr. Paul Esposito","pastor_email":"","church_email":"","phone":"(321) 453-0565"},
    {"church_name":"Next Level Church","city":"Southwest Florida","youtube_url":"https://www.youtube.com/@NextLevelSWFL","pastor_name":"Matt & Sarah Keller","pastor_email":"","church_email":"","phone":"(239) 274-3755"},
    {"church_name":"House Of Faith","city":"Miami","youtube_url":"https://www.youtube.com/c/HouseOfFaith","pastor_name":"Guillermo Velazquez","pastor_email":"hello@hofmiami.com","church_email":"","phone":"(305) 654-0754"},
    {"church_name":"Journey Church","city":"Jacksonville","youtube_url":"https://www.youtube.com/user/JourneyChurchOrg","pastor_name":"Adam Hardegree","pastor_email":"","church_email":"","phone":"(904) 302-5320"},
    {"church_name":"Revival Church","city":"Holiday/Tampa Bay","youtube_url":"https://www.youtube.com/@RevivalCCFL","pastor_name":"","pastor_email":"","church_email":"info@revivalccfl.com","phone":"(727) 877-5009"}
  ];

  try {
    console.log(`[BulkLoad] Attempting to insert ${churches.length} churches...`);

    const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/church_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(churches),
    });

    const data = await insertRes.json();
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
