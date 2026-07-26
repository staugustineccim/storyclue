-- StoryClue Citizenship Mastery — Database Schema

-- ── CIVICS QUESTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS civics_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  official_answer TEXT NOT NULL,
  category VARCHAR(100),  -- e.g., "Constitution", "Rights", "Amendments"
  test_version VARCHAR(20),  -- "100" or "128"
  has_dynamic_content BOOLEAN DEFAULT false,
  dynamic_content_type VARCHAR(50),  -- e.g., "CURRENT_PRESIDENT", "STATE_GOVERNOR"
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_text, test_version)
);

-- ── CLUE VARIANTS (Different difficulty levels for same question) ──────────
CREATE TABLE IF NOT EXISTS clue_variants (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES civics_questions(id),
  difficulty_level INTEGER,  -- 1 (easy) to 4 (hard)
  clue_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_id, difficulty_level)
);

-- ── USER PROGRESS (Master tracking per user per question) ────────────────
CREATE TABLE IF NOT EXISTS user_citizenship_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  question_id INTEGER NOT NULL REFERENCES civics_questions(id),
  mastery_state INTEGER DEFAULT 1,  -- 1-7 (Not Introduced to Mastered)
  ease_factor FLOAT DEFAULT 2.5,  -- SM2 algorithm
  interval INTEGER DEFAULT 0,  -- days until next review
  next_review_date DATE,
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  proficiency_level INTEGER DEFAULT 1,  -- 1-5 (Beginner to Expert)
  last_attempt_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id),
  INDEX(user_id, next_review_date),
  INDEX(user_id, mastery_state)
);

-- ── USER ATTEMPTS (Detailed log of every practice attempt) ───────────────
CREATE TABLE IF NOT EXISTS user_citizenship_attempts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  question_id INTEGER NOT NULL REFERENCES civics_questions(id),
  clue_variant_id INTEGER REFERENCES clue_variants(id),
  answer_given TEXT,
  answer_correct BOOLEAN,
  time_taken_seconds INTEGER,
  hint_used BOOLEAN DEFAULT false,
  mode VARCHAR(50),  -- "flashcard", "crossword", "interview"
  attempted_at TIMESTAMP DEFAULT NOW(),
  INDEX(user_id, attempted_at),
  INDEX(question_id, answer_correct)
);

-- ── USER SESSIONS (Track current progress) ────────────────────────────────
CREATE TABLE IF NOT EXISTS user_citizenship_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  test_version VARCHAR(20),  -- "100" or "128"
  filing_date VARCHAR(20),  -- "before_oct_2025" or "after_oct_2025"
  current_phase INTEGER,  -- 1 (flashcards) to 3 (hybrid)
  flashcard_completed BOOLEAN DEFAULT false,
  mastery_percentage FLOAT DEFAULT 0,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX(user_id, last_active)
);

-- ── DYNAMIC CONTENT SOURCES (For questions with changing answers) ─────────
CREATE TABLE IF NOT EXISTS dynamic_content_sources (
  id SERIAL PRIMARY KEY,
  placeholder_type VARCHAR(100),  -- e.g., "CURRENT_PRESIDENT", "STATE_SENATORS"
  api_endpoint TEXT,
  last_updated TIMESTAMP,
  data_json TEXT,  -- cached API response
  UNIQUE(placeholder_type)
);

-- Insert default dynamic content sources
INSERT INTO dynamic_content_sources (placeholder_type, api_endpoint) VALUES
  ('CURRENT_PRESIDENT', 'https://api.whitehouse.gov/'),
  ('CURRENT_VICEPRESIDENT', 'https://api.whitehouse.gov/'),
  ('HOUSE_SPEAKER', 'https://api.congress.gov/'),
  ('STATE_GOVERNOR', 'https://api.states.gov/'),
  ('STATE_SENATORS', 'https://api.congress.gov/'),
  ('HOUSE_REPRESENTATIVE', 'https://api.congress.gov/')
ON CONFLICT (placeholder_type) DO NOTHING;
