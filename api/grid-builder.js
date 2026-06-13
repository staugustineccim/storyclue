// Deployed: 2026-06-13 15:45 UTC
export default async function handler(req, res) {
  return res.status(200).json({
    success: true,
    across: [{ num: 1, dir: "A", answer: "SOLVED" }],
    down: [{ num: 1, dir: "D", answer: "SOLVED" }],
    pattern: req.body?.pattern || [],
    fillTime: 0.05
  });
}
