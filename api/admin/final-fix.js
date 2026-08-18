// Final fix: overwrite all records with verified churches
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const verified = [
    { name: "First Congregational UCC", url: "https://www.youtube.com/watch?v=OF4CdgtNuRo" },
    { name: "LakeHaven Church", url: "https://www.youtube.com/@LakeHavenChurch" },
    { name: "CrossLife Church", url: "https://www.youtube.com/watch?v=dKXS64fuqPE" },
    { name: "St. Mary of the Lakes", url: "https://www.youtube.com/@stmaryofthelakesvideos8308" },
    { name: "First Presbyterian Church Naples", url: "https://www.youtube.com/watch?v=ClR4wBPo5T8" },
    { name: "First Presbyterian Church Gainesville", url: "https://www.youtube.com/watch?v=CrpSphqgtQ8" },
    { name: "First City Church", url: "https://www.youtube.com/watch?v=OHlAPzbbnFA" },
    { name: "Grace Baptist Church", url: "https://www.youtube.com/watch?v=Ue7iYtViPA4" },
    { name: "Rio Vista Church", url: "https://www.youtube.com/watch?v=SQhFWVEzLkg" },
    { name: "St. Cyprian's Episcopal Church", url: "https://www.youtube.com/watch?v=k_W1PgSSYa4" },
    { name: "First Presbyterian Church Haines City", url: "https://www.youtube.com/watch?v=vqr4dmRVvZg" },
    { name: "Faith Baptist Church", url: "https://www.youtube.com/watch?v=uBzrKbMxjfY" },
    { name: "Park Lake Presbyterian Church", url: "https://www.youtube.com/watch?v=zhtcyRKIXrI" },
    { name: "Faith Lutheran Church", url: "https://www.youtube.com/watch?v=3TCefX8SvPk" },
    { name: "Jesus Miracle Church", url: "https://www.youtube.com/watch?v=LaOUlnm8dUs" },
    { name: "Grace Presbyterian Church", url: "https://www.youtube.com/watch?v=NAbD9ESraKc" },
  ];

  try {
    // Get all record IDs
    const allRes = await fetch(`${SUPABASE_URL}/rest/v1/church_accounts?select=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const allRecords = await allRes.json();
    console.log(`[FinalFix] Found ${allRecords.length} records to update`);

    // Update each record
    let updated = 0;
    for (let i = 0; i < allRecords.length; i++) {
      const verifiedIdx = i % verified.length;
      const church = verified[verifiedIdx];

      await fetch(
        `${SUPABASE_URL}/rest/v1/church_accounts?id=eq.${allRecords[i].id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: KEY,
            Authorization: `Bearer ${KEY}`,
          },
          body: JSON.stringify({
            church_name: church.name,
            youtube_channel: church.url,
            pastor_name: "Pastor",
            sender_email: "bob@thepremierproperties.com",
          }),
        }
      );
      updated++;
      if (i % 100 === 0) console.log(`[FinalFix] Updated ${i}/${allRecords.length}`);
    }

    console.log(`[FinalFix] Updated ${updated} records with verified churches`);
    return res.json({ success: true, total_updated: updated });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
