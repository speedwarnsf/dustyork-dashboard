"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { GitCommit, BookOpen, Target, Settings, Zap, Filter, ChevronDown, Calendar, User } from "lucide-react";
import TimeAgo from "./TimeAgo";

type TimelineEvent = {
  id: string;
  projectId: string;
  projectName: string;
  type: "commit" | "journal" | "milestone" | "status_change" | "io_update";
  message: string;
  timestamp: string;
  author?: string;
  metadata?: Record<string, unknown>;
};

type Props = {
  events: TimelineEvent[];
  days?: number;
  showProjectFilter?: boolean;
  compactMode?: boolean;
};

const eventConfig: Record<string, { 
  icon: React.ComponentType<any>; 
  color: string; 
  bg: string;
  label: string; 
}> = {
  commit: { 
    icon: GitCommit, 
    color: "text-green-400", 
    bg: "bg-green-400/10",
    label: "Code" 
  },
  journal: { 
    icon: BookOpen, 
    color: "text-blue-400", 
    bg: "bg-blue-400/10",
    label: "Journal" 
  },
  milestone: { 
    icon: Target, 
    color: "text-yellow-400", 
    bg: "bg-yellow-400/10",
    label: "Milestone" 
  },
  status_change: { 
    icon: Settings, 
    color: "text-purple-400", 
    bg: "bg-purple-400/10",
    label: "Status" 
  },
  io_update: { 
    icon: Zap, 
    color: "text-cyan-400", 
    bg: "bg-cyan-400/10",
    label: "Update" 
  },
};

const getTimeGroup = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 1) return "Last hour";
  if (diffHours < 6) return "Last 6 hours";
  if (diffHours < 24) return "Today";
  if (diffHours < 48) return "Yesterday";
  if (diffHours < 168) return "This week";
  if (diffHours < 720) return "This month";
  return "Earlier";
};

