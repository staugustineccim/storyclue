console.log("[test] Module loading");

export default async function handler(req, res) {
  console.log("[test] Handler called");
  return res.status(200).json({
    success: true,
    across: [{num: 1, dir: "A", answer: "TEST"}],
    down: [{num: 1, dir: "D", answer: "TEST"}],
    pattern: req.body?.pattern || [],
    fillTime: 0.1
  });
}
