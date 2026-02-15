"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  format,
  differenceInDays,
  startOfDay,
  addDays,
  max,
  min,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
} from "date-fns";
import type { Project, Milestone, Release, MilestoneDependency } from "@/lib/types";
import { useRouter } from "next/navigation";

type MilestoneWithProject = Milestone & { projects: { name: string } | null };
type ProjectMin = Pick<Project, "id" | "name" | "status" | "priority">;

type Props = {
  projects: ProjectMin[];
  milestones: MilestoneWithProject[];
  releases: Release[];
  dependencies: MilestoneDependency[];
};

type ViewMode = "portfolio" | "project" | "releases";

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  completed: { bg: "bg-green-500", text: "text-green-400", border: "border-green-500/30" },
  in_progress: { bg: "bg-[#7bdcff]", text: "text-[#7bdcff]", border: "border-[#7bdcff]/30" },
  not_started: { bg: "bg-[#444]", text: "text-[#666]", border: "border-[#333]" },
};

const releaseStatusColors: Record<string, { bg: string; text: string }> = {
  planned: { bg: "bg-[#333]", text: "text-[#888]" },
  in_progress: { bg: "bg-[#7bdcff]", text: "text-[#7bdcff]" },
  released: { bg: "bg-green-500", text: "text-green-400" },
  cancelled: { bg: "bg-red-500/30", text: "text-red-400" },
};

const projectColors = [
  "#d2ff5a", "#7bdcff", "#f4b26a", "#ff6b8a", "#a78bfa",
  "#34d399", "#fbbf24", "#f87171", "#60a5fa", "#c084fc",
];

