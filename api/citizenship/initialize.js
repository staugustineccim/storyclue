// Initialize citizenship mode for a new user
// Called on first visit to citizenship section

import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, filingDate } = req.body || {};

  if (!userId || !filingDate) {
    return res.status(400).json({ error: "Missing userId or filingDate" });
  }

  // Validate filing date
  if (!["before_oct_2025", "after_oct_2025"].includes(filingDate)) {
    return res.status(400).json({ error: "Invalid filing date" });
  }

  try {
    // Determine test version
    const testVersion = filingDate === "before_oct_2025" ? "100" : "128";

    // Check if user already initialized
    const existing = await sql`
      SELECT id FROM user_citizenship_sessions WHERE user_id = ${userId}
    `;

    if (existing.rowCount > 0) {
      return res.status(200).json({
        message: "User already initialized",
        testVersion,
        currentPhase: existing.rows[0].current_phase || 1,
      });
    }

    // Create user session
    await sql`
      INSERT INTO user_citizenship_sessions (user_id, test_version, filing_date, current_phase)
      VALUES (${userId}, ${testVersion}, ${filingDate}, 1)
    `;

    // Initialize progress for all questions in curriculum
    const questions = await sql`
      SELECT id FROM civics_questions WHERE test_version = ${testVersion}
    `;

    for (const q of questions.rows) {
      await sql`
        INSERT INTO user_citizenship_progress (user_id, question_id, mastery_state, next_review_date)
        VALUES (${userId}, ${q.id}, 1, NOW())
        ON CONFLICT (user_id, question_id) DO NOTHING
      `;
    }

    return res.status(200).json({
      message: "User initialized successfully",
      testVersion,
      totalQuestions: questions.rowCount,
      currentPhase: 1,
    });
  } catch (err) {
    console.error("citizenship/initialize error:", err);
    return res.status(500).json({ error: "Could not initialize citizenship mode" });
  }
}
