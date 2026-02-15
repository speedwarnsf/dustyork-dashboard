"use client";

import { useState, useMemo } from "react";
import { X, ChevronDown } from "lucide-react";
import type { Project, ProjectHealth } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import { getHealthTextColor, getHealthDotColor } from "@/lib/health";
import Sparkline from "./Sparkline";
import TimeAgo from "./TimeAgo";

type CompareProject = Project & {
  github?: GithubActivity | null;
  health?: ProjectHealth;
  healthTrend?: "up" | "down" | "stable";
  sparklineData?: number[];
  daysSinceActivity?: number;
};

type Props = {
  projects: CompareProject[];
};

export default function ProjectComparison({ projects }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedProjects = useMemo(
    () => selected.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as CompareProject[],
    [selected, projects]
  );

  const toggleProject = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full border border-[#1a1a1a] bg-[#080808] px-4 py-3 text-left text-sm text-[#555] hover:border-[#333] hover:text-[#999] transition"
      >
        Compare Projects -- select 2-3 to view side by side
      </button>
    );
  }

  const metrics = [
    {
      label: "Health Score",
      render: (p: CompareProject) => (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 ${p.health ? getHealthDotColor(p.health) : "bg-[#333]"}`} />
          <span className={`font-mono text-lg ${p.health ? getHealthTextColor(p.health) : "text-[#444]"}`}>
            {p.health?.score ?? "--"}
          </span>
          {p.healthTrend === "up" && <span className="text-green-400 text-xs">&#9650;</span>}
          {p.healthTrend === "down" && <span className="text-red-400 text-xs">&#9660;</span>}
        </div>
      ),
    },
    {
      label: "Status",
      render: (p: CompareProject) => (
        <span
          className={`text-xs uppercase tracking-wider ${
            p.status === "active" ? "text-[#d2ff5a]" :
            p.status === "paused" ? "text-[#f4b26a]" :
            p.status === "completed" ? "text-[#7bdcff]" : "text-[#444]"
          }`}
        >
          {p.status}
        </span>
      ),
    },
    {
      label: "Commit Activity",
      render: (p: CompareProject) => (
        <div>
          <span className="text-sm text-[#999]">{p.github?.activityLabel || "--"}</span>
          {p.sparklineData && p.sparklineData.some((v) => v > 0) && (
            <div className="mt-1">
              <Sparkline data={p.sparklineData} width={120} height={20} color="#7bdcff" strokeWidth={1} />
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Open Issues",
      render: (p: CompareProject) => (
        <span className="font-mono text-sm text-[#999]">{p.github?.openIssues ?? "--"}</span>
      ),
    },
    {
      label: "Days Since Activity",
      render: (p: CompareProject) => (
        <span className={`font-mono text-sm ${
          (p.daysSinceActivity ?? 99) <= 3 ? "text-[#d2ff5a]" :
          (p.daysSinceActivity ?? 99) <= 7 ? "text-[#f4b26a]" : "text-orange-400"
        }`}>
          {p.daysSinceActivity ?? "--"}d
        </span>
      ),
    },
    {
      label: "Priority",
      render: (p: CompareProject) => (
        <span className={`text-xs uppercase ${
          p.priority === "high" ? "text-red-400" :
          p.priority === "medium" ? "text-yellow-400" : "text-[#555]"
        }`}>
          {p.priority}
        </span>
      ),
    },
    {
      label: "Health Alerts",
      render: (p: CompareProject) => (
        <div className="text-[11px] text-[#666] space-y-0.5">
          {p.health?.alerts.length ? (
            p.health.alerts.slice(0, 3).map((a, i) => <div key={i}>{a}</div>)
          ) : (
            <span className="text-[#333]">None</span>
          )}
        </div>
      ),
    },
    {
      label: "Last Updated",
      render: (p: CompareProject) => (
        <span className="text-xs text-[#666]">
          <TimeAgo date={p.updated_at} />
        </span>
      ),
    },
  ];

  return (
    <div className="border border-[#1a1a1a] bg-[#080808]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
          Project Comparison
        </h3>
        <div className="flex items-center gap-2">
          {/* Project selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 border border-[#1a1a1a] px-3 py-1.5 text-[11px] text-[#555] hover:border-[#333] hover:text-white transition"
            >
              Add Project ({selected.length}/3) <ChevronDown size={10} />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-56 border border-[#1a1a1a] bg-[#080808] shadow-xl max-h-60 overflow-y-auto">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => toggleProject(p.id)}
                      disabled={!selected.includes(p.id) && selected.length >= 3}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#111] transition flex items-center justify-between ${
                        selected.includes(p.id) ? "text-white bg-[#111]" : "text-[#666]"
                      } ${!selected.includes(p.id) && selected.length >= 3 ? "opacity-30" : ""}`}
                    >
                      {p.name}
                      {selected.includes(p.id) && <X size={10} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => { setIsOpen(false); setSelected([]); }}
            className="p-1.5 text-[#444] hover:text-white transition"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Comparison table */}
      {selectedProjects.length >= 2 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#333] font-mono w-36">
                  Metric
                </th>
                {selectedProjects.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-left text-xs font-medium text-[#999]">
                    <a href={`/project/${p.id}`} className="hover:text-white transition">
                      {p.name}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label} className="border-b border-[#1a1a1a]/50 last:border-b-0">
                  <td className="px-4 py-3 text-[11px] text-[#444] font-mono">{m.label}</td>
                  {selectedProjects.map((p) => (
                    <td key={p.id} className="px-4 py-3">
                      {m.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-12 text-center text-sm text-[#333]">
          Select at least 2 projects to compare
        </div>
      )}
    </div>
  );
}
