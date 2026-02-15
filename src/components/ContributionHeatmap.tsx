"use client";

import { format, parseISO, getDay } from "date-fns";
import { useState } from "react";

type HeatmapProps = {
  data: { date: string; count: number }[];
};

export default function ContributionHeatmap({ data }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null);

  if (data.length === 0) return <p className="text-sm text-[#444]">No data available.</p>;

  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return "#0a0a0a";
    const intensity = count / maxCount;
    if (intensity > 0.75) return "#d2ff5a";
    if (intensity > 0.5) return "#7bdcff";
    if (intensity > 0.25) return "#3b6d7a";
    return "#1a2a2e";
  };

  // Group data into weeks (columns) by day of week (rows)
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
  const cellSize = 14;
  const gap = 2;

  // Organize into a grid: rows = day of week, cols = weeks
  const weeks: ({ date: string; count: number } | null)[][] = [];
  let currentWeek: ({ date: string; count: number } | null)[] = [];

  if (data.length > 0) {
    const firstDayOfWeek = getDay(parseISO(data[0].date));
    // Pad first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
  }

  for (const d of data) {
    currentWeek.push(d);
    if (getDay(parseISO(d.date)) === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <div className="relative">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1" style={{ marginTop: 0 }}>
          {dayLabels.map((label, i) => (
            <div key={i} className="text-[9px] font-mono text-[#333] flex items-center" style={{ height: cellSize + gap - 2 }}>
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-0.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {Array.from({ length: 7 }).map((_, di) => {
                const cell = week[di] || null;
                return (
                  <div
                    key={di}
                    className="transition-colors duration-150"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: cell ? getColor(cell.count) : "#050505",
                      border: hoveredCell?.date === cell?.date ? "1px solid #fff" : "1px solid transparent",
                    }}
                    onMouseEnter={() => cell && setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#111] border border-[#1a1a1a] text-[10px] font-mono text-[#888] whitespace-nowrap z-10">
          {hoveredCell.count} commit{hoveredCell.count !== 1 ? "s" : ""} on {format(parseISO(hoveredCell.date), "MMM d")}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[9px] text-[#444] font-mono">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              backgroundColor: intensity === 0 ? "#0a0a0a" :
                intensity <= 0.25 ? "#1a2a2e" :
                intensity <= 0.5 ? "#3b6d7a" :
                intensity <= 0.75 ? "#7bdcff" : "#d2ff5a",
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
