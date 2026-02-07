"use client";
import { Icon } from "./Icon";

import type { Project, ProjectHealth } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import { getGithubOpenGraphUrl } from "@/lib/github";
import { getHealthDotColor, getHealthLabel } from "@/lib/health";
import TimeAgo from "./TimeAgo";

const statusStyles: Record<string, string> = {
  active: "bg-[#0f1d12] text-[#d2ff5a] border-[#20381f]",
  paused: "bg-[#1a1410] text-[#f4b26a] border-[#3f2c1f]",
  completed: "bg-[#0c1b24] text-[#7bdcff] border-[#1b3b4c]",
  archived: "bg-[#151515] text-[#8b8b8b] border-[#2a2a2a]",
};

const priorityDots: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-yellow-400",
  low: "bg-green-400",
};

type ProjectCardProps = {
  project: Project & { 
    github?: GithubActivity | null;
    health?: ProjectHealth;
  };
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const fallbackImage = getGithubOpenGraphUrl(project.github_repo);
  const imageUrl = project.screenshot_url || fallbackImage;
  const health = project.health;
  const healthDotColor = health ? getHealthDotColor(health) : "bg-[#555]";
  const healthLabel = health ? getHealthLabel(health) : "Unknown";

  return (
    <a
      href={`/project/${project.id}`}
      className="group rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-5 transition hover:border-[#7bdcff] flex flex-col"
    >
      {/* Screenshot */}
      {imageUrl ? (
        <div className="mb-4 overflow-hidden rounded-2xl border border-[#1c1c1c] bg-black relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${project.name} screenshot`}
            className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          {/* Health score badge */}
          {health && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-sm">
              <span className={`w-2 h-2 rounded-full ${healthDotColor}`} />
              <span className="text-xs font-medium">{health.score}</span>
            </div>
          )}
          {/* Launched badge */}
          {project.launched && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-[#d2ff5a] text-black text-xs font-medium">
              <Icon name="rocket" size={14} /> Launched
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 h-44 rounded-2xl border border-dashed border-[#1c1c1c] bg-[#0a0a0a] flex items-center justify-center relative">
          <span className="text-4xl opacity-20">📁</span>
          {health && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#111]">
              <span className={`w-2 h-2 rounded-full ${healthDotColor}`} />
              <span className="text-xs font-medium">{health.score}</span>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Priority dot */}
          <span 
            className={`w-2 h-2 rounded-full ${priorityDots[project.priority] || priorityDots.medium}`}
            title={`${project.priority} priority`}
          />
          <h3 className="text-lg font-semibold group-hover:text-[#7bdcff] transition">
            {project.name}
          </h3>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] ${
            statusStyles[project.status]
          }`}
        >
          {project.status}
        </span>
      </div>

      {/* Description */}
      <p className="mt-2 text-sm text-[#8b8b8b] line-clamp-2 flex-1">
        {project.description || "No description yet."}
      </p>

      {/* Health Alerts */}
      {health && health.alerts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {health.alerts.slice(0, 2).map((alert, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            >
              {alert}
            </span>
          ))}
        </div>
      )}

      {/* Meta info */}
      <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
        <div className="flex items-center justify-between text-xs text-[#666]">
          <TimeAgo date={project.updated_at} prefix="Updated " />
          <div className="flex items-center gap-3">
            {project.github?.openIssues != null && project.github.openIssues > 0 && (
              <span className="text-[#8b8b8b]">{project.github.openIssues} issues</span>
            )}
            {project.live_url && (
              <span className="text-[#7bdcff]">● Live</span>
            )}
            {health && (
              <span className={`${healthDotColor.replace("bg-", "text-")}`}>
                {healthLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions (shown on hover) */}
      <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {project.github_repo && (
          <button
            onClick={(e) => {
              e.preventDefault();
              window.open(`https://github.com/${project.github_repo}`, "_blank");
            }}
            className="flex-1 py-2 text-xs rounded-lg border border-[#1c1c1c] hover:border-[#7bdcff] hover:text-[#7bdcff] transition text-center"
          >
            GitHub
          </button>
        )}
        {project.live_url && (
          <button
            onClick={(e) => {
              e.preventDefault();
              window.open(project.live_url!, "_blank");
            }}
            className="flex-1 py-2 text-xs rounded-lg border border-[#1c1c1c] hover:border-[#d2ff5a] hover:text-[#d2ff5a] transition text-center"
          >
            Live Site
          </button>
        )}
      </div>
    </a>
  );
}
