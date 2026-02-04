"use client";

import type { Project } from "@/lib/types";
import TimeAgo from "./TimeAgo";

type ProjectWithActivity = Project & {
  lastActivity?: string;
  daysSinceActivity?: number;
};

type Props = {
  projects: ProjectWithActivity[];
};

export default function NeedsAttention({ projects }: Props) {
  // Filter to projects with no activity in 7+ days
  const staleProjects = projects
    .filter((p) => p.status === "active" && (p.daysSinceActivity || 0) >= 7)
    .sort((a, b) => (b.daysSinceActivity || 0) - (a.daysSinceActivity || 0))
    .slice(0, 5);

  if (staleProjects.length === 0) {
    return (
      <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">✨</span>
          <h3 className="text-lg font-semibold">All Good!</h3>
        </div>
        <p className="text-sm text-[#8b8b8b]">
          All active projects have recent activity.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚠️</span>
        <h3 className="text-lg font-semibold">Needs Attention</h3>
      </div>
      <div className="space-y-3">
        {staleProjects.map((project) => (
          <a
            key={project.id}
            href={`/project/${project.id}`}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-[#111] transition group"
          >
            <div>
              <p className="font-medium text-sm group-hover:text-[#7bdcff] transition">
                {project.name}
              </p>
              <p className="text-xs text-[#666]">
                {project.lastActivity
                  ? <TimeAgo date={project.lastActivity} prefix="Last activity " />
                  : "No recent activity"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  (project.daysSinceActivity || 0) >= 30
                    ? "bg-red-500/20 text-red-400"
                    : (project.daysSinceActivity || 0) >= 14
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-orange-500/20 text-orange-400"
                }`}
              >
                {project.daysSinceActivity}d
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
