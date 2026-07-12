-- Church Mode tables
-- Run in Supabase SQL Editor at supabase.com

create table if not exists church_accounts (
  id uuid primary key default gen_random_uuid(),
  pastor_name text not null,
  church_name text not null,
  sender_email text not null,
  youtube_channel text,
  send_time text default '14:00',
  created_at timestamptz default now()
);

create table if not exists church_sermons (
  id uuid primary key default gen_random_uuid(),
  church_account_id uuid references church_accounts(id),
  sermon_title text,
  sermon_text text,
  puzzle_slug text,
  status text default 'pending',  -- pending | sent | failed
  created_at timestamptz default now()
);

-- Service role gets full access (API uses service key)
alter table church_accounts enable row level security;
alter table church_sermons enable row level security;

create policy "service_role_church_accounts" on church_accounts
  for all using (auth.role() = 'service_role');
create policy "service_role_church_sermons" on church_sermons
  for all using (auth.role() = 'service_role');
