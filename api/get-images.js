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

  // Fetch all words in parallel — Wikipedia REST API is fast and free
  await Promise.all(
    unique.map(async (word) => {
      try {
        const query = encodeURIComponent(word.toLowerCase());
        const r = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`,
          {
            headers: { "User-Agent": "StoryClue/1.0 (storyclue.ai; educational crossword app)" },
            // 3-second timeout so a slow article never blocks page load
            signal: AbortSignal.timeout(3000),
          }
        );
        if (!r.ok) return;
        const data = await r.json();
        // Only use thumbnail images (not icons / SVGs)
        const src = data?.thumbnail?.source;
        if (src && src.startsWith("https://") && !src.endsWith(".svg")) {
          images[word] = src;
        }
      } catch {
        // silently skip — emoji fallback handles it
      }
    })
  );

  return res.status(200).json({ images });
}
