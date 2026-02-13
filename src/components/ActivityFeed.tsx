"use client";

import { useState, useMemo } from "react";
import { Filter, GitCommit, BookOpen, Target, Settings, Zap, ChevronDown } from "lucide-react";
import TimeAgo from "./TimeAgo";

type ActivityItem = {
  id: string;
  type: "commit" | "journal" | "milestone" | "status_change" | "io_update";
  projectName: string;
  projectId: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

type Props = {
  activities: ActivityItem[];
  showProjectFilter?: boolean;
};

const activityConfig: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
  commit: { icon: GitCommit, color: "text-green-400", label: "Code" },
  journal: { icon: BookOpen, color: "text-blue-400", label: "Journal" },
  milestone: { icon: Target, color: "text-yellow-400", label: "Milestone" },
  status_change: { icon: Settings, color: "text-purple-400", label: "Status" },
  io_update: { icon: Zap, color: "text-cyan-400", label: "Update" },
};

const getTimePeriod = (timestamp: string) => {
  const diffHours = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) return "Today";
  if (diffHours < 48) return "Yesterday";
  if (diffHours < 168) return "This Week";
  return "Earlier";
};

export default function ActivityFeed({ activities, showProjectFilter = true }: Props) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(false);

  const projectNames = useMemo(() => {
    return Array.from(new Set(activities.map(a => a.projectName))).sort();
  }, [activities]);

  const filteredActivities = useMemo(() => {
    let result = activities;
    if (selectedFilter !== "all") result = result.filter(a => a.type === selectedFilter);
    if (selectedProject !== "all") result = result.filter(a => a.projectName === selectedProject);
    return result;
  }, [activities, selectedFilter, selectedProject]);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    const order = ["Today", "Yesterday", "This Week", "Earlier"];
    filteredActivities.forEach(a => {
      const period = getTimePeriod(a.timestamp);
      if (!groups[period]) groups[period] = [];
      groups[period].push(a);
    });
    const sorted: Record<string, ActivityItem[]> = {};
    order.forEach(p => { if (groups[p]) sorted[p] = groups[p]; });
    return sorted;
  }, [filteredActivities]);

  if (activities.length === 0) {
    return (
      <div className="border border-[#1a1a1a] bg-[#080808] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555] mb-4">Activity</h3>
        <p className="text-sm text-[#444]">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
          Activity
          <span className="ml-2 text-[#333] font-mono">{filteredActivities.length}</span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {showProjectFilter && projectNames.length > 1 && (
            <select
              aria-label="Filter by project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="appearance-none bg-[#0a0a0a] border border-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#777] focus:outline-none focus:border-[#333] max-w-[130px]"
            >
              <option value="all">All Projects</option>
              {projectNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          )}
          <div className="relative">
            <select
              aria-label="Filter by type"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="appearance-none bg-[#0a0a0a] border border-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#777] focus:outline-none focus:border-[#333] pr-6"
            >
              <option value="all">All Types</option>
              {Object.entries(activityConfig).map(([type, c]) => (
                <option key={type} value={type}>{c.label}</option>
              ))}
            </select>
            <Filter size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className={`space-y-1 ${isExpanded ? "" : "max-h-[480px]"} overflow-y-auto`}>
        {Object.entries(groupedActivities).map(([period, items]) => (
          <div key={period}>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#333] py-2 mt-2 first:mt-0">
              <span className="w-1.5 h-1.5 bg-[#1a1a1a]" />
              {period}
              <span className="ml-auto">{items.length}</span>
            </div>
            {items.map((activity) => {
              const config = activityConfig[activity.type];
              const ActivityIcon = config?.icon || Zap;
              return (
                <a
                  key={activity.id}
                  href={`/project/${activity.projectId}`}
                  className="flex items-start gap-3 py-2.5 px-2 -mx-2 hover:bg-[#0c0c0c] transition-colors group"
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                    <ActivityIcon size={13} className={config?.color || "text-[#555]"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs flex items-center gap-2">
                      <span className="font-medium text-[#999] group-hover:text-white transition-colors">{activity.projectName}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#111] text-[#444] font-mono">{config?.label || activity.type}</span>
                    </p>
                    <p className="text-xs text-[#555] group-hover:text-[#888] transition-colors mt-0.5 line-clamp-1">
                      {activity.type === "commit" && <code className="text-[10px] text-[#333] mr-1.5 font-mono">{activity.id.replace("commit-", "").slice(0, 7)}</code>}
                      {activity.message}
                    </p>
                    <p className="text-[10px] text-[#333] mt-1 font-mono">
                      <TimeAgo date={activity.timestamp} />
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        ))}

        {Object.values(groupedActivities).flat().length > 10 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-3 text-[11px] text-[#444] hover:text-[#777] transition-colors flex items-center justify-center gap-1.5"
          >
            <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            {isExpanded ? "Collapse" : `Show all ${Object.values(groupedActivities).flat().length}`}
          </button>
        )}
      </div>
    </div>
  );
}
