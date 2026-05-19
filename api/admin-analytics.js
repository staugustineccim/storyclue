import { sql } from "@vercel/postgres";

const GRADE_LABELS = {
  k: "Kindergarten", "1": "Grade 1", "2": "Grade 2", "3": "Grade 3",
  "4": "Grade 4", "5": "Grade 5", "6": "Grade 6", "7": "Grade 7",
  "8": "Grade 8", "9-10": "Grades 9–10", "11-12": "Grades 11–12",
  adult: "Reader Mode",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = req.headers["x-admin-password"];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Ensure table exists (handles first-ever analytics request gracefully)
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id          BIGSERIAL    PRIMARY KEY,
        event_type  TEXT         NOT NULL,
        properties  JSONB        DEFAULT '{}',
        session_id  TEXT         DEFAULT '',
        timestamp   TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    const [
      visitorsToday,
      visitorsWeek,
      puzzlesGenerated,
      puzzlesCompleted,
      hints,
      reveals,
      shares,
      topBooks,
      topGrades,
      recentGenerations,
    ] = await Promise.all([

      // Unique sessions today
      sql`
        SELECT COUNT(DISTINCT session_id) AS count
        FROM events
        WHERE timestamp >= CURRENT_DATE
      `,

      // Unique sessions this calendar week (Mon–Sun)
      sql`
        SELECT COUNT(DISTINCT session_id) AS count
        FROM events
        WHERE timestamp >= date_trunc('week', NOW())
      `,

      // Total puzzles generated (all time)
      sql`
        SELECT COUNT(*) AS count
        FROM events
        WHERE event_type = 'puzzle_generated'
      `,

      // Total puzzles completed (all time)
      sql`
        SELECT COUNT(*) AS count
        FROM events
        WHERE event_type = 'puzzle_completed'
      `,

      // Total hints used
      sql`
        SELECT COUNT(*) AS count
        FROM events
        WHERE event_type = 'hint_used'
      `,

      // Total answer reveals
      sql`
        SELECT COUNT(*) AS count
        FROM events
        WHERE event_type = 'show_answer_clicked'
      `,

      // Total shares
      sql`
        SELECT COUNT(*) AS count
        FROM events
        WHERE event_type = 'puzzle_shared'
      `,

      // Top 10 books by generation count
      sql`
        SELECT
          properties->>'book_title'  AS book,
          COUNT(*)                   AS count
        FROM events
        WHERE event_type = 'puzzle_generated'
          AND properties->>'book_title' IS NOT NULL
          AND properties->>'book_title' != ''
        GROUP BY properties->>'book_title'
        ORDER BY count DESC
        LIMIT 10
      `,

      // Top grade levels
      sql`
        SELECT
          properties->>'grade_level'  AS grade,
          COUNT(*)                    AS count
        FROM events
        WHERE event_type = 'puzzle_generated'
          AND properties->>'grade_level' IS NOT NULL
        GROUP BY properties->>'grade_level'
        ORDER BY count DESC
        LIMIT 12
      `,

      // Last 50 puzzle_generated events
      sql`
        SELECT
          properties->>'book_title'   AS book_title,
          properties->>'grade_level'  AS grade,
          properties->>'input_method' AS input_method,
          properties->>'faith_tradition' AS faith,
          session_id,
          timestamp
        FROM events
        WHERE event_type = 'puzzle_generated'
        ORDER BY timestamp DESC
        LIMIT 50
      `,
    ]);

    const generated = parseInt(puzzlesGenerated.rows[0]?.count || 0);
    const completed = parseInt(puzzlesCompleted.rows[0]?.count || 0);

    return res.status(200).json({
      visitorsToday:   parseInt(visitorsToday.rows[0]?.count   || 0),
      visitorsWeek:    parseInt(visitorsWeek.rows[0]?.count    || 0),
      puzzlesGenerated: generated,
      puzzlesCompleted: completed,
      hintsUsed:        parseInt(hints.rows[0]?.count    || 0),
      answersRevealed:  parseInt(reveals.rows[0]?.count  || 0),
      shareClicks:      parseInt(shares.rows[0]?.count   || 0),
      completionRate:   generated > 0 ? Math.round(completed / generated * 100) : 0,
      topBooks:  topBooks.rows,
      topGrades: topGrades.rows.map(r => ({
        ...r,
        label: GRADE_LABELS[r.grade] || r.grade,
      })),
      recentGenerations: recentGenerations.rows,
    });

  } catch (err) {
    console.error("admin-analytics error:", err);
    return res.status(500).json({ error: "Could not load analytics" });
  }
}
