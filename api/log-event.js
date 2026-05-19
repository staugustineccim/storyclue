import { sql } from "@vercel/postgres";

// Creates the events table on first call (safe to repeat — IF NOT EXISTS).
// Columns match the analytics spec:
//   event_type  TEXT        — puzzle_generated, puzzle_completed, etc.
//   properties  JSONB       — flexible key/value bag for each event
//   session_id  TEXT        — browser session (from sessionStorage)
//   timestamp   TIMESTAMPTZ — defaults to NOW()

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id          BIGSERIAL    PRIMARY KEY,
      event_type  TEXT         NOT NULL,
      properties  JSONB        DEFAULT '{}',
      session_id  TEXT         DEFAULT '',
      timestamp   TIMESTAMPTZ  DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS events_event_type_idx ON events (event_type)`;
  await sql`CREATE INDEX IF NOT EXISTS events_timestamp_idx  ON events (timestamp)`;
  await sql`CREATE INDEX IF NOT EXISTS events_session_idx    ON events (session_id)`;
  tableEnsured = true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { event_type, properties, session_id } = req.body || {};

  if (!event_type || typeof event_type !== "string") {
    return res.status(400).json({ error: "Missing event_type" });
  }

  try {
    await ensureTable();

    const safeType  = String(event_type).slice(0, 100);
    const safeProps = JSON.stringify(properties && typeof properties === "object" ? properties : {});
    const safeSid   = String(session_id || "").slice(0, 128);

    await sql`
      INSERT INTO events (event_type, properties, session_id)
      VALUES (${safeType}, ${safeProps}::jsonb, ${safeSid})
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("log-event error:", err);
    // Always return 200 — analytics NEVER break the user experience
    return res.status(200).json({ ok: true });
  }
}
