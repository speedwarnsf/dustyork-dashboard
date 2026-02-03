import type { Project } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import { getGithubOpenGraphUrl } from "@/lib/github";

const statusStyles: Record<string, string> = {
  active: "bg-[#0f1d12] text-[#d2ff5a] border-[#20381f]",
  paused: "bg-[#1a1410] text-[#f4b26a] border-[#3f2c1f]",
  completed: "bg-[#0c1b24] text-[#7bdcff] border-[#1b3b4c]",
  archived: "bg-[#151515] text-[#8b8b8b] border-[#2a2a2a]",
};

type ProjectCardProps = {
  project: Project & { github?: GithubActivity | null };
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const fallbackImage = getGithubOpenGraphUrl(project.github_repo);
  const imageUrl = project.screenshot_url || fallbackImage;

  return (
    <a
      href={`/project/${project.id}`}
      className="group rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-5 transition hover:border-[#7bdcff]"
    >
      {imageUrl ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-[#1c1c1c] bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${project.name} screenshot`}
            className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl font-semibold">{project.name}</h3>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] ${
            statusStyles[project.status]
          }`}
        >
          {project.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-[#8b8b8b]">
        {project.description || "No description yet."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#8b8b8b]">
        {project.github?.activityLabel ? (
          <span className="rounded-full border border-[#1c1c1c] px-3 py-1">
            {project.github?.activityLabel} repo
          </span>
        ) : null}
        {project.github?.openIssues != null ? (
          <span className="rounded-full border border-[#1c1c1c] px-3 py-1">
            {project.github?.openIssues} issues
          </span>
        ) : null}
        {project.github?.ciStatus && project.github.ciStatus !== "unknown" ? (
          <span className="rounded-full border border-[#1c1c1c] px-3 py-1">
            CI {project.github?.ciStatus}
          </span>
        ) : null}
        {project.live_url ? (
          <span className="rounded-full border border-[#1c1c1c] px-3 py-1">
            Live
          </span>
        ) : null}
      </div>
    </a>
  );
}
