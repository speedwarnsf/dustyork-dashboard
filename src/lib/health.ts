import { differenceInDays } from "date-fns";
import type { Project, ProjectHealth, SmartInsight } from "./types";
import type { GithubActivity } from "./github";

type ProjectWithGithub = Project & { github?: GithubActivity | null };

/**
 * Calculate comprehensive project health score (0-100)
 * Factors:
 * - Commit Activity (25 points): Recent commits = healthy
 * - Deployment Status (25 points): Live + SSL = healthy
 * - Issue Health (25 points): Low open issues = healthy
 * - CI Status (25 points): Passing CI = healthy
 */
export function calculateProjectHealth(project: ProjectWithGithub): ProjectHealth {
  const alerts: string[] = [];
  let commitActivity = 0;
  let deploymentStatus = 0;
  let issueHealth = 0;
  let ciStatus = 0;

  // Skip health for archived/completed projects
  if (project.status === "archived" || project.status === "completed") {
    return {
      score: project.status === "completed" ? 100 : 50,
      factors: { commitActivity: 0, deploymentStatus: 0, issueHealth: 0, ciStatus: 0 },
      status: project.status === "completed" ? "excellent" : "fair",
      alerts: [],
    };
  }

  // 1. Commit Activity (25 points)
  if (project.github?.lastCommitDate) {
    const daysSinceCommit = differenceInDays(new Date(), new Date(project.github.lastCommitDate));
    if (daysSinceCommit <= 1) {
      commitActivity = 25;
    } else if (daysSinceCommit <= 7) {
      commitActivity = 20;
    } else if (daysSinceCommit <= 14) {
      commitActivity = 15;
    } else if (daysSinceCommit <= 30) {
      commitActivity = 10;
      alerts.push("No commits in 2+ weeks");
    } else {
      commitActivity = 5;
      alerts.push("No commits in 30+ days");
    }
  } else if (project.github_repo) {
    commitActivity = 5;
    alerts.push("Could not fetch commit data");
  } else {
    // No GitHub repo linked - neutral
    commitActivity = 15;
  }

  // 2. Deployment Status (25 points)
  if (project.live_url) {
    deploymentStatus = 20;
    // Bonus for having a live URL
    if (project.domain) {
      deploymentStatus = 25;
    }
  } else if (project.status === "active") {
    deploymentStatus = 5;
    alerts.push("No live URL configured");
  } else {
    deploymentStatus = 10;
  }

  // 3. Issue Health (25 points)
  if (project.github?.openIssues !== null && project.github?.openIssues !== undefined) {
    const issues = project.github.openIssues;
    if (issues === 0) {
      issueHealth = 25;
    } else if (issues <= 3) {
      issueHealth = 20;
    } else if (issues <= 10) {
      issueHealth = 15;
      alerts.push(`${issues} open issues`);
    } else {
      issueHealth = 10;
      alerts.push(`${issues} open issues need attention`);
    }
  } else if (project.github_repo) {
    issueHealth = 15;
  } else {
    issueHealth = 20; // No repo = no issues
  }

  // 4. CI Status (25 points)
  if (project.github?.ciStatus === "success") {
    ciStatus = 25;
  } else if (project.github?.ciStatus === "failure") {
    ciStatus = 5;
    alerts.push("CI/CD pipeline failing");
  } else {
    ciStatus = 15; // Unknown/no CI
  }

  const score = commitActivity + deploymentStatus + issueHealth + ciStatus;

  let status: ProjectHealth["status"];
  if (score >= 85) status = "excellent";
  else if (score >= 70) status = "good";
  else if (score >= 50) status = "fair";
  else if (score >= 30) status = "poor";
  else status = "critical";

  return {
    score,
    factors: { commitActivity, deploymentStatus, issueHealth, ciStatus },
    status,
    alerts,
  };
}

/**
 * Generate smart insights from project data
 */
