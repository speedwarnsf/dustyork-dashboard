"use client";

import type { Milestone } from "@/lib/types";
import TimeAgo from "./TimeAgo";
import { ActivityHeatmap } from "./ProjectTimeline";

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
  avgHealthScore?: number;
};

export default function InsightsPanel({
  totalProjects,
  activeProjects,
  totalMilestones,
  completedMilestones,
  upcomingMilestones,
  recentCommits,
  avgHealthScore = 50,
}: Props) {
  const completionRate = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  // Convert commits to timeline events for the heatmap
  const heatmapEvents = recentCommits.map((c, i) => ({
    id: `commit-${i}`,
    projectId: "",
    projectName: c.projectName,
    type: "commit" as const,
    message: c.message,
    timestamp: c.date,
  }));

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
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Avg Health</p>
          <p className="text-3xl font-semibold mt-1">{Math.round(avgHealthScore)}</p>
          <div className="mt-2 h-1 bg-[#1c1c1c] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                avgHealthScore >= 70 ? "bg-green-400" : 
                avgHealthScore >= 50 ? "bg-yellow-400" : "bg-red-400"
              }`}
              style={{ width: `${avgHealthScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">
            30-Day Activity
          </p>
          <p className="text-xs text-[#555]">{recentCommits.length} commits</p>
        </div>
        <ActivityHeatmap events={heatmapEvents} days={30} />
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
                      className="h-full bg-gradient-to-r from-[#7bdcff] to-[#d2ff5a]"
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
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {recentCommits.slice(0, 10).map((commit, idx) => (
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
