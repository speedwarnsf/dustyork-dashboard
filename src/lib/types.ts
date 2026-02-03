export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type ProjectPriority = "high" | "medium" | "low";
export type MilestoneStatus = "not_started" | "in_progress" | "completed";
export type TaskStatus = "todo" | "in_progress" | "done";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  github_repo: string | null;
  live_url: string | null;
  screenshot_url: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type Milestone = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  target_date: string | null;
  status: MilestoneStatus;
  percent_complete: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  milestone_id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type JournalEntry = {
  id: string;
  project_id: string;
  content: string;
  entry_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
