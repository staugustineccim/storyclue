// Get next flashcard questions for user
// Returns questions ordered by: overdue > due soon > optional
// Includes clue variants at appropriate difficulty level

import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, limit = 10 } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    // Get user's test version
    const sessionResult = await sql`
      SELECT test_version, current_phase FROM user_citizenship_sessions
      WHERE user_id = ${userId}
    `;

    if (sessionResult.rowCount === 0) {
      return res.status(404).json({ error: "User not initialized" });
    }

    const testVersion = sessionResult.rows[0].test_version;
    const currentPhase = sessionResult.rows[0].current_phase;

    // Phase 1: Show ALL questions (shuffle daily)
    // Phase 2+: Show only unmmastered questions
    let query;
    if (currentPhase === 1) {
      query = sql`
        SELECT
          cq.id,
          cq.question_text,
          cq.official_answer,
          cq.category,
          ucp.mastery_state,
          ucp.proficiency_level,
          ucp.times_seen,
          ucp.times_correct,
          (RANDOM() * 1000)::INT as shuffle
        FROM civics_questions cq
        LEFT JOIN user_citizenship_progress ucp
          ON cq.id = ucp.question_id AND ucp.user_id = ${userId}
        WHERE cq.test_version = ${testVersion}
        ORDER BY shuffle
        LIMIT ${limit}
      `;
    } else {
      // Phase 2+: Prioritize unmmastered and overdue
      query = sql`
        SELECT
          cq.id,
          cq.question_text,
          cq.official_answer,
          cq.category,
          ucp.mastery_state,
          ucp.proficiency_level,
          ucp.next_review_date,
          ucp.times_seen,
          ucp.times_correct,
          CASE
            WHEN ucp.next_review_date <= NOW()::DATE THEN 100
            WHEN ucp.next_review_date <= (NOW() + INTERVAL '3 days')::DATE THEN 50
            ELSE 10
          END as priority,
          CASE
            WHEN ucp.mastery_state < 3 THEN 1
            WHEN ucp.mastery_state < 6 THEN 2
            ELSE 3
          END as urgency
        FROM civics_questions cq
        LEFT JOIN user_citizenship_progress ucp
          ON cq.id = ucp.question_id AND ucp.user_id = ${userId}
        WHERE cq.test_version = ${testVersion}
          AND (ucp.mastery_state < 6 OR ucp.next_review_date <= (NOW() + INTERVAL '7 days')::DATE)
        ORDER BY priority DESC, urgency ASC, RANDOM()
        LIMIT ${limit}
      `;
    }

    const result = await query;

    if (result.rowCount === 0) {
      return res.status(200).json({
        message: "No more questions to review",
        questions: [],
      });
    }

    // For each question, get clue variants at appropriate difficulty
    const questions = [];
    for (const row of result.rows) {
      const clueResult = await sql`
        SELECT id, difficulty_level, clue_text
        FROM clue_variants
        WHERE question_id = ${row.id}
        ORDER BY difficulty_level ASC
      `;

      questions.push({
        id: row.id,
        question: row.question_text,
        answer: row.official_answer,
        category: row.category,
        masteryState: row.mastery_state || 1,
        proficiencyLevel: row.proficiency_level || 1,
        timesSeen: row.times_seen || 0,
        timesCorrect: row.times_correct || 0,
        clues: clueResult.rows.map(c => ({
          id: c.id,
          level: c.difficulty_level,
          text: c.clue_text,
        })),
      });
    }

    return res.status(200).json({
      userId,
      testVersion,
      currentPhase,
      questions,
      totalQuestions: questions.length,
    });
  } catch (err) {
    console.error("citizenship/get-flashcards error:", err);
    return res.status(500).json({ error: "Could not load flashcards" });
  }
}
