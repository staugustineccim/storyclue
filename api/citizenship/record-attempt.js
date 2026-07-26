// Record flashcard or interview attempt and update SM2 scores

import { sql } from "@vercel/postgres";
import { calculateSM2, evaluateAnswer, selectClueLevel } from "./sm2.js";
import { replaceDynamicContent } from "./fetch-dynamic-content.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    userId,
    questionId,
    clueVariantId,
    userAnswer,
    mode = "flashcard", // "flashcard" or "interview"
    timeTakenSeconds = 0,
    hintUsed = false,
  } = req.body || {};

  if (!userId || !questionId || !userAnswer) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Get question details
    const questionResult = await sql`
      SELECT official_answer FROM civics_questions WHERE id = ${questionId}
    `;

    if (questionResult.rowCount === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    let officialAnswer = questionResult.rows[0].official_answer;

    // Replace dynamic content placeholders (elected officials, etc.)
    // User's ZIP code could be passed in body for more accurate results
    officialAnswer = await replaceDynamicContent(officialAnswer, req.body?.userZipCode);

    // Evaluate answer correctness
    const quality = evaluateAnswer(userAnswer, officialAnswer);
    const isCorrect = quality >= 3; // 3+ is considered correct

    // Get current progress
    const progressResult = await sql`
      SELECT
        ease_factor,
        interval,
        repetitions,
        mastery_state,
        proficiency_level,
        times_seen,
        times_correct
      FROM user_citizenship_progress
      WHERE user_id = ${userId} AND question_id = ${questionId}
    `;

    if (progressResult.rowCount === 0) {
      return res.status(404).json({ error: "User progress not found" });
    }

    const progress = progressResult.rows[0];

    // Calculate SM2 scores
    const sm2Result = calculateSM2(
      quality,
      progress.ease_factor || 2.5,
      progress.interval || 0,
      progress.repetitions || 0
    );

    // Determine new mastery state
    let newMasteryState = progress.mastery_state || 1;
    if (newMasteryState === 1) newMasteryState = 2; // Not Introduced → Introduced
    if (isCorrect && newMasteryState === 2) newMasteryState = 3; // Introduced → Recognized

    // Determine new proficiency level
    let newProficiencyLevel = progress.proficiency_level || 1;
    if (isCorrect && newProficiencyLevel < 5) {
      // Escalate on correct answer
      if (Math.random() > 0.6) newProficiencyLevel += 1;
    } else if (!isCorrect && newProficiencyLevel > 1) {
      // Degrade on wrong answer
      newProficiencyLevel -= 1;
    }

    // Update progress
    await sql`
      UPDATE user_citizenship_progress
      SET
        ease_factor = ${sm2Result.nextEaseFactor},
        interval = ${sm2Result.nextInterval},
        repetitions = ${sm2Result.nextRepetitions},
        next_review_date = ${sm2Result.nextReviewDate}::DATE,
        mastery_state = ${newMasteryState},
        proficiency_level = ${newProficiencyLevel},
        times_seen = times_seen + 1,
        times_correct = CASE WHEN ${isCorrect} THEN times_correct + 1 ELSE times_correct END,
        last_attempt_date = NOW(),
        updated_at = NOW()
      WHERE user_id = ${userId} AND question_id = ${questionId}
    `;

    // Record attempt
    await sql`
      INSERT INTO user_citizenship_attempts (
        user_id, question_id, clue_variant_id,
        answer_given, answer_correct, time_taken_seconds, hint_used, mode
      )
      VALUES (
        ${userId}, ${questionId}, ${clueVariantId || null},
        ${userAnswer}, ${isCorrect}, ${timeTakenSeconds}, ${hintUsed}, ${mode}
      )
    `;

    // Check if user has completed Phase 1 (all questions seen at least once)
    const allSeen = await sql`
      SELECT COUNT(*) as total FROM civics_questions cq
      WHERE cq.test_version = (
        SELECT test_version FROM user_citizenship_sessions WHERE user_id = ${userId}
      )
    `;

    const seenCount = await sql`
      SELECT COUNT(*) as count FROM user_citizenship_progress
      WHERE user_id = ${userId} AND times_seen > 0
    `;

    const phase1Complete = seenCount.rows[0].count >= allSeen.rows[0].total;

    // Update session phase if needed
    if (phase1Complete) {
      await sql`
        UPDATE user_citizenship_sessions
        SET current_phase = 2, flashcard_completed = true
        WHERE user_id = ${userId} AND current_phase = 1
      `;
    }

    // Calculate mastery percentage
    const masteredCount = await sql`
      SELECT COUNT(*) as count FROM user_citizenship_progress
      WHERE user_id = ${userId} AND mastery_state >= 6
    `;

    const masteryPercentage = Math.round(
      (masteredCount.rows[0].count / allSeen.rows[0].total) * 100
    );

    return res.status(200).json({
      success: true,
      attempt: {
        isCorrect,
        quality,
        userAnswer,
        officialAnswer,
      },
      progress: {
        nextReviewDate: sm2Result.nextReviewDate,
        nextInterval: sm2Result.nextInterval,
        newMasteryState,
        newProficiencyLevel,
      },
      session: {
        phase1Complete,
        masteryPercentage,
        showConversionPrompt: masteryPercentage >= 60,
      },
    });
  } catch (err) {
    console.error("citizenship/record-attempt error:", err);
    return res.status(500).json({ error: "Could not record attempt" });
  }
}
