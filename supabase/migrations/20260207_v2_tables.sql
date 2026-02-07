-- Add columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 50;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS launched BOOLEAN DEFAULT false;

-- Launch checklist
CREATE TABLE IF NOT EXISTS launch_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  score INTEGER,
  last_checked_at TIMESTAMPTZ,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, check_type)
);

-- Agent activity feed
CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT DEFAULT 'io',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_created ON agent_activity(created_at DESC);

-- Deploy log
CREATE TABLE IF NOT EXISTS deploy_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  url TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE launch_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE deploy_log ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  CREATE POLICY "Allow all" ON launch_checklist FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all" ON agent_activity FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all" ON deploy_log FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
