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

  const filtered = useMemo(() => {
    let result = [...projects];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") result = result.filter((p) => p.status === filterStatus);
    result.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "status": return a.status.localeCompare(b.status);
        case "priority": return ({ high: 0, medium: 1, low: 2 }[a.priority] || 1) - ({ high: 0, medium: 1, low: 2 }[b.priority] || 1);
        case "health": return (b.health?.score ?? 50) - (a.health?.score ?? 50);
        default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
    return result;
  }, [projects, search, sortBy, filterStatus]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
            Projects
            {filtered.length !== projects.length && (
              <span className="text-[#333] font-mono ml-2">{filtered.length}/{projects.length}</span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[#1a1a1a] text-[11px]">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 transition ${view === "grid" ? "bg-white text-black" : "text-[#555] hover:text-white"}`}
            >
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 transition ${view === "list" ? "bg-white text-black" : "text-[#555] hover:text-white"}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div id="search" className="flex flex-wrap items-center gap-2 mb-6 scroll-mt-24">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter..."
            aria-label="Search projects"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#1a1a1a] bg-[#080808] pl-9 pr-3 py-2 text-sm placeholder:text-[#333] focus:outline-none focus:border-[#333] text-[#999]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          aria-label="Filter by status"
          className="border border-[#1a1a1a] bg-[#080808] px-3 py-2 text-xs text-[#555] focus:outline-none focus:border-[#333]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          aria-label="Sort projects"
          className="border border-[#1a1a1a] bg-[#080808] px-3 py-2 text-xs text-[#555] focus:outline-none focus:border-[#333]"
        >
          <option value="updated">Recent</option>
          <option value="health">Health</option>
          <option value="name">Name</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </select>
        {(search || filterStatus !== "all" || sortBy !== "updated") && (
          <button
            onClick={() => { setSearch(""); setFilterStatus("all"); setSortBy("updated"); }}
            className="text-[11px] text-[#444] hover:text-[#777] transition"
          >
            Clear
          </button>
        )}
      </div>

      {view === "grid" ? (
        <ProjectGrid projects={filtered} />
      ) : (
        <div className="overflow-x-auto border border-[#1a1a1a] bg-[#080808]">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-left text-[10px] uppercase tracking-wider text-[#444] font-mono">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Health</th>
                <th className="px-4 py-3 font-medium">Activity</th>
                <th className="px-4 py-3 font-medium">Issues</th>
                <th className="px-4 py-3 font-medium">Links</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => {
                const healthDotColor = project.health ? getHealthDotColor(project.health) : "bg-[#333]";
                return (
                  <tr key={project.id} data-project-id={project.id} className="border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#0c0c0c] transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/project/${project.id}`} className="text-sm font-medium text-[#999] hover:text-white transition-colors">{project.name}</a>
                      {project.description && <p className="text-[11px] text-[#444] mt-0.5 truncate max-w-[200px]">{project.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-wider ${
                        project.status === "active" ? "text-[#d2ff5a]" :
                        project.status === "paused" ? "text-[#f4b26a]" :
                        project.status === "completed" ? "text-[#7bdcff]" : "text-[#444]"
                      }`}>{project.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {project.health && (
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 ${healthDotColor}`} />
                          <span className="text-xs font-mono">{project.health.score}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#555]">
                      {project.github?.activityLabel || <span className="text-[#333]">--</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#555] font-mono">{project.github?.openIssues ?? <span className="text-[#333]">--</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {project.github_repo && (
                          <a href={`https://github.com/${project.github_repo}`} target="_blank" rel="noreferrer" className="text-[#444] hover:text-[#7bdcff] transition" title="GitHub">
                            <Icon name="entities" size={14} />
                          </a>
                        )}
                        {project.live_url && (
                          <a href={project.live_url} target="_blank" rel="noreferrer" className="text-[#444] hover:text-[#d2ff5a] transition" title="Live">
                            <Icon name="cloud" size={14} />
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
