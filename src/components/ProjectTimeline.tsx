"use client";
import { Icon } from "./Icon";

import { useMemo, useState } from "react";
import { format, startOfDay, subDays, eachDayOfInterval, isSameDay } from "date-fns";

type TimelineEvent = {
  id: string;
  projectId: string;
  projectName: string;
  type: "commit" | "journal" | "deploy" | "milestone" | "status_change" | "io_update";
  message: string;
  timestamp: string;
};

type Props = {
  events: TimelineEvent[];
  days?: number;
};

const eventStyles: Record<string, { bg: string; border: string; icon: string }> = {
  commit: { bg: "bg-green-400", border: "border-green-400", icon: "edit" },
  journal: { bg: "bg-blue-400", border: "border-blue-400", icon: "briefs" },
  deploy: { bg: "bg-purple-400", border: "border-purple-400", icon: "upload" },
  milestone: { bg: "bg-yellow-400", border: "border-yellow-400", icon: "star" },
  status_change: { bg: "bg-orange-400", border: "border-orange-400", icon: "settings" },
  io_update: { bg: "bg-cyan-400", border: "border-cyan-400", icon: "intelligence" },
};

export default function ProjectTimeline({ events, days = 14 }: Props) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const startDate = subDays(today, days - 1);

  const dateRange = useMemo(
    () => eachDayOfInterval({ start: startDate, end: today }),
    [days]
  );

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, TimelineEvent[]> = {};
    events.forEach((event) => {
      const day = format(new Date(event.timestamp), "yyyy-MM-dd");
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(event);
    });
    return grouped;
  }, [events]);

  // Get unique projects with colors
  const projects = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.projectName))];
    const colors = [
      "bg-cyan-400",
      "bg-pink-400",
      "bg-yellow-400",
      "bg-green-400",
      "bg-purple-400",
      "bg-orange-400",
      "bg-blue-400",
      "bg-red-400",
    ];
    return unique.map((name, i) => ({
      name,
      color: colors[i % colors.length],
    }));
  }, [events]);

  // Get max events in a day for scaling
  const maxEventsPerDay = useMemo(() => {
    return Math.max(...Object.values(eventsByDay).map((e) => e.length), 1);
  }, [eventsByDay]);

  // Selected day events
  const selectedDayEvents = selectedDay
    ? eventsByDay[format(selectedDay, "yyyy-MM-dd")] || []
    : [];

  return (
    <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon name="calendar" size={20} />
          <h3 className="text-lg font-semibold">Activity Timeline</h3>
        </div>
        <span className="text-xs text-[#666]">Last {days} days</span>
      </div>

      {/* Project Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {projects.map((project) => (
          <button
            key={project.name}
            className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1.5 transition ${
              hoveredProject === project.name || hoveredProject === null
                ? "opacity-100"
                : "opacity-30"
            }`}
            onMouseEnter={() => setHoveredProject(project.name)}
            onMouseLeave={() => setHoveredProject(null)}
          >
            <span className={`w-2 h-2 rounded-full ${project.color}`} />
            <span className="text-[#8b8b8b]">{project.name}</span>
          </button>
        ))}
      </div>

      {/* Timeline Grid */}
      <div className="flex gap-1 mb-4">
        {dateRange.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const dayEvents = eventsByDay[key] || [];
          const filteredEvents = hoveredProject
            ? dayEvents.filter((e) => e.projectName === hoveredProject)
            : dayEvents;
          const intensity = Math.min(filteredEvents.length / maxEventsPerDay, 1);
          const isSelected = selectedDay && isSameDay(date, selectedDay);
          const isToday = isSameDay(date, today);

          return (
            <button
              key={key}
              className={`flex-1 aspect-square rounded-lg transition-all ${
                isSelected
                  ? "ring-2 ring-[#7bdcff] ring-offset-2 ring-offset-[#0a0a0a]"
                  : ""
              } ${isToday ? "border border-[#7bdcff]" : ""}`}
              style={{
                backgroundColor:
                  intensity > 0
                    ? `rgba(123, 220, 255, ${0.1 + intensity * 0.6})`
                    : "#1c1c1c",
              }}
              onClick={() => setSelectedDay(isSelected ? null : date)}
              title={`${format(date, "MMM d")}: ${dayEvents.length} events`}
            />
          );
        })}
      </div>

      {/* Day Labels */}
      <div className="flex justify-between text-xs text-[#555] mb-4">
        <span>{format(startDate, "MMM d")}</span>
        <span>{format(today, "MMM d")}</span>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="border-t border-[#1c1c1c] pt-4">
          <h4 className="font-medium text-sm mb-3">
            {format(selectedDay, "EEEE, MMMM d")}
            <span className="text-[#666] ml-2">
              ({selectedDayEvents.length} event
              {selectedDayEvents.length !== 1 ? "s" : ""})
            </span>
          </h4>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-[#666]">No activity on this day</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {selectedDayEvents.map((event) => {
                const style = eventStyles[event.type];
                const projectColor =
                  projects.find((p) => p.name === event.projectName)?.color ||
                  "bg-gray-400";
                return (
                  <a
                    key={event.id}
                    href={`/project/${event.projectId}`}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#111] transition"
                  >
                    <span className="text-sm"><Icon name={style.icon} size={16} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${projectColor}`}
                        />
                        <span className="text-xs text-[#7bdcff]">
                          {event.projectName}
                        </span>
                        <span className="text-xs text-[#555]">
                          {format(new Date(event.timestamp), "h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-[#8b8b8b] truncate">
                        {event.message}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {!selectedDay && (
        <div className="border-t border-[#1c1c1c] pt-4 flex gap-6">
          <div>
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-xs text-[#666]">Total Events</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{projects.length}</p>
            <p className="text-xs text-[#666]">Active Projects</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {Object.keys(eventsByDay).length}
            </p>
            <p className="text-xs text-[#666]">Active Days</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact heatmap version
export function ActivityHeatmap({ events, days = 30 }: Props) {
  const today = startOfDay(new Date());
  const startDate = subDays(today, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: today });

  const eventsByDay = useMemo(() => {
    const grouped: Record<string, number> = {};
    events.forEach((event) => {
      const day = format(new Date(event.timestamp), "yyyy-MM-dd");
      grouped[day] = (grouped[day] || 0) + 1;
    });
    return grouped;
  }, [events]);

  const maxEvents = Math.max(...Object.values(eventsByDay), 1);

  return (
    <div className="flex gap-[2px]">
      {dateRange.map((date) => {
        const key = format(date, "yyyy-MM-dd");
        const count = eventsByDay[key] || 0;
        const intensity = count / maxEvents;
        return (
          <div
            key={key}
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor:
                count > 0
                  ? `rgba(123, 220, 255, ${0.2 + intensity * 0.8})`
                  : "#1c1c1c",
            }}
            title={`${format(date, "MMM d")}: ${count} events`}
          />
        );
      })}
    </div>
  );
}
