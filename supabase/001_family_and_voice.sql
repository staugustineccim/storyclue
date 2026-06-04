-- ── StoryClue Database Migrations ────────────────────────────────────────────
-- Run these once in your Supabase project SQL editor.
-- Dashboard → SQL Editor → New Query → paste → Run

-- ── 1. Profiles table (upserted on sign-in by trial sync) ────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT,
  display_name     TEXT,
  avatar_url       TEXT,
  plan_level       TEXT DEFAULT 'free',       -- 'free' | 'homeschool' | 'teacher' | 'co-op'
  puzzle_count     INTEGER DEFAULT 0,
  last_active_at   TIMESTAMPTZ,
  is_founding_member BOOLEAN DEFAULT true,    -- true for all launch-period registrations
  trial_started_at TIMESTAMPTZ,
  upgrade_intent   JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-upsert profile on new sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, trial_started_at, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ── 2. Child profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS child_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  grade         TEXT NOT NULL DEFAULT '3',    -- grade key: 'k','1','2','3'... 'adult'
  audience      TEXT NOT NULL DEFAULT 'elementary', -- audience tier
  emoji         TEXT DEFAULT '⭐',             -- profile emoji chosen by parent
  puzzle_count  INTEGER DEFAULT 0,
  last_puzzle_at TIMESTAMPTZ,
  last_puzzle_title TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: parents can only see/edit their own children
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parent owns children"
  ON child_profiles FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- ── 3. Voice profiles (ElevenLabs parent voices — Update 9) ──────────────────
CREATE TABLE IF NOT EXISTS voice_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label          TEXT NOT NULL DEFAULT 'Mom',  -- 'Mom' | 'Dad' | 'Grandma' | 'Grandpa' | custom
  elevenlabs_voice_id TEXT,                    -- voice_id returned by ElevenLabs clone API
  is_active      BOOLEAN DEFAULT false,        -- which voice is currently selected
  is_deployed    BOOLEAN DEFAULT false,        -- true = "away" parent mode
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parent owns voices"
  ON voice_profiles FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- ── 4. Deployment messages (Update 10) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS deployment_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE CASCADE NOT NULL,
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  audio_url        TEXT,       -- Supabase Storage URL of the synthesized audio
  photo_url        TEXT,       -- Optional: parent-uploaded photo shown during message
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deployment_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parent owns deployment messages"
  ON deployment_messages FOR ALL
  USING (
    voice_profile_id IN (
      SELECT id FROM voice_profiles WHERE parent_id = auth.uid()
    )
  );

-- ── 5. Puzzle history (link saved puzzles to user) ────────────────────────────
-- The puzzles table is in Vercel Postgres. This is the Supabase mirror for user history.
CREATE TABLE IF NOT EXISTS puzzle_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  child_id      UUID REFERENCES child_profiles(id) ON DELETE SET NULL,
  puzzle_slug   TEXT NOT NULL,
  title         TEXT,
  grade         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE puzzle_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user owns puzzle history"
  ON puzzle_history FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Grant public access for anon key reads where needed ──────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON profiles TO anon;