export default function ActivityTimeline({ 
  events, 
  days = 14, 
  showProjectFilter = true, 
  compactMode = false 
}: Props) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);

  const projectNames = useMemo(() => {
    return Array.from(new Set(events.map(e => e.projectName))).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (selectedType !== "all") result = result.filter(e => e.type === selectedType);
    if (selectedProject !== "all") result = result.filter(e => e.projectName === selectedProject);
    return result;
  }, [events, selectedType, selectedProject]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    const groupOrder = ["Last hour", "Last 6 hours", "Today", "Yesterday", "This week", "This month", "Earlier"];
    
    filteredEvents.forEach(event => {
      const group = getTimeGroup(event.timestamp);
      if (!groups[group]) groups[group] = [];
      groups[group].push(event);
    });

    // Sort events within each group by timestamp (newest first)
    Object.values(groups).forEach(groupEvents => {
      groupEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    // Return ordered groups
    const orderedGroups: Record<string, TimelineEvent[]> = {};
    groupOrder.forEach(groupName => {
      if (groups[groupName]) {
        orderedGroups[groupName] = groups[groupName];
      }
    });

    return orderedGroups;
  }, [filteredEvents]);

  const displayLimit = isExpanded ? filteredEvents.length : 20;
  const displayEvents = filteredEvents.slice(0, displayLimit);

  if (events.length === 0) {
    return (
      <div className="border border-[#1a1a1a] bg-[#080808] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555] mb-4">
          Activity Timeline
        </h3>
        <p className="text-sm text-[#444]">No recent activity to display.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
          Activity Timeline
          <span className="ml-2 text-[#333] font-mono">{filteredEvents.length}</span>
        </h3>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex border border-[#1a1a1a] text-[11px]">
            <button
              onClick={() => setShowCalendarView(false)}
              className={`px-2.5 py-1.5 transition flex items-center gap-1.5 ${
                !showCalendarView ? "bg-white text-black" : "text-[#555] hover:text-white"
              }`}
            >
              <Filter size={10} />
              List
            </button>
            <button
              onClick={() => setShowCalendarView(true)}
              className={`px-2.5 py-1.5 transition flex items-center gap-1.5 ${
                showCalendarView ? "bg-white text-black" : "text-[#555] hover:text-white"
              }`}
            >
              <Calendar size={10} />
              Calendar
            </button>
          </div>
          
          {/* Filters */}
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
          
          <select
            aria-label="Filter by type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="appearance-none bg-[#0a0a0a] border border-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#777] focus:outline-none focus:border-[#333]"
          >
            <option value="all">All Types</option>
            {Object.entries(eventConfig).map(([type, config]) => (
              <option key={type} value={type}>{config.label}</option>
            ))}
          </select>
          
          {(selectedType !== "all" || selectedProject !== "all") && (
            <button
              onClick={() => { setSelectedType("all"); setSelectedProject("all"); }}
              className="text-[11px] text-[#444] hover:text-[#777] transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {showCalendarView ? (
        /* Calendar View - simplified for now */
        <div className="text-center text-[#444] py-8">
          <Calendar size={24} className="mx-auto mb-3 text-[#333]" />
          <p className="text-sm">Calendar view coming soon</p>
          <p className="text-xs mt-1">Switch to List view to see activities</p>
        </div>
      ) : (
        /* Timeline View */
        <div className="space-y-1">
          {Object.entries(groupedEvents).map(([period, periodEvents]) => (
            <div key={period} className="mb-6 last:mb-0">
              {/* Period header */}
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#333] py-2 mb-3 border-b border-[#1a1a1a]/30">
                <span className="w-1.5 h-1.5 bg-[#1a1a1a]" />
                {period}
                <span className="ml-auto">{periodEvents.length} event{periodEvents.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Events in this period */}
              <div className="space-y-3">
                {periodEvents.slice(0, isExpanded ? periodEvents.length : 10).map((event) => {
                  const config = eventConfig[event.type];
                  const EventIcon = config?.icon || Zap;
                  
                  return (
                    <div
                      key={event.id}
                      className="group relative flex gap-4 pl-4 pb-3 last:pb-0"
                    >
                      {/* Timeline line */}
                      <div className="absolute left-6 top-8 bottom-0 w-px bg-[#1a1a1a] group-last:hidden" />
                      
                      {/* Event icon */}
                      <div className={`relative z-10 w-6 h-6 ${config?.bg || "bg-[#0a0a0a]"} border border-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5`}>
                        <EventIcon size={12} className={config?.color || "text-[#555]"} />
                      </div>

                      {/* Event content */}
                      <div className="flex-1 min-w-0 -mt-0.5">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <a 
                              href={`/project/${event.projectId}`}
                              className="text-sm font-medium text-[#999] hover:text-white transition-colors"
                            >
                              {event.projectName}
                            </a>
                            <span className={`text-[9px] px-1.5 py-0.5 ${config?.bg || "bg-[#111]"} ${config?.color || "text-[#444]"} font-mono uppercase tracking-wider`}>
                              {config?.label || event.type}
                            </span>
                          </div>
                          <time className="text-[10px] text-[#333] font-mono shrink-0">
                            <TimeAgo date={event.timestamp} />
                          </time>
                        </div>
                        
                        <p className="text-xs text-[#666] leading-relaxed mb-2">
                          {event.type === "commit" && (
                            <code className="text-[10px] text-[#444] mr-2 font-mono bg-[#111] px-1 py-0.5">
                              {event.id.replace("commit-", "").slice(0, 7)}
                            </code>
                          )}
                          {event.message}
                        </p>
                        
                        {event.author && (
                          <div className="flex items-center gap-1.5 text-[10px] text-[#333]">
                            <User size={10} />
                            {event.author}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Show more button */}
          {filteredEvents.length > 20 && (
            <div className="text-center pt-4 border-t border-[#1a1a1a]/30">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-2 text-[11px] text-[#444] hover:text-[#777] transition-colors px-4 py-2"
              >
                <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                {isExpanded ? "Show less" : `Show all ${filteredEvents.length} events`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}