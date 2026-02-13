"use client";
import { Icon } from "./Icon";
import { useMemo, useState } from "react";
import { format, startOfDay, subDays, eachDayOfInterval, isSameDay } from "date-fns";

type TimelineEvent = {
  id: string;
  projectId: string;
  projectName: string;
  type: string;
  message: string;
  timestamp: string;
};

type Props = {
  events: TimelineEvent[];
  days?: number;
};

const eventIcons: Record<string, string> = {
  commit: "edit",
  journal: "briefs",
  deploy: "upload",
  milestone: "star",
  status_change: "settings",
  io_update: "intelligence",
};

export default function ProjectTimeline({ events, days = 14 }: Props) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const startDate = subDays(today, days - 1);
  const dateRange = useMemo(() => eachDayOfInterval({ start: startDate, end: today }), [startDate.getTime(), today.getTime()]);

  const eventsByDay = useMemo(() => {
    const grouped: Record<string, TimelineEvent[]> = {};
    events.forEach((e) => {
      const day = format(new Date(e.timestamp), "yyyy-MM-dd");
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(e);
    });
    return grouped;
  }, [events]);

  const projects = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.projectName))];
    const colors = ["bg-cyan-400", "bg-pink-400", "bg-yellow-400", "bg-green-400", "bg-purple-400", "bg-orange-400", "bg-blue-400", "bg-red-400"];
    return unique.map((name, i) => ({ name, color: colors[i % colors.length] }));
  }, [events]);

  const maxEventsPerDay = useMemo(() => Math.max(...Object.values(eventsByDay).map((e) => e.length), 1), [eventsByDay]);

  const selectedDayEvents = selectedDay ? eventsByDay[format(selectedDay, "yyyy-MM-dd")] || [] : [];

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">Timeline</h3>
        <span className="text-[10px] text-[#333] font-mono">{days}d</span>
      </div>

      {/* Project legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4">
        {projects.map((p) => (
          <button
            key={p.name}
            className={`text-[10px] flex items-center gap-1.5 transition-opacity ${hoveredProject && hoveredProject !== p.name ? "opacity-20" : "opacity-100"}`}
            onMouseEnter={() => setHoveredProject(p.name)}
            onMouseLeave={() => setHoveredProject(null)}
          >
            <span className={`w-1.5 h-1.5 ${p.color}`} />
            <span className="text-[#555]">{p.name}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex gap-[3px] mb-3">
        {dateRange.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const dayEvents = eventsByDay[key] || [];
          const filtered = hoveredProject ? dayEvents.filter((e) => e.projectName === hoveredProject) : dayEvents;
          const intensity = Math.min(filtered.length / maxEventsPerDay, 1);
          const isSelected = selectedDay && isSameDay(date, selectedDay);
          const isToday = isSameDay(date, today);
          return (
            <button
              key={key}
              className={`flex-1 aspect-square transition-all ${isSelected ? "ring-1 ring-[#7bdcff] ring-offset-1 ring-offset-[#080808]" : ""} ${isToday ? "border border-[#7bdcff]/40" : ""}`}
              style={{
                backgroundColor: intensity > 0 ? `rgba(123, 220, 255, ${0.08 + intensity * 0.5})` : "#111",
              }}
              onClick={() => setSelectedDay(isSelected ? null : date)}
              title={`${format(date, "MMM d")}: ${dayEvents.length} events`}
            />
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] text-[#333] font-mono mb-4">
        <span>{format(startDate, "MMM d")}</span>
        <span>{format(today, "MMM d")}</span>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="border-t border-[#1a1a1a] pt-4">
          <h4 className="text-xs font-medium mb-3 text-[#777]">
            {format(selectedDay, "EEEE, MMMM d")}
            <span className="text-[#333] ml-2">{selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""}</span>
          </h4>
          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-[#333]">No activity</p>
          ) : (
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {selectedDayEvents.map((event) => {
                const projectColor = projects.find((p) => p.name === event.projectName)?.color || "bg-[#555]";
                return (
                  <a key={event.id} href={`/project/${event.projectId}`} className="flex items-start gap-2.5 py-1.5 hover:bg-[#0c0c0c] transition-colors px-1 -mx-1">
                    <Icon name={eventIcons[event.type] || "edit"} size={12} className="text-[#444] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 ${projectColor}`} />
                        <span className="text-[11px] text-[#7bdcff]">{event.projectName}</span>
                        <span className="text-[10px] text-[#333] font-mono">{format(new Date(event.timestamp), "h:mm a")}</span>
                      </div>
                      <p className="text-[11px] text-[#555] truncate">{event.message}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!selectedDay && (
        <div className="border-t border-[#1a1a1a] pt-4 flex gap-8">
          <div>
            <p className="text-xl font-semibold tabular-nums">{events.length}</p>
            <p className="text-[10px] text-[#444] font-mono uppercase">Events</p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums">{projects.length}</p>
            <p className="text-[10px] text-[#444] font-mono uppercase">Projects</p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums">{Object.keys(eventsByDay).length}</p>
            <p className="text-[10px] text-[#444] font-mono uppercase">Active Days</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ActivityHeatmap({ events, days = 30 }: Props) {
  const today = startOfDay(new Date());
  const startDate = subDays(today, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: today });
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, number> = {};
    events.forEach((e) => { const d = format(new Date(e.timestamp), "yyyy-MM-dd"); grouped[d] = (grouped[d] || 0) + 1; });
    return grouped;
  }, [events]);
  const maxEvents = Math.max(...Object.values(eventsByDay), 1);
  return (
    <div className="flex gap-[2px]">
      {dateRange.map((date) => {
        const key = format(date, "yyyy-MM-dd");
        const count = eventsByDay[key] || 0;
        return (
          <div key={key} className="w-3 h-3" style={{ backgroundColor: count > 0 ? `rgba(123, 220, 255, ${0.15 + (count / maxEvents) * 0.85})` : "#111" }} title={`${format(date, "MMM d")}: ${count}`} />
        );
      })}
    </div>
  );
}
