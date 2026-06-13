// ── Test script for Classic Crossword engine
// Run: node test-classic-engine.js
// Tests the full pipeline: pattern → fill → clue generation

import https from "https";

const BASE_URL = "http://localhost:3000"; // or your Vercel preview URL

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === "https:";
    const client = isHttps ? https : (await import("http")).default;

    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    const req = client.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log("🧪 Testing Classic Crossword Engine\n");

  try {
    // Step 1: Generate pattern
    console.log("Step 1: Generate symmetric 15×15 pattern...");
    const patternRes = await request("POST", "/api/pattern-generator", { seed: 0 });
    if (patternRes.status !== 200) {
      console.error("❌ Pattern generation failed:", patternRes.data);
      return;
    }
    const { pattern, slots } = patternRes.data;
    console.log(`✅ Pattern generated: ${slots.length} slots, ${pattern[0].length}×${pattern.length} grid\n`);

    // Step 2: Fill grid
    console.log("Step 2: Fill grid with constraint solver...");
    const fillRes = await request("POST", "/api/grid-builder", { pattern, slots, seed: 0, timeLimit: 6 });
    if (fillRes.status !== 200 || !fillRes.data.success) {
      console.error("❌ Grid fill failed:", fillRes.data);
      return;
    }
    console.log(`✅ Grid filled in ${fillRes.data.fillTime.toFixed(2)}s`);
    console.log(`   ${fillRes.data.across.length} across, ${fillRes.data.down.length} down\n`);

    // Step 3: Generate full puzzle (topic extraction + clues)
    console.log("Step 3: Generate full puzzle with AI...");
    const source = "The Tale of Jonah: A prophet named Jonah was called by God to preach to the city of Nineveh. But Jonah didn't want to go, so he ran away and sailed on a ship across the sea. A great storm came, and Jonah knew it was because of him. He asked the sailors to throw him overboard. When they did, a great fish swallowed him. Inside the fish for three days and nights, Jonah prayed to God. The fish then spit Jonah out on shore, and he finally went to Nineveh.";
    const classicRes = await request("POST", "/api/generate-classic", {
      source,
      grade: "6-12",
      theme: "Jonah",
      contentType: "text",
    });

    if (classicRes.status !== 200 || !classicRes.data.success) {
      console.error("❌ Classic puzzle generation failed:", classicRes.data);
      return;
    }

    const puzzle = classicRes.data.puzzle;
    console.log("✅ Full puzzle generated!");
    console.log(`   Words: ${puzzle.stats.wordCount}`);
    console.log(`   Blocks: ${puzzle.stats.blockCount}`);
    console.log(`   Fill time: ${puzzle.stats.fillTime.toFixed(2)}s`);
    console.log(`   Topic ratio: ${puzzle.stats.topicRatio * 100}% (${puzzle.stats.onTopicWords} on-topic words)`);
    console.log(`   Clues generated: ${puzzle.clues.length}`);

    // Show sample clues
    console.log("\n📋 Sample clues (Rich mode):");
    puzzle.clues.slice(0, 3).forEach((clue) => {
      console.log(`   ${clue.num}${clue.dir}: ${clue.clue_rich}`);
      console.log(`       Classic: ${clue.clue_classic}`);
    });

    console.log("\n✅ SUCCESS: Full Classic Crossword pipeline works!\n");
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

test();
