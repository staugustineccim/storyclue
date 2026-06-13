-- ── StoryClue Vocabulary Progress Table ──────────────────────────────────────
-- Stores per-child word mastery data for cross-device sync.
-- localStorage is the primary store; this table is background-synced when the
-- user is logged in. The SM-2 algorithm runs client-side; we store final state.
--
-- Run this in Supabase Dashboard → SQL Editor after 001_profiles.sql
-- Steps:
--   1. Go to supabase.com → your project → SQL Editor
--   2. Paste this entire file and click Run

CREATE TABLE IF NOT EXISTS word_progress (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id          UUID        REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  word              TEXT        NOT NULL,
  grade             TEXT        NOT NULL DEFAULT '3',
  encounters        INTEGER     NOT NULL DEFAULT 0,
  correct_clean     INTEGER     NOT NULL DEFAULT 0,
  hints_used        INTEGER     NOT NULL DEFAULT 0,
  letter_revealed   INTEGER     NOT NULL DEFAULT 0,
  shows_used        INTEGER     NOT NULL DEFAULT 0,
  mistakes          INTEGER     NOT NULL DEFAULT 0,
  status            TEXT        NOT NULL DEFAULT 'learning',
  -- status values: 'learning' | 'struggling' | 'mastered'
  interval_days     INTEGER     NOT NULL DEFAULT 1,
  clue_grade_offset INTEGER     NOT NULL DEFAULT 0,
  next_review_at    TIMESTAMPTZ,
  last_seen_at      TIMESTAMPTZ,
  mastered_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, word)
);

-- Index for fast per-child lookups
CREATE INDEX IF NOT EXISTS word_progress_child_idx    ON word_progress(child_id);
CREATE INDEX IF NOT EXISTS word_progress_parent_idx   ON word_progress(parent_id);
CREATE INDEX IF NOT EXISTS word_progress_status_idx   ON word_progress(child_id, status);
CREATE INDEX IF NOT EXISTS word_progress_review_idx   ON word_progress(child_id, next_review_at)
  WHERE next_review_at IS NOT NULL;

-- Auto-update updated_at on row changes (reuse the trigger function from 001)
CREATE TRIGGER word_progress_updated_at
  BEFORE UPDATE ON word_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row-Level Security ────────────────────────────────────────────────────────
-- The service role (used by API functions) bypasses RLS entirely.
-- The anon/authenticated client can only read their own children's data.

ALTER TABLE word_progress ENABLE ROW LEVEL SECURITY;

-- Parents can read progress for their own children
CREATE POLICY "Parent can read own children word progress"
  ON word_progress FOR SELECT
  USING (auth.uid() = parent_id);

-- Only the service role (API) writes to this table — no direct client writes
-- Service role bypasses RLS, so no insert/update policy needed for it.
-- This prevents any client-side tampering with progress records.
