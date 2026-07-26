// Seed citizenship civics questions into database with clue variants
// Run once to populate the database with all 100/128 USCIS civics questions

import { sql } from "@vercel/postgres";
import fs from "fs";
import path from "path";

// Generate clue variants at different difficulty levels
function generateClueVariants(question, answer, category) {
  const variants = [];

  // Extract key terms from the question and answer
  const questionWords = question.toLowerCase().split(/\s+/);
  const answerWords = answer.split(/\./)[0].split(/,/)[0].toLowerCase(); // First sentence

  // Level 1: Beginner (direct)
  variants.push({
    difficulty_level: 1,
    clue_text: `${question.replace(/\?$/, "")}`,
  });

  // Level 2: Intermediate (with context)
  const contextClues = {
    Constitution: "The supreme law of the land that...",
    Government: "The branch or official that...",
    Amendments: "The changes to the Constitution that protect...",
    Rights: "A fundamental freedom that...",
    History: "The historical event or document that...",
    Citizenship: "The process or requirement for being a U.S. citizen that...",
  };

  const baseClue = contextClues[category] || "The answer to this question is...";
  variants.push({
    difficulty_level: 2,
    clue_text: `${baseClue} ${answerWords}`,
  });

  // Level 3: Advanced (inference required)
  const advancedClues = {
    Constitution: `This document, adopted in ${answer.includes("1787") ? "1787" : "1776"}, establishes the framework for...`,
    Government: `This branch or official is responsible for enforcing, creating, or interpreting...`,
    Amendments: `These protect citizens' freedoms and were added to ensure...`,
    Rights: `This fundamental freedom allows citizens to...`,
    History: `This pivotal moment in U.S. history declared that...`,
    Citizenship: `To become a U.S. citizen, you must understand and support...`,
  };

  variants.push({
    difficulty_level: 3,
    clue_text: advancedClues[category] || `Related to: ${answerWords}`,
  });

  // Level 4: Expert (very indirect)
  variants.push({
    difficulty_level: 4,
    clue_text: `A key concept in U.S. government and civics: ${answerWords.charAt(0).toUpperCase()}${answerWords.slice(1)}`,
  });

  return variants;
}

export default async function seedDatabase() {
  console.log("[Seed] Starting citizenship database seed...");

  try {
    // Load questions from JSON
    const seedFilePath = path.join(process.cwd(), "api/citizenship/seed-questions.json");
    const seedData = JSON.parse(fs.readFileSync(seedFilePath, "utf-8"));

    console.log(`[Seed] Loaded ${seedData.civics_questions.length} questions from seed file`);

    // Create tables if they don't exist
    console.log("[Seed] Creating tables...");
    await sql`
      CREATE TABLE IF NOT EXISTS civics_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        official_answer TEXT NOT NULL,
        category VARCHAR(100),
        test_version VARCHAR(20),
        has_dynamic_content BOOLEAN DEFAULT false,
        dynamic_content_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(question_text, test_version)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS clue_variants (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES civics_questions(id),
        difficulty_level INTEGER,
        clue_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(question_id, difficulty_level)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_citizenship_progress (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        question_id INTEGER NOT NULL REFERENCES civics_questions(id),
        mastery_state INTEGER DEFAULT 1,
        ease_factor FLOAT DEFAULT 2.5,
        interval INTEGER DEFAULT 0,
        next_review_date DATE,
        times_seen INTEGER DEFAULT 0,
        times_correct INTEGER DEFAULT 0,
        proficiency_level INTEGER DEFAULT 1,
        last_attempt_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, question_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_citizenship_attempts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        question_id INTEGER NOT NULL REFERENCES civics_questions(id),
        clue_variant_id INTEGER REFERENCES clue_variants(id),
        answer_given TEXT,
        answer_correct BOOLEAN,
        time_taken_seconds INTEGER,
        hint_used BOOLEAN DEFAULT false,
        mode VARCHAR(50),
        attempted_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_citizenship_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        test_version VARCHAR(20),
        filing_date VARCHAR(20),
        current_phase INTEGER,
        flashcard_completed BOOLEAN DEFAULT false,
        mastery_percentage FLOAT DEFAULT 0,
        last_active TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS dynamic_content_sources (
        id SERIAL PRIMARY KEY,
        placeholder_type VARCHAR(100),
        api_endpoint TEXT,
        last_updated TIMESTAMP,
        data_json TEXT,
        UNIQUE(placeholder_type)
      )
    `;

    console.log("[Seed] Tables ready");

    // Insert questions and generate clues
    let insertedCount = 0;
    let skippedCount = 0;

    for (const q of seedData.civics_questions) {
      try {
        // Insert or skip if exists
        const testVersions = q.test_versions;

        for (const version of testVersions) {
          const result = await sql`
            INSERT INTO civics_questions (
              question_text,
              official_answer,
              category,
              test_version,
              has_dynamic_content,
              dynamic_content_type
            )
            VALUES (
              ${q.question_text},
              ${q.official_answer},
              ${q.category},
              ${version},
              ${q.dynamic_content || false},
              ${q.dynamic_type || null}
            )
            ON CONFLICT (question_text, test_version) DO UPDATE
            SET updated_at = NOW()
            RETURNING id
          `;

          if (result.rowCount > 0) {
            const questionId = result.rows[0].id;

            // Generate and insert clue variants
            const clues = generateClueVariants(q.question_text, q.official_answer, q.category);

            for (const clue of clues) {
              await sql`
                INSERT INTO clue_variants (question_id, difficulty_level, clue_text)
                VALUES (${questionId}, ${clue.difficulty_level}, ${clue.clue_text})
                ON CONFLICT (question_id, difficulty_level) DO UPDATE
                SET clue_text = ${clue.clue_text}
              `;
            }

            insertedCount++;
            if (insertedCount % 10 === 0) {
              console.log(`[Seed] Inserted ${insertedCount} questions...`);
            }
          } else {
            skippedCount++;
          }
        }
      } catch (err) {
        console.error(`[Seed] Error inserting question: "${q.question_text.substring(0, 50)}..."`, err.message);
      }
    }

    console.log(`[Seed] Complete! Inserted: ${insertedCount}, Skipped: ${skippedCount}`);

    // Verify counts
    const count100 = await sql`SELECT COUNT(*) as count FROM civics_questions WHERE test_version = '100'`;
    const count128 = await sql`SELECT COUNT(*) as count FROM civics_questions WHERE test_version = '128'`;

    console.log(
      `[Seed] Database now contains: ${count100.rows[0].count} questions (100-version), ${count128.rows[0].count} questions (128-version)`
    );

    return { success: true, insertedCount, skippedCount };
  } catch (err) {
    console.error("[Seed] Fatal error:", err);
    throw err;
  }
}

// Run if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
