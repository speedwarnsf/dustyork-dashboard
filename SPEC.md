# D's Project Command Center v2 — Specification

## Overview
A sophisticated project management dashboard for tracking personal projects with real-time GitHub integration, progress tracking, and milestone management.

**Live URL:** dustyork.com  
**Tech Stack:** Next.js 15 + React 19 + Supabase + Tailwind CSS

---

## Core Features

### 1. Project Management
- Add/edit/archive projects via UI (no code changes needed)
- Each project has:
  - Name, description
  - GitHub repo link (optional)
  - Live URL (optional)
  - Screenshot (auto-captured from live URL, stored in Supabase Storage)
  - Status: Active / Paused / Completed / Archived
  - Priority: High / Medium / Low
  - Tags (e.g., "webapp", "game", "tool", "music")
  - Created date, last updated

### 2. Real-Time GitHub Integration
- Fetch latest commit, date, commit message
- Show open issues count
- Show activity status (Hot/Warm/Cold/Frozen based on last commit)
- GitHub Actions CI status (pass/fail)
- Use authenticated API (GitHub token in env) to avoid rate limits

### 3. Progress Tracking
- **Milestones** per project
  - Name, description, target date
  - Status: Not Started / In Progress / Completed
  - Percent complete (0-100)
  
- **Tasks** per milestone
  - Name, description
  - Status: Todo / In Progress / Done
  - Assignee (future: multi-user)

### 4. Progress Journal
- Timestamped log entries per project
- Markdown support for rich notes
- Can attach context (commit SHA, milestone completed, etc.)
- Searchable history

### 5. Screenshots
- Auto-capture via Microlink API or Puppeteer
- Stored in Supabase Storage (not fetched every load)
- Manual refresh button per project
- Fallback: GitHub OpenGraph image for repos without live sites
- NEVER show placeholder/broken images — only show real screenshots or nothing

### 6. Dashboard Views
- **Grid view** — Project cards with screenshots (default)
- **List view** — Compact table with key metrics
- **Kanban view** — Projects by status columns (future)

### 7. Authentication
- Supabase Auth (email/password)
- Single user for now (Dustin)
- Proper auth, not client-side password check

### 8. LLM Resume Integration (carry over from v1)
- Buttons to resume work with different LLMs
- Copy context prompt to clipboard
- Open LLM in new tab

---

## Database Schema (Supabase)

```sql
-- Projects table
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

-- Milestones table
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

-- Tasks table
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

-- Progress journal entries
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  content text not null,
  entry_type text default 'note',
  metadata jsonb,
  created_at timestamptz default now()
);
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GITHUB_TOKEN=
```

---

## Pages / Routes

- `/` — Dashboard (project grid)
- `/login` — Auth page
- `/project/[id]` — Project detail with milestones, tasks, journal
- `/project/new` — Add new project
- `/project/[id]/edit` — Edit project

---

## UI Design

- Dark theme (black background #000, like v1)
- Clean, minimal cards
- Real screenshots prominently displayed
- Status badges with color coding
- Mobile responsive (works on phone)
- Smooth transitions/animations

---

## Seed Data (existing projects)

1. Nudio (repo: ebaix, url: nudio.ai)
2. Championship Tennis (repo: championship-tennis, url: championship-tennis.vercel.app)
3. The Forge (repo: Cforge)
4. Earth Defender (repo: earth-defender)
5. Wellth (repo: wellth-app)
6. D York Music (repo: dyorkmusic)
7. Drum (repo: drum)
8. SF Speed Alerts (repo: sf-speed-alerts)
9. MCP Integration Hub (repo: mcp-integration-hub)
