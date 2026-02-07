-- DustyYork Dashboard V2 Schema Additions
-- Run these migrations after the existing schema

-- 1. Add health and launch readiness columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 50;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_updated_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS launched BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS launch_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS vercel_project_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain TEXT;

-- 2. Launch Readiness Checklist table
CREATE TABLE IF NOT EXISTS launch_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL, -- ssl, mobile, performance, seo, analytics, accessibility
  status TEXT DEFAULT 'pending', -- pending, passed, failed, warning
  score INTEGER, -- 0-100 for performance-type checks
  last_checked_at TIMESTAMPTZ,
  details JSONB, -- Store raw lighthouse/check results
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, check_type)
);

-- 3. Agent Activity tracking (enhanced)
CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT DEFAULT 'io', -- io, subagent:task, etc.
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- commit, journal, milestone, deploy, check, polish
  summary TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast activity queries
CREATE INDEX IF NOT EXISTS idx_agent_activity_created ON agent_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activity_project ON agent_activity(project_id);

-- 4. Insights cache (for precomputed insights)
CREATE TABLE IF NOT EXISTS insights_cache (
  id TEXT PRIMARY KEY, -- e.g., 'stale_projects', 'most_active', etc.
  data JSONB NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Deploy log for tracking deployments
CREATE TABLE IF NOT EXISTS deploy_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  environment TEXT DEFAULT 'production', -- production, preview
  status TEXT DEFAULT 'pending', -- pending, building, success, failed
  vercel_deployment_id TEXT,
  url TEXT,
  triggered_by TEXT DEFAULT 'manual', -- manual, io, commit
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  details JSONB
);

CREATE INDEX IF NOT EXISTS idx_deploy_log_project ON deploy_log(project_id, started_at DESC);

-- 6. Launch announcements table
CREATE TABLE IF NOT EXISTS launch_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- twitter, linkedin, producthunt
  content TEXT NOT NULL,
  posted BOOLEAN DEFAULT false,
  posted_at TIMESTAMPTZ,
  post_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for new tables
ALTER TABLE launch_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE deploy_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_announcements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated access (or service role for API)
CREATE POLICY "Allow all access to launch_checklist" ON launch_checklist FOR ALL USING (true);
CREATE POLICY "Allow all access to agent_activity" ON agent_activity FOR ALL USING (true);
CREATE POLICY "Allow all access to insights_cache" ON insights_cache FOR ALL USING (true);
CREATE POLICY "Allow all access to deploy_log" ON deploy_log FOR ALL USING (true);
CREATE POLICY "Allow all access to launch_announcements" ON launch_announcements FOR ALL USING (true);
