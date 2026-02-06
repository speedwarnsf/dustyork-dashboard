create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  github_repo text,
  live_url text,
  screenshot_url text,
  status text default 'active',
  priority text default 'medium',
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  description text,
  target_date date,
  status text default 'not_started',
  percent_complete int default 0,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid references milestones(id) on delete cascade,
  name text not null,
  description text,
  status text default 'todo',
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  content text not null,
  entry_type text default 'note',
  metadata jsonb,
  created_at timestamptz default now()
);

-- Site visits counter (for dyorkmusic.com)
CREATE TABLE IF NOT EXISTS site_visits (
  site TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anonymous access for the music site
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON site_visits FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON site_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON site_visits FOR UPDATE USING (true);
