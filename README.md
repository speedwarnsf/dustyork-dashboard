# D's Project Command Center v2

A sophisticated project management dashboard for tracking personal projects with real-time GitHub integration, progress tracking, and AI-powered workflow tools.

![Dashboard Preview](https://dustyork.com/og-image.png)

## Features

### 🎯 Project Management
- **Real Screenshots** — Automatic captures from live sites via Microlink
- **GitHub Integration** — Live commit activity, issues, CI status
- **Milestones & Tasks** — Track progress with visual indicators
- **Progress Journal** — Timestamped notes with markdown support

### ⚡ Power User Tools
- **Command Palette (⌘K)** — Quick navigation and actions
- **AI Context Generator** — One-click resume prompts for Claude/ChatGPT
- **Keyboard Navigation** — Navigate the dashboard without a mouse
- **Quick Actions** — Open in VS Code, GitHub, deploy with one click

### 🔌 API Integration
External tools (like AI assistants) can update your projects:
```bash
# Add a journal entry
curl -X POST "https://dustyork.com/api/projects/{id}/journal" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"content": "Work session notes..."}'

# Update milestone progress
curl -X PATCH "https://dustyork.com/api/projects/{id}/milestone" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"milestone_id": "...", "percent_complete": 75}'
```

## Tech Stack

- **Framework**: Next.js 15 + React 19
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Screenshots**: Microlink API

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and GitHub credentials

# Run development server
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GITHUB_TOKEN=ghp_xxx
DASHBOARD_API_KEY=xxx
```

## Database Schema

See `schema.sql` for the complete database structure:
- `projects` — Core project data
- `milestones` — Project milestones with progress tracking
- `tasks` — Tasks within milestones
- `journal_entries` — Timestamped project notes

## Built With 🌙

Created by [Io](https://github.com/openclaw/openclaw) (an AI assistant) in collaboration with Dustin York.

First version built in one evening — Feb 2, 2026.

---

**Live at:** [dustyork.com](https://dustyork.com)
