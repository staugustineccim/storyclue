import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { puzzleTitle, grade, stars, comment, wasRevealed, wouldPay, date } = req.body || {};

  // Basic validation
  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ error: "Invalid rating" });
  }

  const record = {
    puzzleTitle: String(puzzleTitle || "Unknown").slice(0, 200),
    grade: String(grade || "").slice(0, 20),
    stars: Number(stars),
    comment: String(comment || "").slice(0, 200),
    wasRevealed: Boolean(wasRevealed),
    wouldPay: wouldPay === null ? null : Boolean(wouldPay),
    date: String(date || new Date().toISOString()).slice(0, 30),
  };

  try {
    await kv.lpush("feedback", JSON.stringify(record));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("KV error:", err);
    // Return 200 anyway — don't break the user experience over feedback storage
    return res.status(200).json({ ok: true });
  }
}
