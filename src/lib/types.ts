export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type ProjectPriority = "high" | "medium" | "low";
export type MilestoneStatus = "not_started" | "in_progress" | "completed";
export type TaskStatus = "todo" | "in_progress" | "done";
export type CheckType = "ssl" | "mobile" | "performance" | "seo" | "analytics" | "accessibility";
export type CheckStatus = "pending" | "passed" | "failed" | "warning";

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
  // V2 fields
  health_score?: number;
  health_updated_at?: string;
  launched?: boolean;
  launch_date?: string;
  vercel_project_id?: string;
  domain?: string;
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

// V2 Types

export type LaunchChecklistItem = {
  id: string;
  project_id: string;
  check_type: CheckType;
  status: CheckStatus;
  score: number | null;
  last_checked_at: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type AgentActivity = {
  id: string;
  agent_name: string;
  project_id: string | null;
  action_type: "commit" | "journal" | "milestone" | "deploy" | "check" | "polish";
  summary: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type DeployLog = {
  id: string;
  project_id: string;
  environment: "production" | "preview";
  status: "pending" | "building" | "success" | "failed";
  vercel_deployment_id: string | null;
  url: string | null;
  triggered_by: "manual" | "io" | "commit";
  started_at: string;
  completed_at: string | null;
  details: Record<string, unknown> | null;
};

export type LaunchAnnouncement = {
  id: string;
  project_id: string;
  platform: "twitter" | "linkedin" | "producthunt";
  content: string;
  posted: boolean;
  posted_at: string | null;
  post_url: string | null;
  created_at: string;
};

// Computed types for UI
export type ProjectHealth = {
  score: number; // 0-100
  factors: {
    commitActivity: number; // 0-30
    deploymentStatus: number; // 0-25
    issueHealth: number; // 0-20
    ciStatus: number; // 0-15
    freshnessScore: number; // 0-10
  };
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  alerts: string[];
};

export type SmartInsight = {
  id: string;
  type: "stale" | "active" | "completion" | "suggestion" | "alert";
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  priority: "high" | "medium" | "low";
  actionLabel?: string;
  actionUrl?: string;
};
