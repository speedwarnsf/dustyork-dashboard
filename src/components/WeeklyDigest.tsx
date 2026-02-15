"use client";

import { useMemo } from "react";
import { format, subDays, isAfter } from "date-fns";

type Activity = {
  id: string;
  type: string;
  projectName: string;
  projectId: string;
  message: string;
  timestamp: string;
};

type ProjectSummary = {
  name: string;
  id: string;
  commits: number;
  journals: number;
  updates: number;
  total: number;
  latestMessage: string;
};

type Props = {
  activities: Activity[];
  totalProjects: number;
  activeProjects: number;
};

export default function WeeklyDigest({ activities, totalProjects, activeProjects }: Props) {
  const weekAgo = useMemo(() => subDays(new Date(), 7), []);

  const weeklyActivities = useMemo(
    () => activities.filter(a => isAfter(new Date(a.timestamp), weekAgo)),
    [activities, weekAgo]
  );

  const projectSummaries = useMemo(() => {
    const map = new Map<string, ProjectSummary>();
    for (const a of weeklyActivities) {
      if (!map.has(a.projectName)) {
        map.set(a.projectName, {
          name: a.projectName,
          id: a.projectId,
          commits: 0,
          journals: 0,
          updates: 0,
          total: 0,
          latestMessage: a.message,
        });
      }
      const s = map.get(a.projectName)!;
      if (a.type === "commit") s.commits++;
      else if (a.type === "journal") s.journals++;
      else s.updates++;
      s.total++;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [weeklyActivities]);

  const totalCommits = projectSummaries.reduce((s, p) => s + p.commits, 0);
  const totalJournals = projectSummaries.reduce((s, p) => s + p.journals, 0);
  const projectsTouched = projectSummaries.length;

  return (
    <div className="border border-[#1a1a1a] bg-[#080808]">
      <div className="p-5 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
            Weekly Digest
          </h3>
          <span className="text-[10px] font-mono text-[#333]">
            {format(weekAgo, "MMM d")} - {format(new Date(), "MMM d")}
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-px bg-[#1a1a1a]">
        {[
          { label: "Events", value: weeklyActivities.length },
          { label: "Commits", value: totalCommits },
          { label: "Journal", value: totalJournals },
          { label: "Projects", value: projectsTouched },
        ].map(stat => (
          <div key={stat.label} className="bg-[#080808] p-3 text-center">
            <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#444] font-mono">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Per-project breakdown */}
      <div className="p-5">
        {projectSummaries.length === 0 ? (
          <p className="text-sm text-[#444] text-center py-4">No activity this week.</p>
        ) : (
          <div className="space-y-3">
            {projectSummaries.map(p => {
              const maxBar = projectSummaries[0]?.total || 1;
              const pct = Math.round((p.total / maxBar) * 100);
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1">
                    <a href={`/project/${p.id}`} className="text-sm text-[#999] hover:text-white transition">
                      {p.name}
                    </a>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-[#555]">
                      {p.commits > 0 && <span className="text-green-400">{p.commits}c</span>}
                      {p.journals > 0 && <span className="text-blue-400">{p.journals}j</span>}
                      {p.updates > 0 && <span className="text-cyan-400">{p.updates}u</span>}
                    </div>
                  </div>
                  <div className="h-[3px] bg-[#1a1a1a] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7bdcff] to-[#d2ff5a] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#444] mt-1 line-clamp-1">{p.latestMessage}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
