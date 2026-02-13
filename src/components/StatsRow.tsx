"use client";

import Sparkline from "./Sparkline";

type StatsRowProps = {
  projects: number;
  activeProjects: number;
  totalMilestones: number;
  completedMilestones: number;
  avgHealthScore: number;
  activeThisWeek: number;
  weeklyActivityCount: number;
  monthlyActivityCount: number;
  commitCount: number;
  streak: number;
  sparklineData: number[];
};

export default function StatsRow({
  projects,
  activeProjects,
  totalMilestones,
  completedMilestones,
  avgHealthScore,
  activeThisWeek,
  weeklyActivityCount,
  monthlyActivityCount,
  commitCount,
  streak,
  sparklineData,
}: StatsRowProps) {
  const milestonePercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
      {/* Projects */}
      <div className="bg-[#080808] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-2">Projects</p>
        <p className="text-2xl font-semibold tabular-nums">{projects}</p>
        <p className="text-[11px] text-[#444] mt-1">{activeProjects} active</p>
      </div>

      {/* Milestones */}
      <div className="bg-[#080808] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-2">Milestones</p>
        <p className="text-2xl font-semibold tabular-nums">{completedMilestones}<span className="text-sm text-[#444] font-normal">/{totalMilestones}</span></p>
        <div className="mt-2 h-[2px] bg-[#1a1a1a] overflow-hidden">
          <div className="h-full bg-[#d2ff5a]" style={{ width: `${milestonePercent}%`, transition: "width 1s ease" }} />
        </div>
      </div>

      {/* Health */}
      <div className="bg-[#080808] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-2">Avg Health</p>
        <p className="text-2xl font-semibold tabular-nums">
          <span className={
            avgHealthScore >= 70 ? "text-[#d2ff5a]" :
            avgHealthScore >= 50 ? "text-yellow-400" : "text-red-400"
          }>{Math.round(avgHealthScore)}</span>
        </p>
        <p className="text-[11px] text-[#444] mt-1">
          {avgHealthScore >= 70 ? "Good" : avgHealthScore >= 50 ? "Fair" : "Low"}
        </p>
      </div>

      {/* Activity + Sparkline */}
      <div className="bg-[#080808] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-2">This Week</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-semibold tabular-nums">{weeklyActivityCount}</p>
            <p className="text-[11px] text-[#444] mt-1">events</p>
          </div>
          <div className="opacity-60">
            <Sparkline
              data={sparklineData}
              width={72}
              height={24}
              color="#7bdcff"
              gradientFrom="#7bdcff"
              gradientTo="#d2ff5a"
              strokeWidth={1}
            />
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-[#080808] p-4 col-span-2 sm:col-span-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-2">Streak</p>
        <p className="text-2xl font-semibold tabular-nums">
          {streak}<span className="text-sm text-[#444] font-normal ml-1">d</span>
        </p>
        <p className="text-[11px] text-[#444] mt-1">{monthlyActivityCount} this month</p>
      </div>
    </div>
  );
}
