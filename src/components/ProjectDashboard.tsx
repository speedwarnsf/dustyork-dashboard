"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import ProjectGrid from "@/components/ProjectGrid";

type Props = {
  projects: Array<Project & { github?: GithubActivity | null }>;
};

export default function ProjectDashboard({ projects }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) => {
        const aTime = new Date(a.updated_at).getTime();
        const bTime = new Date(b.updated_at).getTime();
        return bTime - aTime;
      }),
    [projects]
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold">Live Projects</h2>
          <p className="mt-2 text-sm text-[#8b8b8b]">
            Real-time GitHub activity, milestones, tasks, and journal tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/project/new"
            className="rounded-full bg-[#7bdcff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-[#a5ebff]"
          >
            New Project
          </a>
          <div className="flex items-center gap-2 rounded-full border border-[#1c1c1c] bg-[#0a0a0a] p-1 text-xs uppercase tracking-[0.3em]">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded-full px-3 py-2 transition ${
                view === "grid" ? "bg-white text-black" : "text-[#8b8b8b]"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-full px-3 py-2 transition ${
                view === "list" ? "bg-white text-black" : "text-[#8b8b8b]"
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <ProjectGrid projects={sortedProjects} />
      ) : (
        <div className="mt-8 overflow-x-auto rounded-3xl border border-[#1c1c1c]">
          <div className="min-w-[640px] grid grid-cols-5 gap-4 border-b border-[#1c1c1c] bg-[#0a0a0a] px-4 py-3 text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
            <span>Project</span>
            <span>Status</span>
            <span>Activity</span>
            <span>Issues</span>
            <span>CI</span>
          </div>
          {sortedProjects.map((project) => (
            <a
              key={project.id}
              href={`/project/${project.id}`}
              className="min-w-[640px] grid grid-cols-5 gap-4 border-b border-[#1c1c1c] px-4 py-4 text-sm transition hover:bg-[#0a0a0a]"
            >
              <span className="font-semibold">{project.name}</span>
              <span className="text-[#8b8b8b] capitalize">
                {project.status}
              </span>
              <span className="text-[#8b8b8b]">
                {project.github?.activityLabel ?? "—"}
              </span>
              <span className="text-[#8b8b8b]">
                {project.github?.openIssues ?? "—"}
              </span>
              <span className="text-[#8b8b8b]">
                {project.github?.ciStatus ?? "—"}
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
