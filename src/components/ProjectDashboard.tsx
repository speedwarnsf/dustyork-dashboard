"use client";

import { useMemo, useState } from "react";
import type { Project, ProjectHealth } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import { getHealthDotColor } from "@/lib/health";
import ProjectGrid from "@/components/ProjectGrid";
import { Icon } from "./Icon";

type Props = {
  projects: Array<Project & { 
    github?: GithubActivity | null;
    health?: ProjectHealth;
  }>;
};

type SortOption = "updated" | "name" | "status" | "priority" | "health";
type FilterStatus = "all" | "active" | "paused" | "completed" | "archived";

export default function ProjectDashboard({ projects }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.tags?.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "status":
          return a.status.localeCompare(b.status);
        case "priority": {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        }
        case "health": {
          const aHealth = a.health?.score ?? 50;
          const bHealth = b.health?.score ?? 50;
          return bHealth - aHealth; // Higher health first
        }
        case "updated":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return result;
  }, [projects, search, sortBy, filterStatus]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#d2ff5a] mb-2">
            All Projects
          </p>
          <h2 className="text-2xl font-semibold">
            Live Projects
            {filteredAndSortedProjects.length !== projects.length && (
              <span className="text-sm font-normal text-[#666] ml-2">
                ({filteredAndSortedProjects.length} of {projects.length})
              </span>
            )}
          </h2>
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

      {/* Filters */}
      <div id="search" className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 scroll-mt-24">
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#1c1c1c] bg-[#0a0a0a] pl-10 pr-4 py-2 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#7bdcff]"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="rounded-lg border border-[#1c1c1c] bg-[#0a0a0a] px-3 py-2 text-sm text-[#8b8b8b] focus:outline-none focus:border-[#7bdcff]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-lg border border-[#1c1c1c] bg-[#0a0a0a] px-3 py-2 text-sm text-[#8b8b8b] focus:outline-none focus:border-[#7bdcff]"
        >
          <option value="updated">Recently Updated</option>
          <option value="health">Health Score</option>
          <option value="name">Name A-Z</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </select>

        {/* Clear filters */}
        {(search || filterStatus !== "all" || sortBy !== "updated") && (
          <button
            onClick={() => {
              setSearch("");
              setFilterStatus("all");
              setSortBy("updated");
            }}
            className="text-xs text-[#7bdcff] hover:text-white transition"
          >
            Clear filters
          </button>
        )}
      </div>

      {view === "grid" ? (
        <ProjectGrid projects={filteredAndSortedProjects} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a]">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[#1c1c1c] text-left text-xs uppercase tracking-wider text-[#666]">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Health</th>
                <th className="px-4 py-3 font-medium">Activity</th>
                <th className="px-4 py-3 font-medium">Issues</th>
                <th className="px-4 py-3 font-medium">CI</th>
                <th className="px-4 py-3 font-medium">Links</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProjects.map((project) => {
                const healthDotColor = project.health ? getHealthDotColor(project.health) : "bg-[#555]";
                return (
                  <tr
                    key={project.id}
                    data-project-id={project.id}
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
                    <td className="px-4 py-4">
                      {project.health && (
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${healthDotColor}`} />
                          <span className="text-sm font-medium">{project.health.score}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {project.github?.activityLabel && (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                          project.github.activityLabel === "Hot" ? "bg-green-500/10 text-green-400" :
                          project.github.activityLabel === "Warm" ? "bg-yellow-500/10 text-yellow-400" :
                          project.github.activityLabel === "Cold" ? "bg-blue-500/10 text-blue-400" :
                          "bg-[#1c1c1c] text-[#666]"
                        }`}>
                          {project.github.activityLabel}
                        </span>
                      )}
                      {!project.github?.activityLabel && (
                        <span className="text-[#555]">—</span>
                      )}
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
                            <Icon name="entities" size={16} />
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
                            <Icon name="cloud" size={16} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
