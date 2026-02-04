import type { Project } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import { getGithubOpenGraphUrl } from "@/lib/github";
import { formatDistanceToNow, differenceInDays } from "date-fns";

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
  project: Project & { github?: GithubActivity | null };
};

function getHealthIndicator(project: Project & { github?: GithubActivity | null }) {
  const daysSinceUpdate = differenceInDays(new Date(), new Date(project.updated_at));
  
  if (project.status === "archived" || project.status === "completed") {
    return { color: "bg-[#555]", label: "Inactive" };
  }
  
  if (daysSinceUpdate > 30) {
    return { color: "bg-red-400", label: "Stale" };
  }
  
  if (daysSinceUpdate > 14) {
    return { color: "bg-yellow-400", label: "Aging" };
  }
  
  if (project.github?.ciStatus === "failure") {
    return { color: "bg-red-400", label: "CI Failing" };
  }
  
  return { color: "bg-green-400", label: "Healthy" };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const fallbackImage = getGithubOpenGraphUrl(project.github_repo);
  const imageUrl = project.screenshot_url || fallbackImage;
  const health = getHealthIndicator(project);
  const lastUpdated = formatDistanceToNow(new Date(project.updated_at), { addSuffix: true });

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
          {/* Health indicator dot */}
          <div 
            className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${health.color} ring-2 ring-black`}
            title={health.label}
          />
        </div>
      ) : (
        <div className="mb-4 h-44 rounded-2xl border border-dashed border-[#1c1c1c] bg-[#0a0a0a] flex items-center justify-center relative">
          <span className="text-4xl opacity-20">📁</span>
          <div 
            className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${health.color} ring-2 ring-[#0a0a0a]`}
            title={health.label}
          />
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

      {/* Meta info */}
      <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
        <div className="flex items-center justify-between text-xs text-[#666]">
          <span>Updated {lastUpdated}</span>
          <div className="flex items-center gap-2">
            {project.github?.openIssues != null && project.github.openIssues > 0 && (
              <span className="text-[#8b8b8b]">{project.github.openIssues} issues</span>
            )}
            {project.live_url && (
              <span className="text-[#7bdcff]">● Live</span>
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
