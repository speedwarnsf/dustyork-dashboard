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
  const staleProjects = projects
    .filter((p) => p.status === "active" && (p.daysSinceActivity || 0) >= 7)
    .sort((a, b) => (b.daysSinceActivity || 0) - (a.daysSinceActivity || 0))
    .slice(0, 5);

  if (staleProjects.length === 0) {
    return (
      <div className="border border-[#1a1a1a] bg-[#080808] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555] mb-4">Attention</h3>
        <p className="text-sm text-[#444]">All active projects have recent activity.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555] mb-4">
        Needs Attention
        <span className="ml-2 text-[#333] font-mono">{staleProjects.length}</span>
      </h3>
      <div className="space-y-1">
        {staleProjects.map((project) => (
          <a
            key={project.id}
            href={`/project/${project.id}`}
            className="flex items-center justify-between py-3 px-2 -mx-2 hover:bg-[#0c0c0c] transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-[#999] group-hover:text-white transition-colors">
                {project.name}
              </p>
              <p className="text-[11px] text-[#444] font-mono mt-0.5">
                {project.lastActivity
                  ? <TimeAgo date={project.lastActivity} prefix="Last active " />
                  : "No recent activity"}
              </p>
            </div>
            <span className={`text-[11px] font-mono px-2 py-1 ${
              (project.daysSinceActivity || 0) >= 30
                ? "text-red-400 bg-red-500/10"
                : (project.daysSinceActivity || 0) >= 14
                ? "text-yellow-400 bg-yellow-500/10"
                : "text-orange-400 bg-orange-500/10"
            }`}>
              {project.daysSinceActivity}d
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