export function generateSmartInsights(
  projects: ProjectWithGithub[],
  recentCommits: Array<{ projectName: string; date: string }> = []
): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const now = new Date();

  // 1. Find stale projects (active but no activity in 7+ days)
  const staleProjects = projects.filter((p) => {
    if (p.status !== "active") return false;
    const lastActivity = p.github?.lastCommitDate || p.updated_at;
    const daysSince = differenceInDays(now, new Date(lastActivity));
    return daysSince >= 7;
  });

  if (staleProjects.length > 0) {
    insights.push({
      id: "stale-projects",
      type: "stale",
      title: `${staleProjects.length} project${staleProjects.length > 1 ? "s" : ""} need${staleProjects.length === 1 ? "s" : ""} attention`,
      description: staleProjects.map((p) => p.name).join(", "),
      priority: staleProjects.length > 3 ? "high" : "medium",
    });
  }

  // 2. Find most active project today
  const todayCommits = recentCommits.filter((c) => {
    const commitDate = new Date(c.date);
    return differenceInDays(now, commitDate) === 0;
  });

  if (todayCommits.length > 0) {
    const projectCounts = todayCommits.reduce((acc, c) => {
      acc[c.projectName] = (acc[c.projectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActive = Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostActive && mostActive[1] > 1) {
      insights.push({
        id: "most-active-today",
        type: "active",
        title: `${mostActive[0]} is on fire today 🔥`,
        description: `${mostActive[1]} commits today — most active project`,
        priority: "low",
      });
    }
  }

  // 3. Near-completion projects
  const nearComplete = projects.filter((p) => {
    if (p.status !== "active") return false;
    // Would need milestones data for accurate completion %
    // For now, check if project has been very active
    return p.github?.activityLabel === "Hot";
  });

  if (nearComplete.length > 0) {
    nearComplete.forEach((p) => {
      insights.push({
        id: `hot-project-${p.id}`,
        type: "active",
        title: `${p.name} is hot! 🔥`,
        description: "Recent high commit activity",
        projectId: p.id,
        projectName: p.name,
        priority: "low",
      });
    });
  }

  // 4. Projects with CI failures
  const ciFailures = projects.filter(
    (p) => p.status === "active" && p.github?.ciStatus === "failure"
  );

  if (ciFailures.length > 0) {
    ciFailures.forEach((p) => {
      insights.push({
        id: `ci-failure-${p.id}`,
        type: "alert",
        title: `${p.name} CI failing`,
        description: "Build or tests are broken",
        projectId: p.id,
        projectName: p.name,
        priority: "high",
        actionLabel: "View GitHub Actions",
        actionUrl: `https://github.com/${p.github_repo}/actions`,
      });
    });
  }

  // 5. Projects with many open issues
  const manyIssues = projects.filter(
    (p) => p.status === "active" && (p.github?.openIssues || 0) > 5
  );

  if (manyIssues.length > 0) {
    manyIssues.forEach((p) => {
      insights.push({
        id: `issues-${p.id}`,
        type: "suggestion",
        title: `${p.name} has ${p.github?.openIssues} open issues`,
        description: "Consider triaging or closing stale issues",
        projectId: p.id,
        projectName: p.name,
        priority: "medium",
        actionLabel: "View Issues",
        actionUrl: `https://github.com/${p.github_repo}/issues`,
      });
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights.slice(0, 8); // Limit to 8 insights
}

/**
 * Get health status color classes
 */
export function getHealthColor(health: ProjectHealth | number): string {
  const score = typeof health === "number" ? health : health.score;
  if (score >= 85) return "text-green-400 bg-green-500/10";
  if (score >= 70) return "text-cyan-400 bg-cyan-500/10";
  if (score >= 50) return "text-yellow-400 bg-yellow-500/10";
  if (score >= 30) return "text-orange-400 bg-orange-500/10";
  return "text-red-400 bg-red-500/10";
}

export function getHealthDotColor(health: ProjectHealth | number): string {
  const score = typeof health === "number" ? health : health.score;
  if (score >= 85) return "bg-green-400";
  if (score >= 70) return "bg-cyan-400";
  if (score >= 50) return "bg-yellow-400";
  if (score >= 30) return "bg-orange-400";
  return "bg-red-400";
}

export function getHealthLabel(health: ProjectHealth | number): string {
  const score = typeof health === "number" ? health : health.score;
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Critical";
}
