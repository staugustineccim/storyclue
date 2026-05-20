/**
 * GET /api/get-images
 *
 * POST body: { words: ["PIG", "BARN", "WILBUR", ...] }
 * Returns:   { images: { "PIG": "https://upload.wikimedia.org/...", ... } }
 *
 * Fetches Wikipedia thumbnail images for vocabulary words.
 * Words with no Wikipedia thumbnail are simply omitted — the client
 * falls back to the AI-generated emoji for those.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { words } = req.body || {};
  if (!Array.isArray(words) || !words.length) {
    return res.status(400).json({ error: "words array required" });
  }

  // Deduplicate and uppercase
  const unique = [...new Set(words.map(w => String(w).toUpperCase()))];

  const images = {};

  // Fetch all words in parallel using the MediaWiki API (better coverage
  // than REST v1 for simple concrete K-2 words like SHIP, FISH, WHALE).
  // Falls back to REST v1 summary if MediaWiki returns no image.
  await Promise.all(
    unique.map(async (word) => {
      try {
        const query = encodeURIComponent(word.toLowerCase());

        // ── Attempt 1: MediaWiki pageimages API ──────────────────────────
        const mwUrl =
          `https://en.wikipedia.org/w/api.php?action=query` +
          `&titles=${query}&prop=pageimages&pithumbsize=400` +
          `&pilicense=any&format=json&origin=*`;

        const mwR = await fetch(mwUrl, {
          headers: { "User-Agent": "StoryClue/1.0 (storyclue.ai; educational crossword app)" },
          signal: AbortSignal.timeout(4000),
        });

        if (mwR.ok) {
          const mwData = await mwR.json();
          const pages  = mwData?.query?.pages || {};
          const page   = Object.values(pages)[0];
          const src    = page?.thumbnail?.source;
          if (src && src.startsWith("https://") && !src.endsWith(".svg")) {
            images[word] = src;
            return; // got it — no need for fallback
          }
        }

        // ── Attempt 2: REST v1 summary (fallback) ────────────────────────
        const r = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`,
          {
            headers: { "User-Agent": "StoryClue/1.0 (storyclue.ai; educational crossword app)" },
            signal: AbortSignal.timeout(3000),
          }
        );
        if (!r.ok) return;
        const data = await r.json();
        const src2 = data?.thumbnail?.source;
        if (src2 && src2.startsWith("https://") && !src2.endsWith(".svg")) {
          images[word] = src2;
        }
      } catch {
        // silently skip — emoji fallback handles it
      }
    })
  );

  return res.status(200).json({ images });
}
