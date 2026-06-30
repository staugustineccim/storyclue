-- Church Mode tables
-- Run in Supabase SQL Editor

create table if not exists church_accounts (
  id uuid primary key default gen_random_uuid(),
  pastor_name text not null,
  church_name text not null,
  denomination text,
  city text,
  state text,
  congregation_size int,
  sender_email text,
  sender_name text,
  send_time text default '14:00',
  congregation_emails text[],
  created_at timestamptz default now()
);

create table if not exists church_sermons (
  id uuid primary key default gen_random_uuid(),
  church_account_id uuid references church_accounts(id),
  video_id text unique,
  sermon_title text,
  puzzle_slug text references puzzles(slug),
  status text default 'ready_to_send',  -- ready_to_send | sent | failed
  send_scheduled_at timestamptz,
  sent_at timestamptz,
  congregation_size int,
  engagement jsonb default '{}',
  created_at timestamptz default now()
);

-- Engagement events: one row per member per sermon
create table if not exists church_engagement (
  id uuid primary key default gen_random_uuid(),
  sermon_id uuid references church_sermons(id),
  member_email text,
  member_name text,
  email_opened_at timestamptz,
  puzzle_started_at timestamptz,
  puzzle_completed_at timestamptz,
  completion_time_seconds int,
  word_results jsonb default '{}',  -- { "CONFORM": true, "TRANSFORM": false, ... }
  created_at timestamptz default now()
);

-- RLS: church data is private (pastors only)
alter table church_accounts enable row level security;
alter table church_sermons enable row level security;
alter table church_engagement enable row level security;

-- Allow service role full access (cron job uses service key)
create policy "service_role_church_accounts" on church_accounts
  for all using (auth.role() = 'service_role');
create policy "service_role_church_sermons" on church_sermons
  for all using (auth.role() = 'service_role');
create policy "service_role_church_engagement" on church_engagement
  for all using (auth.role() = 'service_role');
