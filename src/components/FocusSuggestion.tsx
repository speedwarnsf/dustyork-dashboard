"use client";

import { ArrowRight } from "lucide-react";
import type { Project, ProjectHealth } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";

type ProjectWithMeta = Project & {
  github?: GithubActivity | null;
  health?: ProjectHealth;
  daysSinceActivity?: number;
};

type Props = {
  projects: ProjectWithMeta[];
};

function pickFocusProject(projects: ProjectWithMeta[]): { project: ProjectWithMeta; reason: string; action: string } | null {
  const active = projects.filter(p => p.status === "active");
  if (active.length === 0) return null;

  // Priority 1: CI failing on a high-priority project
  const ciFailing = active.find(p => p.github?.ciStatus === "failure" && p.priority === "high");
  if (ciFailing) {
    return {
      project: ciFailing,
      reason: "CI is failing",
      action: "Fix the build to unblock deployments",
    };
  }

  // Priority 2: High-priority project that's gone stale (7+ days)
  const staleHighPri = active
    .filter(p => p.priority === "high" && (p.daysSinceActivity || 0) >= 7)
    .sort((a, b) => (b.daysSinceActivity || 0) - (a.daysSinceActivity || 0))[0];
  if (staleHighPri) {
    return {
      project: staleHighPri,
      reason: `${staleHighPri.daysSinceActivity}d without activity`,
      action: "High priority -- pick up where you left off",
    };
  }

  // Priority 3: Any project with critical/poor health
  const unhealthy = active
    .filter(p => p.health && (p.health.status === "critical" || p.health.status === "poor"))
    .sort((a, b) => (a.health?.score || 0) - (b.health?.score || 0))[0];
  if (unhealthy) {
    return {
      project: unhealthy,
      reason: `Health score ${unhealthy.health?.score}`,
      action: unhealthy.health?.alerts[0] || "Improve project health",
    };
  }

  // Priority 4: Hot project -- ride the momentum
  const hot = active.find(p => p.github?.activityLabel === "Hot" && (p.daysSinceActivity || 0) <= 2);
  if (hot) {
    return {
      project: hot,
      reason: "On a roll",
      action: "Keep the momentum going",
    };
  }

  // Priority 5: Most recently active project (keep working on it)
  const recent = active
    .filter(p => (p.daysSinceActivity || 0) <= 3)
    .sort((a, b) => (a.daysSinceActivity || 0) - (b.daysSinceActivity || 0))[0];
  if (recent) {
    return {
      project: recent,
      reason: "Recently active",
      action: "Continue where you left off",
    };
  }

  return null;
}

export default function FocusSuggestion({ projects }: Props) {
  const suggestion = pickFocusProject(projects);
  if (!suggestion) return null;

  return (
    <a
      href={`/project/${suggestion.project.id}`}
      className="block border border-[#1a1a1a] bg-[#080808] hover:bg-[#0c0c0c] transition-colors group"
    >
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#444] font-mono mb-1">Next up</p>
          <p className="text-sm font-medium text-white group-hover:text-[#d2ff5a] transition-colors">
            {suggestion.project.name}
            <span className="text-[#555] font-normal ml-3">{suggestion.reason}</span>
          </p>
          <p className="text-xs text-[#666] mt-1">{suggestion.action}</p>
        </div>
        <ArrowRight size={16} className="text-[#333] group-hover:text-[#d2ff5a] transition-colors shrink-0" />
      </div>
    </a>
  );
}
