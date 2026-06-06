// ── /api/qa-report — QA Agent report endpoint ─────────────────────────────────
// Returns stored QA run history for the admin dashboard.
// Protected by the same ADMIN_PASSWORD as other admin endpoints.
//
// GET  → returns { latest, history } from Vercel KV
// POST → triggers a new QA run immediately (manual trigger from dashboard)

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // Auth check — same mechanism as admin-analytics and admin-feedback
  const password = req.headers["x-admin-password"];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ── GET: return stored report data ─────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const [latest, history] = await Promise.all([
        kv.get("qa:latest"),
        kv.get("qa:history"),
      ]);
      return res.status(200).json({
        latest:  latest  || null,
        history: history || [],
      });
    } catch (err) {
      console.error("[qa-report] KV read error:", err?.message);
      return res.status(200).json({ latest: null, history: [], kvError: true });
    }
  }

  // ── POST: trigger a new QA run ─────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://storyclue.ai";

      const r = await fetch(`${baseUrl}/api/qa-agent`, {
        method:  "POST",
        headers: {
          "content-type":    "application/json",
          "x-admin-password": password, // pass through admin auth
        },
        signal: AbortSignal.timeout(290_000), // just under the 300s maxDuration
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        return res.status(500).json({ error: `QA run failed: HTTP ${r.status}`, detail: txt });
      }

      const data = await r.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: `QA run error: ${err?.message || String(err)}` });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
