const videoId = "R_dO8hFyJgk";

async function testYouTubeCaptions() {
  try {
    console.log(`Testing YouTube captions API for video: ${videoId}`);

    // Get available caption tracks
    const trackRes = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&type=list`);
    const trackXml = await trackRes.text();

    console.log("\n=== TRACK LIST XML ===");
    console.log(trackXml.substring(0, 500));

    // Look for English captions
    const enMatches = trackXml.match(/lang_code='([^']*en[^']*)'/g);
    console.log("\n=== ENGLISH TRACK MATCHES ===");
    console.log(enMatches);

    if (!enMatches || enMatches.length === 0) {
      console.log("❌ No English captions found!");
      return;
    }

    const langCode = enMatches[0].replace(/lang_code='([^']*)'/, '$1');
    console.log(`\n✅ Found English caption track: ${langCode}`);

    // Get caption content
    const captionRes = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=${langCode}`);
    const captionXml = await captionRes.text();

    console.log("\n=== CAPTION XML (first 1000 chars) ===");
    console.log(captionXml.substring(0, 1000));

    const textMatches = captionXml.match(/<text[^>]*>([^<]+)<\/text>/g);
    console.log(`\n=== TEXT SEGMENTS FOUND: ${textMatches ? textMatches.length : 0} ===`);
    if (textMatches) {
      console.log("First 5 segments:");
      textMatches.slice(0, 5).forEach((m, i) => console.log(`  ${i+1}. ${m}`));
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

testYouTubeCaptions();
