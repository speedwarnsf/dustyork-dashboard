import { differenceInDays } from "date-fns";
import type { Project, Milestone } from "./types";

export type AlertLevel = "info" | "warning" | "critical";
export type AlertCategory =
  | "health_degraded"
  | "deploy_failed"
  | "milestone_overdue"
  | "project_inactive"
  | "webhook";

export type Alert = {
  id: string;
  level: AlertLevel;
  category: AlertCategory | string;
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  action_required: string | null;
  status: "unread" | "read" | "resolved";
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
};

type ProjectWithHealth = Project & {
  health?: { score: number; status: string; alerts: string[] } | null;
  deployStatus?: { status: string; timestamp: string | null } | null;
};

export type GeneratedAlert = {
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  action_required: string | null;
  fingerprint: string; // dedup key
};

/**
 * Scan projects and milestones for alert conditions.
 * Returns alerts that should be created (caller deduplicates against existing).
 */
export function generateAlerts(
  projects: ProjectWithHealth[],
  milestones: Array<Milestone & { projects?: { name: string } | null }>,
  journalEntries: Array<{ project_id: string; created_at: string }> = []
): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = [];
  const now = new Date();

  // Build a map of latest journal entry per project
  const latestJournal: Record<string, string> = {};
  for (const entry of journalEntries) {
    if (
      !latestJournal[entry.project_id] ||
      new Date(entry.created_at) > new Date(latestJournal[entry.project_id])
    ) {
      latestJournal[entry.project_id] = entry.created_at;
    }
  }

  for (const project of projects) {
    if (project.status !== "active") continue;

    // 1. Degrading health scores
    if (project.health) {
      const prev = project.health_score ?? null;
      const curr = project.health.score;
      if (prev !== null && curr < prev - 10) {
        alerts.push({
          level: curr < 40 ? "critical" : "warning",
          category: "health_degraded",
          title: `${project.name} health dropped`,
          message: `Health score fell from ${prev} to ${curr}. ${project.health.alerts.join(". ")}`,
          related_id: project.id,
          related_type: "project",
          action_required: "Review project health factors and address issues",
          fingerprint: `health_degraded:${project.id}`,
        });
      }
      // Also flag critically unhealthy projects even without a previous score
      if (curr <= 30 && prev === null) {
        alerts.push({
          level: "critical",
          category: "health_degraded",
          title: `${project.name} health is critical`,
          message: `Health score is ${curr}. ${project.health.alerts.join(". ")}`,
          related_id: project.id,
          related_type: "project",
          action_required: "Immediate attention needed",
          fingerprint: `health_critical:${project.id}`,
        });
      }
    }

    // 2. Failed deploys
    if (project.deployStatus?.status === "failed") {
      alerts.push({
        level: "critical",
        category: "deploy_failed",
        title: `${project.name} deploy failed`,
        message: `Most recent deployment failed${project.deployStatus.timestamp ? ` at ${project.deployStatus.timestamp}` : ""}`,
        related_id: project.id,
        related_type: "project",
        action_required: "Check deploy logs and fix the build",
        fingerprint: `deploy_failed:${project.id}`,
      });
    }

    // 3. No activity in 7+ days
    const lastActivity =
      latestJournal[project.id] || project.updated_at;
    const daysSince = differenceInDays(now, new Date(lastActivity));
    if (daysSince >= 14) {
      alerts.push({
        level: "warning",
        category: "project_inactive",
        title: `${project.name} inactive for ${daysSince} days`,
        message: `No journal entries or updates in ${daysSince} days`,
        related_id: project.id,
        related_type: "project",
        action_required: "Consider updating status or adding a journal entry",
        fingerprint: `inactive:${project.id}`,
      });
    } else if (daysSince >= 7) {
      alerts.push({
        level: "info",
        category: "project_inactive",
        title: `${project.name} quiet for ${daysSince} days`,
        message: `No activity in the last week`,
        related_id: project.id,
        related_type: "project",
        action_required: null,
        fingerprint: `inactive:${project.id}`,
      });
    }
  }

  // 4. Milestones past deadline
  for (const milestone of milestones) {
    if (milestone.status === "completed" || !milestone.target_date) continue;
    const daysOverdue = differenceInDays(now, new Date(milestone.target_date));
    if (daysOverdue > 0) {
      const projectName =
        milestone.projects?.name || "Unknown project";
      alerts.push({
        level: daysOverdue > 14 ? "critical" : "warning",
        category: "milestone_overdue",
        title: `"${milestone.name}" is ${daysOverdue}d overdue`,
        message: `Milestone for ${projectName} was due ${milestone.target_date} (${milestone.percent_complete}% complete)`,
        related_id: milestone.id,
        related_type: "milestone",
        action_required:
          daysOverdue > 14
            ? "Reassess deadline or escalate"
            : "Update progress or adjust deadline",
        fingerprint: `milestone_overdue:${milestone.id}`,
      });
    }
  }

  return alerts;
}

export function alertLevelColor(level: AlertLevel): string {
  switch (level) {
    case "critical":
      return "text-red-400 border-red-500/30 bg-red-500/5";
    case "warning":
      return "text-orange-400 border-orange-500/30 bg-orange-500/5";
    case "info":
      return "text-cyan-400 border-cyan-500/30 bg-cyan-500/5";
  }
}

export function alertLevelDot(level: AlertLevel): string {
  switch (level) {
    case "critical":
      return "bg-red-400";
    case "warning":
      return "bg-orange-400";
    case "info":
      return "bg-cyan-400";
  }
}
