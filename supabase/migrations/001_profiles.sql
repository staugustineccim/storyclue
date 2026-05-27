-- ── StoryClue profiles table ────────────────────────────────────────────────
-- Run this once in your Supabase dashboard → SQL Editor.
-- This enables trial tracking, founding member status, and future Stripe billing.
--
-- Steps:
--   1. Go to supabase.com → your project → SQL Editor
--   2. Paste this entire file and click Run

CREATE TABLE IF NOT EXISTS profiles (
  id                UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  trial_started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  founding_member   BOOLEAN     NOT NULL DEFAULT FALSE,
  plan              TEXT        NOT NULL DEFAULT 'trial',
  -- plan values: 'trial' | 'grace' | 'single-founding' | 'family-founding' |
  --              'single' | 'family' | 'expired'
  upgrade_intent    JSONB,
  -- upgrade_intent shape: { plan: 'single-founding'|'family-founding', at: ISO, confirmed: bool }
  stripe_customer_id TEXT,        -- filled when Stripe is connected
  stripe_subscription_id TEXT,    -- filled when Stripe is connected
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row-level security — users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create a profile row when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, trial_started_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
