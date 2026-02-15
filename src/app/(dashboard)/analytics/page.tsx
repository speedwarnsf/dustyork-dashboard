import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchGithubActivity, fetchCommitActivitySparkline } from "@/lib/github";
import type { Project } from "@/lib/types";
import { subDays, eachDayOfInterval, startOfDay, format, getDay } from "date-fns";
import Sparkline from "@/components/Sparkline";
import ContributionHeatmap from "@/components/ContributionHeatmap";
import Link from "next/link";

export const revalidate = 120;

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  const allProjects = (projects || []) as Project[];

  // Fetch sparkline data for all projects with repos
  const projectData = await Promise.all(
    allProjects.map(async (p) => {
      if (!p.github_repo) return { ...p, sparkline: [], totalCommits: 0 };
      try {
        const sparkline = await fetchCommitActivitySparkline(p.github_repo, 30);
        return { ...p, sparkline, totalCommits: sparkline.reduce((a, b) => a + b, 0) };
      } catch {
        return { ...p, sparkline: [], totalCommits: 0 };
      }
    })
  );

  // Aggregate all commit data across projects
  const totalCommits = projectData.reduce((sum, p) => sum + p.totalCommits, 0);
  const aggregatedDaily = new Array(30).fill(0);
  for (const p of projectData) {
    for (let i = 0; i < p.sparkline.length; i++) {
      if (i < 30) aggregatedDaily[i] += p.sparkline[i];
    }
  }

  // Most active days of the week
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayTotals = new Array(7).fill(0);
  const dateRange = eachDayOfInterval({ start: subDays(now, 29), end: now });
  for (let i = 0; i < dateRange.length; i++) {
    const dayOfWeek = getDay(dateRange[i]);
    dayTotals[dayOfWeek] += aggregatedDaily[i] || 0;
  }
  const maxDayTotal = Math.max(...dayTotals, 1);

  // Build heatmap data (last 365 days, using 30-day data for now mapped to recent)
  const heatmapData: { date: string; count: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const date = subDays(now, 29 - i);
    heatmapData.push({
      date: format(date, "yyyy-MM-dd"),
      count: aggregatedDaily[i] || 0,
    });
  }

  // Top projects by commit activity
  const rankedProjects = [...projectData]
    .filter(p => p.totalCommits > 0)
    .sort((a, b) => b.totalCommits - a.totalCommits);

  // Weekly trend
  const thisWeek = aggregatedDaily.slice(-7).reduce((a, b) => a + b, 0);
  const lastWeek = aggregatedDaily.slice(-14, -7).reduce((a, b) => a + b, 0);
  const weeklyChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

  // Peak day
  const peakIdx = aggregatedDaily.indexOf(Math.max(...aggregatedDaily));
  const peakDate = subDays(now, 29 - peakIdx);
  const peakCount = aggregatedDaily[peakIdx];

  // Current streak
  let streak = 0;
  for (let i = aggregatedDaily.length - 1; i >= 0; i--) {
    if (aggregatedDaily[i] > 0) streak++;
    else break;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10 text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.5em] text-[#555] mb-2 font-mono">Portfolio</p>
          <h1 className="text-2xl sm:text-3xl font-semibold">Analytics</h1>
        </div>
        <Link
          href="/"
          className="border border-[#1a1a1a] px-4 py-2 text-xs uppercase tracking-[0.3em] text-[#666] hover:border-[#7bdcff] hover:text-[#7bdcff] transition"
        >
          Back
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a] mb-8">
        <div className="bg-[#080808] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Total Commits (30d)</p>
          <p className="text-2xl font-semibold tabular-nums text-[#7bdcff]">{totalCommits}</p>
          <p className="text-[10px] text-[#444] mt-1">across {projectData.filter(p => p.totalCommits > 0).length} projects</p>
        </div>
        <div className="bg-[#080808] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">This Week</p>
          <p className="text-2xl font-semibold tabular-nums">{thisWeek}</p>
          <p className={`text-[10px] mt-1 ${weeklyChange > 0 ? "text-green-400" : weeklyChange < 0 ? "text-red-400" : "text-[#444]"}`}>
            {weeklyChange > 0 ? "+" : ""}{weeklyChange}% vs last week
          </p>
        </div>
        <div className="bg-[#080808] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Peak Day</p>
          <p className="text-2xl font-semibold tabular-nums text-[#d2ff5a]">{peakCount}</p>
          <p className="text-[10px] text-[#444] mt-1">{format(peakDate, "MMM d")}</p>
        </div>
        <div className="bg-[#080808] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Streak</p>
          <p className="text-2xl font-semibold tabular-nums">{streak}<span className="text-sm text-[#444] font-normal ml-1">days</span></p>
          <p className="text-[10px] text-[#444] mt-1">consecutive activity</p>
        </div>
      </div>

      {/* Portfolio Sparkline */}
      <div className="border border-[#1a1a1a] bg-[#080808] p-6 mb-8">
        <h2 className="text-sm font-semibold mb-4 text-[#888]">Commit Activity -- Last 30 Days</h2>
        <Sparkline
          data={aggregatedDaily}
          width={900}
          height={80}
          color="#7bdcff"
          gradientFrom="#7bdcff"
          gradientTo="#d2ff5a"
          strokeWidth={2}
          showDots
        />
        <div className="flex justify-between mt-2 text-[10px] text-[#333] font-mono">
          <span>{format(subDays(now, 29), "MMM d")}</span>
          <span>{format(now, "MMM d")}</span>
        </div>
      </div>

      {/* Contribution Heatmap */}
      <div className="border border-[#1a1a1a] bg-[#080808] p-6 mb-8">
        <h2 className="text-sm font-semibold mb-4 text-[#888]">Contribution Heatmap</h2>
        <ContributionHeatmap data={heatmapData} />
      </div>

      {/* Most Active Days */}
      <div className="border border-[#1a1a1a] bg-[#080808] p-6 mb-8">
        <h2 className="text-sm font-semibold mb-4 text-[#888]">Most Active Days of the Week</h2>
        <div className="flex items-end gap-3 h-32">
          {dayTotals.map((total, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative" style={{ height: "100px" }}>
                <div
                  className="absolute bottom-0 w-full transition-all duration-500"
                  style={{
                    height: `${(total / maxDayTotal) * 100}%`,
                    background: total === Math.max(...dayTotals)
                      ? "linear-gradient(to top, #7bdcff, #d2ff5a)"
                      : "linear-gradient(to top, #1a1a1a, #333)",
                    minHeight: total > 0 ? "4px" : "1px",
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-[#555]">{dayNames[i]}</span>
              <span className="text-[10px] font-mono text-[#333]">{total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Project Rankings */}
      <div className="border border-[#1a1a1a] bg-[#080808] p-6">
        <h2 className="text-sm font-semibold mb-4 text-[#888]">Project Rankings -- 30 Day Activity</h2>
        <div className="space-y-3">
          {rankedProjects.map((p, idx) => (
            <Link key={p.id} href={`/project/${p.id}`} className="flex items-center gap-4 group py-2 border-b border-[#1a1a1a]/40 last:border-0">
              <span className="text-[11px] font-mono text-[#333] w-6">{String(idx + 1).padStart(2, "0")}</span>
              <span className="flex-1 text-sm group-hover:text-white transition-colors">{p.name}</span>
              <Sparkline
                data={p.sparkline}
                width={100}
                height={20}
                color={idx === 0 ? "#d2ff5a" : idx === 1 ? "#7bdcff" : "#555"}
                strokeWidth={1}
              />
              <span className="text-sm font-mono tabular-nums text-[#666] w-12 text-right">{p.totalCommits}</span>
            </Link>
          ))}
          {rankedProjects.length === 0 && (
            <p className="text-sm text-[#444]">No commit activity in the last 30 days.</p>
          )}
        </div>
      </div>
    </main>
  );
}
