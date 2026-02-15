"use client";

import { useState, useMemo } from "react";
import { format, startOfDay, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { GitCommit, BookOpen, Target, Zap, ChevronDown, Filter, Settings } from "lucide-react";
import TimeAgo from "./TimeAgo";

type TimelineEntry = {
  id: string;
  projectId: string;
  projectName: string;
  type: "commit" | "journal" | "milestone" | "io_update" | "status_change";
  message: string;
  timestamp: string;
};

type Props = {
  entries: TimelineEntry[];
  projectNames: string[];
};

const typeConfig: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
  commit: { icon: GitCommit, color: "text-green-400", bg: "bg-green-400/10", label: "Commit" },
  journal: { icon: BookOpen, color: "text-blue-400", bg: "bg-blue-400/10", label: "Journal" },
  milestone: { icon: Target, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Milestone" },
  io_update: { icon: Zap, color: "text-cyan-400", bg: "bg-cyan-400/10", label: "Update" },
  status_change: { icon: Settings, color: "text-purple-400", bg: "bg-purple-400/10", label: "Status" },
};

function groupByDate(entries: TimelineEntry[]) {
  const groups: { label: string; date: string; entries: TimelineEntry[] }[] = [];
  const map = new Map<string, TimelineEntry[]>();

  for (const entry of entries) {
    const day = startOfDay(new Date(entry.timestamp)).toISOString();
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(entry);
  }

  for (const [day, dayEntries] of map) {
    const d = new Date(day);
    let label: string;
    if (isToday(d)) label = "Today";
    else if (isYesterday(d)) label = "Yesterday";
    else label = format(d, "EEEE, MMM d");
    groups.push({ label, date: day, entries: dayEntries });
  }

  return groups;
}

export default function UnifiedTimeline({ entries, projectNames }: Props) {
  const [filterProject, setFilterProject] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [limit, setLimit] = useState(50);

  const filtered = useMemo(() => {
    let result = entries;
    if (filterProject !== "all") result = result.filter(e => e.projectName === filterProject);
    if (filterType !== "all") result = result.filter(e => e.type === filterType);
    return result.slice(0, limit);
  }, [entries, filterProject, filterType, limit]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="border border-[#1a1a1a] bg-[#080808]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-[#1a1a1a]">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
          Changelog
          <span className="ml-2 text-[#333] font-mono">{filtered.length}</span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {projectNames.length > 1 && (
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              aria-label="Filter by project"
              className="bg-[#0a0a0a] border border-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#777] focus:outline-none focus:border-[#333]"
            >
              <option value="all">All Projects</option>
              {projectNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            aria-label="Filter by type"
            className="bg-[#0a0a0a] border border-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#777] focus:outline-none focus:border-[#333]"
          >
            <option value="all">All Types</option>
            {Object.entries(typeConfig).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {(filterProject !== "all" || filterType !== "all") && (
            <button
              onClick={() => { setFilterProject("all"); setFilterType("all"); }}
              className="text-[11px] text-[#444] hover:text-[#777] transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-5">
        {groups.length === 0 ? (
          <p className="text-sm text-[#444] text-center py-8">No activity to show.</p>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.date}>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#444] mb-3 pb-2 border-b border-[#1a1a1a]/50">
                  <span className="w-1.5 h-1.5 bg-[#333]" />
                  {group.label}
                  <span className="ml-auto text-[#333]">{group.entries.length}</span>
                </div>
                <div className="space-y-2 pl-2">
                  {group.entries.map(entry => {
                    const cfg = typeConfig[entry.type] || typeConfig.io_update;
                    const Icon = cfg.icon;
                    return (
                      <div key={entry.id} className="flex gap-3 group">
                        <div className={`w-5 h-5 ${cfg.bg} border border-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon size={10} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <a href={`/project/${entry.projectId}`} className="text-xs font-medium text-[#888] hover:text-white transition">
                              {entry.projectName}
                            </a>
                            <span className={`text-[9px] px-1.5 py-0.5 ${cfg.bg} ${cfg.color} font-mono uppercase tracking-wider`}>
                              {cfg.label}
                            </span>
                            <span className="text-[10px] text-[#333] font-mono ml-auto shrink-0">
                              <TimeAgo date={entry.timestamp} />
                            </span>
                          </div>
                          <p className="text-[11px] text-[#555] mt-0.5 line-clamp-2">{entry.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length >= limit && entries.length > limit && (
          <div className="text-center pt-4 mt-4 border-t border-[#1a1a1a]/30">
            <button
              onClick={() => setLimit(l => l + 50)}
              className="inline-flex items-center gap-2 text-[11px] text-[#444] hover:text-[#777] transition px-4 py-2"
            >
              <ChevronDown size={12} />
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