export default function RoadmapView({ projects, milestones, releases, dependencies }: Props) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("portfolio");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [editingRelease, setEditingRelease] = useState<string | null>(null);
  const [showNewRelease, setShowNewRelease] = useState(false);
  const [showNewDep, setShowNewDep] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; origDate: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const activeProjects = projects.filter(p => p.status === "active" || p.status === "paused");
  const projectColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    activeProjects.forEach((p, i) => {
      map[p.id] = projectColors[i % projectColors.length];
    });
    return map;
  }, [activeProjects]);

  // Timeline range
  const { rangeStart, totalDays, months } = useMemo(() => {
    const now = startOfDay(new Date());
    const allDates: Date[] = [now];

    milestones.forEach(m => {
      if (m.target_date) allDates.push(parseISO(m.target_date));
    });
    releases.forEach(r => {
      if (r.target_date) allDates.push(parseISO(r.target_date));
    });

    const earliest = min(allDates);
    const latest = max(allDates);
    const rangeStart = addDays(startOfMonth(earliest), -7);
    const rangeEnd = addDays(endOfMonth(latest), 30);
    const totalDays = Math.max(differenceInDays(rangeEnd, rangeStart), 60);

    const monthStarts = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
    const months = monthStarts.map(d => ({
      label: format(d, "MMM yyyy"),
      pct: (differenceInDays(d, rangeStart) / totalDays) * 100,
    }));

    return { rangeStart, totalDays, months };
  }, [milestones, releases]);

  const now = startOfDay(new Date());
  const todayPct = (differenceInDays(now, rangeStart) / totalDays) * 100;

  const dateToPct = useCallback((date: string | null) => {
    if (!date) return null;
    return (differenceInDays(parseISO(date), rangeStart) / totalDays) * 100;
  }, [rangeStart, totalDays]);

  const pctToDate = useCallback((pct: number) => {
    const days = Math.round((pct / 100) * totalDays);
    return format(addDays(rangeStart, days), "yyyy-MM-dd");
  }, [rangeStart, totalDays]);

  // API helpers
  const apiCall = async (body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Drag to reschedule
  const handleMouseDown = (e: React.MouseEvent, milestoneId: string, currentDate: string | null) => {
    e.preventDefault();
    setDragging({ id: milestoneId, startX: e.clientX, origDate: currentDate });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!timelineRef.current || !dragging) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const timelineWidth = rect.width;
      const deltaX = e.clientX - dragging.startX;
      const deltaPct = (deltaX / timelineWidth) * 100;

      const origPct = dragging.origDate ? dateToPct(dragging.origDate) : todayPct;
      if (origPct === null) return;

      const el = document.getElementById(`ms-${dragging.id}`);
      if (el) {
        const newPct = Math.max(0, Math.min(100, origPct + deltaPct));
        el.style.left = `${newPct}%`;
      }
    };

    const handleUp = async (e: MouseEvent) => {
      if (!timelineRef.current || !dragging) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const timelineWidth = rect.width;
      const deltaX = e.clientX - dragging.startX;
      const deltaPct = (deltaX / timelineWidth) * 100;

      const origPct = dragging.origDate ? dateToPct(dragging.origDate) : todayPct;
      if (origPct !== null && Math.abs(deltaX) > 5) {
        const newPct = Math.max(0, Math.min(100, origPct + deltaPct));
        const newDate = pctToDate(newPct);
        await apiCall({ action: "update_milestone_date", milestone_id: dragging.id, target_date: newDate });
      }
      setDragging(null);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, dateToPct, todayPct, pctToDate]);

  // Dependency arrows data
  const depLines = useMemo(() => {
    return dependencies.map(dep => {
      const from = milestones.find(m => m.id === dep.depends_on_id);
      const to = milestones.find(m => m.id === dep.milestone_id);
      if (!from || !to) return null;
      const fromPct = dateToPct(from.target_date);
      const toPct = dateToPct(to.target_date);
      if (fromPct === null || toPct === null) return null;
      return { ...dep, fromPct, toPct, fromName: from.name, toName: to.name };
    }).filter(Boolean);
  }, [dependencies, milestones, dateToPct]);

  // Filter milestones by view
  const filteredMilestones = useMemo(() => {
    if (viewMode === "project" && selectedProject) {
      return milestones.filter(m => m.project_id === selectedProject);
    }
    return milestones;
  }, [milestones, viewMode, selectedProject]);

  // Group by project for portfolio view
  const projectGroups = useMemo(() => {
    const groups: Record<string, MilestoneWithProject[]> = {};
    filteredMilestones.forEach(m => {
      const pid = m.project_id;
      if (!groups[pid]) groups[pid] = [];
      groups[pid].push(m);
    });
    return groups;
  }, [filteredMilestones]);

  // Group by release
  const releaseGroups = useMemo(() => {
    const groups: Record<string, MilestoneWithProject[]> = {};
    const unassigned: MilestoneWithProject[] = [];
    filteredMilestones.forEach(m => {
      if (m.release_id) {
        if (!groups[m.release_id]) groups[m.release_id] = [];
        groups[m.release_id].push(m);
      } else {
        unassigned.push(m);
      }
    });
    return { groups, unassigned };
  }, [filteredMilestones]);

  const renderMilestoneBar = (m: MilestoneWithProject, color: string, rowIndex: number) => {
    const pct = dateToPct(m.target_date);
    if (pct === null) return null;
    const colors = statusColors[m.status] || statusColors.not_started;
    const createdPct = dateToPct(m.created_at) ?? Math.max(0, pct - 5);
    const barLeft = Math.max(0, Math.min(createdPct, pct - 1));
    const barWidth = Math.max(1.5, pct - barLeft);

    return (
      <div
        key={m.id}
        className="relative h-8 group"
      >
        {/* Background bar */}
        <div
          className="absolute top-1 h-6 opacity-20"
          style={{
            left: `${barLeft}%`,
            width: `${barWidth}%`,
            backgroundColor: color,
          }}
        />
        {/* Progress fill */}
        <div
          className="absolute top-1 h-6 opacity-50"
          style={{
            left: `${barLeft}%`,
            width: `${barWidth * (m.percent_complete / 100)}%`,
            backgroundColor: color,
          }}
        />
        {/* Draggable endpoint marker */}
        <div
          id={`ms-${m.id}`}
          className="absolute top-0 h-8 w-3 cursor-ew-resize z-20 flex items-center justify-center"
          style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
          onMouseDown={(e) => handleMouseDown(e, m.id, m.target_date)}
          onClick={(e) => {
            e.stopPropagation();
            setEditingMilestone(editingMilestone === m.id ? null : m.id);
          }}
        >
          <div
            className="w-2.5 h-5 border"
            style={{ borderColor: color, backgroundColor: `${color}33` }}
          />
        </div>
        {/* Tooltip on hover */}
        <div
          className="absolute bottom-full mb-1 left-0 hidden group-hover:block z-30 pointer-events-none"
          style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
        >
          <div className="bg-[#111] border border-[#333] px-3 py-2 text-[10px] font-mono whitespace-nowrap">
            <p className="text-white font-medium">{m.name}</p>
            <p className="text-[#666]">{m.projects?.name}</p>
            <p className="text-[#666]">{m.target_date ? format(parseISO(m.target_date), "MMM d, yyyy") : "No date"}</p>
            <p style={{ color }}>{m.percent_complete}% -- {m.status.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {(["portfolio", "project", "releases"] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 text-[11px] uppercase tracking-widest border transition ${
              viewMode === mode
                ? "border-[#d2ff5a] text-[#d2ff5a]"
                : "border-[#1a1a1a] text-[#555] hover:border-[#333]"
            }`}
          >
            {mode}
          </button>
        ))}

        {viewMode === "project" && (
          <select
            value={selectedProject || ""}
            onChange={e => setSelectedProject(e.target.value || null)}
            className="bg-black border border-[#1a1a1a] px-3 py-2 text-xs text-[#888]"
          >
            <option value="">All projects</option>
            {activeProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setShowNewRelease(true)}
          className="px-4 py-2 text-[11px] uppercase tracking-widest border border-[#1a1a1a] text-[#555] hover:border-[#7bdcff] hover:text-[#7bdcff] transition"
        >
          + Release
        </button>

        {loading && (
          <span className="text-[10px] text-[#555] font-mono animate-pulse">Saving...</span>
        )}
      </div>

      {/* New Release Form */}
      {showNewRelease && (
        <NewReleaseForm
          projects={activeProjects}
          onSubmit={async (data) => {
            await apiCall({ action: "create_release", ...data });
            setShowNewRelease(false);
          }}
          onCancel={() => setShowNewRelease(false)}
        />
      )}

      {/* Timeline */}
      <div className="border border-[#1a1a1a] bg-[#080808] overflow-x-auto">
        {/* Month header */}
        <div className="relative h-8 border-b border-[#1a1a1a]/50 min-w-[800px]">
          {months.map((m, i) => (
            <span
              key={i}
              className="absolute top-2 text-[9px] font-mono text-[#444] uppercase tracking-wider"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div ref={timelineRef} className="relative min-w-[800px] pb-4">
          {/* Today line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-[#d2ff5a]/30 z-10"
            style={{ left: `${todayPct}%` }}
          >
            <span className="absolute -top-0 -translate-x-1/2 text-[8px] font-mono text-[#d2ff5a] uppercase tracking-widest bg-[#080808] px-1">
              Today
            </span>
          </div>

          {/* Dependency lines (SVG overlay) */}
          {depLines.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-5" style={{ overflow: "visible" }}>
              {depLines.map((dep, i) => {
                if (!dep) return null;
                return (
                  <line
                    key={dep.id}
                    x1={`${dep.fromPct}%`}
                    y1="50%"
                    x2={`${dep.toPct}%`}
                    y2="50%"
                    stroke="#f4b26a"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    opacity="0.4"
                  />
                );
              })}
            </svg>
          )}

          {/* Portfolio view */}
          {viewMode === "portfolio" && (
            <div className="divide-y divide-[#1a1a1a]/30">
              {activeProjects.map(project => {
                const pMilestones = projectGroups[project.id] || [];
                if (pMilestones.length === 0) return null;
                const color = projectColorMap[project.id];
                return (
                  <div key={project.id} className="py-3 px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2" style={{ backgroundColor: color }} />
                      <span className="text-xs font-medium text-[#888]">{project.name}</span>
                      <span className="text-[9px] text-[#444] font-mono">
                        {pMilestones.filter(m => m.status === "completed").length}/{pMilestones.length} done
                      </span>
                    </div>
                    <div className="relative">
                      {pMilestones.map((m, i) => renderMilestoneBar(m, color, i))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Project view */}
          {viewMode === "project" && (
            <div className="py-3 px-4 space-y-1">
              {filteredMilestones.map((m, i) => {
                const color = projectColorMap[m.project_id] || "#888";
                return (
                  <div key={m.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-[160px] shrink-0 text-[11px] text-[#777] truncate">{m.name}</span>
                      <div className="flex-1 relative">
                        {renderMilestoneBar(m, color, i)}
                      </div>
                      <span className="text-[10px] font-mono w-8 text-right" style={{ color }}>
                        {m.percent_complete}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Releases view */}
          {viewMode === "releases" && (
            <div className="divide-y divide-[#1a1a1a]/30">
              {releases.map(release => {
                const rMilestones = releaseGroups.groups[release.id] || [];
                const relPct = dateToPct(release.target_date);
                const rColors = releaseStatusColors[release.status] || releaseStatusColors.planned;
                return (
                  <div key={release.id} className="py-3 px-4 relative">
                    {/* Release target line */}
                    {relPct !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-px z-5 opacity-60"
                        style={{ left: `${relPct}%`, backgroundColor: rColors.text === "text-green-400" ? "#34d399" : rColors.text === "text-[#7bdcff]" ? "#7bdcff" : "#444" }}
                      />
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium ${rColors.text}`}>{release.name}</span>
                      <span className="text-[9px] text-[#444] font-mono">
                        {release.target_date ? format(parseISO(release.target_date), "MMM d") : "No date"}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 ${rColors.bg} ${rColors.text} font-mono uppercase`}>
                        {release.status}
                      </span>
                      <button
                        onClick={() => setEditingRelease(editingRelease === release.id ? null : release.id)}
                        className="text-[9px] text-[#444] hover:text-[#888] transition ml-1"
                      >
                        [edit]
                      </button>
                      <span className="text-[9px] text-[#444] font-mono">
                        {rMilestones.length} milestone{rMilestones.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {editingRelease === release.id && (
                      <EditReleaseForm
                        release={release}
                        milestones={milestones}
                        assignedMilestones={rMilestones}
                        onUpdate={async (data) => {
                          await apiCall({ action: "update_release", id: release.id, ...data });
                          setEditingRelease(null);
                        }}
                        onAssign={async (milestoneId) => {
                          await apiCall({ action: "assign_milestone_release", milestone_id: milestoneId, release_id: release.id });
                        }}
                        onUnassign={async (milestoneId) => {
                          await apiCall({ action: "assign_milestone_release", milestone_id: milestoneId, release_id: null });
                        }}
                        onDelete={async () => {
                          await apiCall({ action: "delete_release", id: release.id });
                          setEditingRelease(null);
                        }}
                        onClose={() => setEditingRelease(null)}
                      />
                    )}

                    {rMilestones.map((m, i) => {
                      const color = projectColorMap[m.project_id] || "#888";
                      return (
                        <div key={m.id} className="flex items-center gap-2">
                          <span className="w-[140px] shrink-0 text-[10px] text-[#666] truncate">{m.name}</span>
                          <div className="flex-1 relative">
                            {renderMilestoneBar(m, color, i)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {releaseGroups.unassigned.length > 0 && (
                <div className="py-3 px-4">
                  <p className="text-xs text-[#555] mb-2 font-mono uppercase tracking-wider">Unassigned</p>
                  {releaseGroups.unassigned.map((m, i) => {
                    const color = projectColorMap[m.project_id] || "#888";
                    return (
                      <div key={m.id} className="flex items-center gap-2">
                        <span className="w-[140px] shrink-0 text-[10px] text-[#666] truncate">{m.name}</span>
                        <div className="flex-1 relative">
                          {renderMilestoneBar(m, color, i)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Milestone editor panel */}
      {editingMilestone && (
        <MilestoneEditor
          milestone={milestones.find(m => m.id === editingMilestone)!}
          releases={releases}
          dependencies={dependencies}
          allMilestones={milestones}
          onUpdate={async (data) => {
            await apiCall({ action: "update_milestone", milestone_id: editingMilestone, ...data });
          }}
          onAddDep={async (dependsOnId) => {
            await apiCall({ action: "add_dependency", milestone_id: editingMilestone, depends_on_id: dependsOnId });
          }}
          onRemoveDep={async (depId) => {
            await apiCall({ action: "remove_dependency", id: depId });
          }}
          onClose={() => setEditingMilestone(null)}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-[10px] font-mono text-[#444]">
        <span className="uppercase tracking-wider text-[#333]">Projects:</span>
        {activeProjects.map(p => {
          const pMilestones = projectGroups[p.id] || [];
          if (pMilestones.length === 0) return null;
          return (
            <div key={p.id} className="flex items-center gap-1.5">
              <div className="w-2 h-2" style={{ backgroundColor: projectColorMap[p.id] }} />
              <span>{p.name}</span>
            </div>
          );
        })}
        <span className="text-[#333]">|</span>
        <span className="text-[#555]">Drag markers to reschedule</span>
        <span className="text-[#555]">Click markers to edit</span>
      </div>

      {/* Dependencies list */}
      {dependencies.length > 0 && (
        <div className="border border-[#1a1a1a] bg-[#080808] p-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#555] mb-3">Dependencies</h3>
          <div className="space-y-1">
            {dependencies.map(dep => {
              const from = milestones.find(m => m.id === dep.depends_on_id);
              const to = milestones.find(m => m.id === dep.milestone_id);
              if (!from || !to) return null;
              const fromDone = from.status === "completed";
              return (
                <div key={dep.id} className="flex items-center gap-2 text-[11px]">
                  <span className={fromDone ? "text-green-400 line-through" : "text-[#888]"}>
                    {from.name}
                  </span>
                  <span className="text-[#444]">--&gt;</span>
                  <span className="text-[#888]">{to.name}</span>
                  {!fromDone && (
                    <span className="text-[9px] text-orange-400 font-mono">[BLOCKED]</span>
                  )}
                  <button
                    onClick={() => apiCall({ action: "remove_dependency", id: dep.id })}
                    className="text-[9px] text-[#333] hover:text-red-400 ml-1"
                  >
                    [x]
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function NewReleaseForm({
  projects,
  onSubmit,
  onCancel,
}: {
  projects: Pick<Project, "id" | "name">[];
  onSubmit: (data: { project_id: string; name: string; description: string; target_date: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-4 space-y-3">
      <h3 className="text-xs font-mono uppercase tracking-wider text-[#555]">New Release</h3>
      <div className="grid sm:grid-cols-4 gap-3">
        <select value={projectId} onChange={e => setProjectId(e.target.value)} className="bg-black border border-[#1a1a1a] px-3 py-2 text-xs">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Release name" className="bg-black border border-[#1a1a1a] px-3 py-2 text-xs" />
        <input value={date} onChange={e => setDate(e.target.value)} type="date" className="bg-black border border-[#1a1a1a] px-3 py-2 text-xs" />
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" className="bg-black border border-[#1a1a1a] px-3 py-2 text-xs" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => name && projectId && onSubmit({ project_id: projectId, name, description: desc, target_date: date })}
          className="px-4 py-2 text-[11px] uppercase tracking-widest border border-[#1a1a1a] text-[#888] hover:border-[#d2ff5a] hover:text-[#d2ff5a] transition"
        >
          Create
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-[11px] text-[#555] hover:text-[#888]">
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditReleaseForm({
  release,
  milestones,
  assignedMilestones,
  onUpdate,
  onAssign,
  onUnassign,
  onDelete,
  onClose,
}: {
  release: Release;
  milestones: MilestoneWithProject[];
  assignedMilestones: MilestoneWithProject[];
  onUpdate: (data: Partial<Release>) => Promise<void>;
  onAssign: (milestoneId: string) => Promise<void>;
  onUnassign: (milestoneId: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(release.name);
  const [date, setDate] = useState(release.target_date || "");
  const [status, setStatus] = useState(release.status);
  const unassigned = milestones.filter(m => m.project_id === release.project_id && !m.release_id);

  return (
    <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-3 mb-2 space-y-2">
      <div className="grid sm:grid-cols-4 gap-2">
        <input value={name} onChange={e => setName(e.target.value)} className="bg-black border border-[#1a1a1a] px-2 py-1 text-xs" />
        <input value={date} onChange={e => setDate(e.target.value)} type="date" className="bg-black border border-[#1a1a1a] px-2 py-1 text-xs" />
        <select value={status} onChange={e => setStatus(e.target.value as Release["status"])} className="bg-black border border-[#1a1a1a] px-2 py-1 text-xs">
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="released">Released</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="flex gap-1">
          <button onClick={() => onUpdate({ name, target_date: date, status })} className="px-2 py-1 text-[10px] border border-[#1a1a1a] text-[#888] hover:border-[#d2ff5a] hover:text-[#d2ff5a]">Save</button>
          <button onClick={onDelete} className="px-2 py-1 text-[10px] text-[#555] hover:text-red-400">Delete</button>
          <button onClick={onClose} className="px-2 py-1 text-[10px] text-[#555] hover:text-[#888]">Close</button>
        </div>
      </div>

      {/* Assign milestones */}
      <div className="flex flex-wrap gap-1 items-center">
        <span className="text-[9px] text-[#444] font-mono uppercase">Assigned:</span>
        {assignedMilestones.map(m => (
          <span key={m.id} className="inline-flex items-center gap-1 text-[10px] bg-[#111] border border-[#1a1a1a] px-2 py-0.5 text-[#888]">
            {m.name}
            <button onClick={() => onUnassign(m.id)} className="text-[#444] hover:text-red-400">x</button>
          </span>
        ))}
        {unassigned.length > 0 && (
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) { onAssign(e.target.value); e.target.value = ""; } }}
            className="bg-black border border-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#666]"
          >
            <option value="">+ Add milestone</option>
            {unassigned.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

function MilestoneEditor({
  milestone,
  releases,
  dependencies,
  allMilestones,
  onUpdate,
  onAddDep,
  onRemoveDep,
  onClose,
}: {
  milestone: MilestoneWithProject;
  releases: Release[];
  dependencies: MilestoneDependency[];
  allMilestones: MilestoneWithProject[];
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  onAddDep: (dependsOnId: string) => Promise<void>;
  onRemoveDep: (depId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(milestone.name);
  const [date, setDate] = useState(milestone.target_date || "");
  const [status, setStatus] = useState(milestone.status);
  const [pct, setPct] = useState(milestone.percent_complete);
  const [releaseId, setReleaseId] = useState(milestone.release_id || "");

  const milestoneDeps = dependencies.filter(d => d.milestone_id === milestone.id);
  const blockedBy = milestoneDeps.map(d => {
    const m = allMilestones.find(m => m.id === d.depends_on_id);
    return { dep: d, milestone: m };
  }).filter(x => x.milestone);

  const availableDeps = allMilestones.filter(m =>
    m.id !== milestone.id &&
    !milestoneDeps.some(d => d.depends_on_id === m.id)
  );

  const projectReleases = releases.filter(r => r.project_id === milestone.project_id);

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Edit Milestone</h3>
        <button onClick={onClose} className="text-[11px] text-[#555] hover:text-white">[close]</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="bg-black border border-[#1a1a1a] px-3 py-2 text-xs" />
        <input value={date} onChange={e => setDate(e.target.value)} type="date" className="bg-black border border-[#1a1a1a] px-3 py-2 text-xs" />
        <select value={status} onChange={e => setStatus(e.target.value as Milestone["status"])} className="bg-black border border-[#1a1a1a] px-3 py-2 text-xs">
          <option value="not_started">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <input value={pct} onChange={e => setPct(Number(e.target.value))} type="number" min={0} max={100} className="bg-black border border-[#1a1a1a] px-3 py-2 text-xs" />
        <select value={releaseId} onChange={e => setReleaseId(e.target.value)} className="bg-black border border-[#1a1a1a] px-3 py-2 text-xs">
          <option value="">No release</option>
          {projectReleases.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdate({ name, target_date: date || null, status, percent_complete: pct, release_id: releaseId || null })}
          className="px-4 py-2 text-[11px] uppercase tracking-widest border border-[#1a1a1a] text-[#888] hover:border-[#d2ff5a] hover:text-[#d2ff5a] transition"
        >
          Save
        </button>
      </div>

      {/* Dependencies */}
      <div className="border-t border-[#1a1a1a] pt-3">
        <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#555] mb-2">Blocked by</h4>
        <div className="flex flex-wrap gap-1 items-center">
          {blockedBy.map(({ dep, milestone: m }) => (
            <span key={dep.id} className="inline-flex items-center gap-1 text-[10px] bg-[#111] border border-[#1a1a1a] px-2 py-0.5 text-[#888]">
              {m!.name}
              {m!.status === "completed" ? (
                <span className="text-green-400">[done]</span>
              ) : (
                <span className="text-orange-400">[blocking]</span>
              )}
              <button onClick={() => onRemoveDep(dep.id)} className="text-[#444] hover:text-red-400">x</button>
            </span>
          ))}
          {availableDeps.length > 0 && (
            <select
              defaultValue=""
              onChange={e => { if (e.target.value) { onAddDep(e.target.value); e.target.value = ""; } }}
              className="bg-black border border-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#666]"
            >
              <option value="">+ Add dependency</option>
              {availableDeps.map(m => (
                <option key={m.id} value={m.id}>
                  {m.projects?.name ? `${m.projects.name}: ` : ""}{m.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
