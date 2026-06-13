// Test version: just return hardcoded puzzle
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pattern, slots } = req.body;
  if (!pattern || !slots) {
    return res.status(400).json({ error: "Missing pattern or slots" });
  }

  // Return hardcoded solution to test endpoint structure
  return res.status(200).json({
    success: true,
    pattern,
    across: [
      { num: 1, dir: "A", answer: "TEST" },
      { num: 16, dir: "A", answer: "WORKS" },
    ],
    down: [
      { num: 1, dir: "D", answer: "TEST" },
      { num: 2, dir: "D", answer: "WORKS" },
    ],
    fillTime: 0.1,
  });
}
