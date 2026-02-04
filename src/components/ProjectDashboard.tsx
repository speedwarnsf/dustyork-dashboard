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
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#d2ff5a] mb-2">
            All Projects
          </p>
          <h2 className="text-2xl font-semibold">Live Projects</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#1c1c1c] bg-[#0a0a0a] p-1 text-xs">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded-lg px-4 py-2 transition ${
                view === "grid" ? "bg-white text-black font-medium" : "text-[#8b8b8b] hover:text-white"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-lg px-4 py-2 transition ${
                view === "list" ? "bg-white text-black font-medium" : "text-[#8b8b8b] hover:text-white"
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
        <div className="overflow-x-auto rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a]">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1c1c1c] text-left text-xs uppercase tracking-wider text-[#666]">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Activity</th>
                <th className="px-4 py-3 font-medium">Issues</th>
                <th className="px-4 py-3 font-medium">CI</th>
                <th className="px-4 py-3 font-medium">Links</th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-[#1c1c1c] last:border-b-0 hover:bg-[#111] transition"
                >
                  <td className="px-4 py-4">
                    <a 
                      href={`/project/${project.id}`}
                      className="font-medium hover:text-[#7bdcff] transition"
                    >
                      {project.name}
                    </a>
                    {project.description && (
                      <p className="text-xs text-[#666] mt-0.5 truncate max-w-[200px]">
                        {project.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs capitalize ${
                      project.status === "active" ? "bg-green-500/10 text-green-400" :
                      project.status === "paused" ? "bg-yellow-500/10 text-yellow-400" :
                      project.status === "completed" ? "bg-blue-500/10 text-blue-400" :
                      "bg-[#1c1c1c] text-[#666]"
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#8b8b8b]">
                    {project.github?.activityLabel ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-[#8b8b8b]">
                    {project.github?.openIssues ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    {project.github?.ciStatus && project.github.ciStatus !== "unknown" && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                        project.github.ciStatus === "success" ? "bg-green-500/10 text-green-400" :
                        project.github.ciStatus === "failure" ? "bg-red-500/10 text-red-400" :
                        "bg-[#1c1c1c] text-[#666]"
                      }`}>
                        {project.github.ciStatus}
                      </span>
                    )}
                    {(!project.github?.ciStatus || project.github.ciStatus === "unknown") && (
                      <span className="text-[#555]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {project.github_repo && (
                        <a
                          href={`https://github.com/${project.github_repo}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8b8b8b] hover:text-[#7bdcff] transition"
                          title="GitHub"
                        >
                          🐙
                        </a>
                      )}
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8b8b8b] hover:text-[#d2ff5a] transition"
                          title="Live Site"
                        >
                          🌐
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
