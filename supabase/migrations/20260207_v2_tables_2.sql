-- Insights cache
CREATE TABLE IF NOT EXISTS insights_cache (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Launch announcements
CREATE TABLE IF NOT EXISTS launch_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  posted BOOLEAN DEFAULT false,
  posted_at TIMESTAMPTZ,
  post_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_announcements ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  CREATE POLICY "Allow all" ON insights_cache FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all" ON launch_announcements FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
