"use client";

import { useMemo } from "react";
import { format, differenceInDays, startOfDay, addDays, max, min } from "date-fns";
import type { Milestone } from "@/lib/types";
import { Target } from "lucide-react";

type MilestoneWithProject = Milestone & { projectName?: string };

type Props = {
  milestones: MilestoneWithProject[];
};

const statusColors: Record<string, { bar: string; text: string; border: string }> = {
  completed: { bar: "bg-green-400", text: "text-green-400", border: "border-green-400/30" },
  in_progress: { bar: "bg-[#7bdcff]", text: "text-[#7bdcff]", border: "border-[#7bdcff]/30" },
  not_started: { bar: "bg-[#333]", text: "text-[#555]", border: "border-[#333]" },
};

export default function GanttMilestones({ milestones }: Props) {
  const { timeline, rangeStart, totalDays } = useMemo(() => {
    const now = startOfDay(new Date());
    const withDates = milestones.filter(m => m.target_date);
    
    if (withDates.length === 0) {
      return { timeline: milestones, rangeStart: now, totalDays: 90 };
    }

    const dates = withDates.map(m => new Date(m.target_date!));
    const earliest = min([...dates, now]);
    const latest = max([...dates, addDays(now, 30)]);
    const rangeStart = addDays(startOfDay(earliest), -7);
    const totalDays = Math.max(differenceInDays(latest, rangeStart) + 14, 30);

    return { timeline: milestones, rangeStart, totalDays };
  }, [milestones]);

  if (milestones.length === 0) return null;

  const now = startOfDay(new Date());
  const todayOffset = Math.max(0, differenceInDays(now, rangeStart));
  const todayPct = (todayOffset / totalDays) * 100;

  // Generate month markers
  const months: { label: string; pct: number }[] = [];
  for (let d = 0; d < totalDays; d++) {
    const date = addDays(rangeStart, d);
    if (date.getDate() === 1) {
      months.push({ label: format(date, "MMM yyyy"), pct: (d / totalDays) * 100 });
    }
  }

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-5">
      <div className="flex items-center gap-2 mb-5">
        <Target size={16} className="text-[#d2ff5a]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
          Milestone Timeline
        </h3>
      </div>

      {/* Gantt chart */}
      <div className="relative overflow-x-auto">
        {/* Month labels */}
        <div className="relative h-5 mb-2 border-b border-[#1a1a1a]/50">
          {months.map((m, i) => (
            <span
              key={i}
              className="absolute text-[9px] font-mono text-[#444] uppercase tracking-wider"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Today marker */}
        <div
          className="absolute top-5 bottom-0 w-px bg-[#d2ff5a]/40 z-10"
          style={{ left: `${todayPct}%` }}
        >
          <span className="absolute -top-4 -translate-x-1/2 text-[8px] font-mono text-[#d2ff5a] uppercase tracking-widest">
            Today
          </span>
        </div>

        {/* Milestone rows */}
        <div className="space-y-2 min-w-[500px]">
          {timeline.map(milestone => {
            const colors = statusColors[milestone.status] || statusColors.not_started;
            let barLeft = 0;
            let barWidth = 5;

            if (milestone.target_date) {
              const targetDate = startOfDay(new Date(milestone.target_date));
              const dayOffset = differenceInDays(targetDate, rangeStart);
              // Bar spans from creation (or range start) to target date
              const createdOffset = Math.max(0, differenceInDays(startOfDay(new Date(milestone.created_at)), rangeStart));
              barLeft = (createdOffset / totalDays) * 100;
              barWidth = Math.max(2, ((dayOffset - createdOffset) / totalDays) * 100);
            }

            return (
              <div key={milestone.id} className="flex items-center gap-3 group hover:bg-[#0c0c0c] py-1.5 px-1 -mx-1 transition">
                {/* Label */}
                <div className="w-[180px] shrink-0">
                  <p className="text-xs text-[#999] truncate">{milestone.name}</p>
                  {milestone.projectName && (
                    <p className="text-[9px] text-[#444] font-mono truncate">{milestone.projectName}</p>
                  )}
                </div>
                
                {/* Bar area */}
                <div className="flex-1 relative h-6 bg-[#0a0a0a] border border-[#1a1a1a]/30">
                  {/* Progress bar */}
                  <div
                    className={`absolute top-0 bottom-0 ${colors.bar} opacity-30 transition-all`}
                    style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                  />
                  {/* Filled portion */}
                  <div
                    className={`absolute top-0 bottom-0 ${colors.bar} opacity-70 transition-all`}
                    style={{ left: `${barLeft}%`, width: `${barWidth * (milestone.percent_complete / 100)}%` }}
                  />
                  {/* Target date marker */}
                  {milestone.target_date && (
                    <div
                      className={`absolute top-0 bottom-0 w-px ${colors.bar}`}
                      style={{ left: `${barLeft + barWidth}%` }}
                    />
                  )}
                </div>

                {/* Percentage */}
                <span className={`text-[10px] font-mono w-8 text-right ${colors.text}`}>
                  {milestone.percent_complete}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1a1a1a]/30">
        {Object.entries(statusColors).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 ${colors.bar}`} />
            <span className="text-[9px] uppercase tracking-wider text-[#444] font-mono">
              {status.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
