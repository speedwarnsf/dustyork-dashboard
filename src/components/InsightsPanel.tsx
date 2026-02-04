"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import type { Milestone } from "@/lib/types";

// Client-only time display to avoid hydration mismatch
function TimeAgo({ date, fallback = "..." }: { date: string | null; fallback?: string }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted || !date) {
    return <>{fallback}</>;
  }
  
  return (
    <span suppressHydrationWarning>
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  );
}

type Props = {
  totalProjects: number;
  activeProjects: number;
  totalMilestones: number;
  completedMilestones: number;
  upcomingMilestones: Array<Milestone & { projectName: string }>;
  recentCommits: Array<{
    projectName: string;
    message: string;
    date: string;
  }>;
};

export default function InsightsPanel({
  totalProjects,
  activeProjects,
  totalMilestones,
  completedMilestones,
  upcomingMilestones,
  recentCommits,
}: Props) {
  const completionRate = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Projects</p>
          <p className="text-3xl font-semibold mt-1">{totalProjects}</p>
          <p className="text-xs text-[#555] mt-1">{activeProjects} active</p>
        </div>
        
        <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Milestones</p>
          <p className="text-3xl font-semibold mt-1">{totalMilestones}</p>
          <p className="text-xs text-[#555] mt-1">{completedMilestones} completed</p>
        </div>
        
        <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Completion</p>
          <p className="text-3xl font-semibold mt-1">{completionRate}%</p>
          <div className="mt-2 h-1 bg-[#1c1c1c] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#7bdcff] transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
        
        <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">This Week</p>
          <p className="text-3xl font-semibold mt-1">{recentCommits.length}</p>
          <p className="text-xs text-[#555] mt-1">commits</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Milestones */}
        <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎯</span>
            <h3 className="text-lg font-semibold">Upcoming Milestones</h3>
          </div>
          {upcomingMilestones.length === 0 ? (
            <p className="text-sm text-[#8b8b8b]">No upcoming milestones</p>
          ) : (
            <div className="space-y-3">
              {upcomingMilestones.slice(0, 5).map((milestone) => (
                <div 
                  key={milestone.id}
                  className="p-3 rounded-xl bg-[#111] border border-[#1c1c1c]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{milestone.name}</p>
                      <p className="text-xs text-[#7bdcff]">{milestone.projectName}</p>
                    </div>
                    <span className="text-xs text-[#8b8b8b] whitespace-nowrap">
                      {milestone.target_date
                        ? <TimeAgo date={milestone.target_date} />
                        : "No date"}
                    </span>
                  </div>
                  <div className="mt-2 h-1 bg-[#1c1c1c] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#7bdcff]"
                      style={{ width: `${milestone.percent_complete}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Commits */}
        <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔨</span>
            <h3 className="text-lg font-semibold">Recent Commits</h3>
          </div>
          {recentCommits.length === 0 ? (
            <p className="text-sm text-[#8b8b8b]">No recent commits</p>
          ) : (
            <div className="space-y-3">
              {recentCommits.slice(0, 5).map((commit, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl hover:bg-[#111] transition"
                >
                  <p className="text-sm truncate">{commit.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#7bdcff]">{commit.projectName}</span>
                    <span className="text-xs text-[#555]">
                      <TimeAgo date={commit.date} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
