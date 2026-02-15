"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO, isToday, isYesterday } from "date-fns";

interface ChangeEntry {
  id: string;
  content: string;
  type: string;
  created_at: string;
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  projectStatus: string;
  entries: ChangeEntry[];
}

interface DayGroup {
  date: string;
  projects: ProjectGroup[];
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  io_update: { label: "UPDATE", color: "text-[#d2ff5a]" },
  note: { label: "NOTE", color: "text-[#888]" },
  milestone: { label: "MILESTONE", color: "text-[#5af]" },
  bug: { label: "BUG FIX", color: "text-[#f55]" },
  feature: { label: "FEATURE", color: "text-[#d2ff5a]" },
  decision: { label: "DECISION", color: "text-[#fa5]" },
};

function formatDateHeading(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d, yyyy");
}

function getTypeInfo(type: string) {
  return TYPE_LABELS[type] || { label: type.toUpperCase(), color: "text-[#666]" };
}

export default function ChangelogClient({ changelog }: { changelog: DayGroup[] }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const allProjects = Array.from(
    new Set(changelog.flatMap((d) => d.projects.map((p) => p.projectName)))
  ).sort();

  const filtered = filter === "all"
    ? changelog
    : changelog
        .map((day) => ({
          ...day,
          projects: day.projects.filter((p) => p.projectName === filter),
        }))
        .filter((day) => day.projects.length > 0);

  const totalEntries = changelog.reduce(
    (sum, day) => sum + day.projects.reduce((s, p) => s + p.entries.length, 0),
    0
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/dashboard"
            className="text-[11px] text-[#444] hover:text-[#888] transition font-mono"
          >
            Dashboard
          </Link>
          <span className="text-[#222] text-[11px]">/</span>
          <span className="text-[11px] text-[#666] font-mono">What&apos;s New</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
          What&apos;s New
        </h1>
        <p className="text-sm text-[#555]">
          Recent changes across all projects -- {totalEntries} updates in the last 30 days
        </p>
      </div>

      {/* Subscribe + Filter row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Subscribe */}
        <div className="flex-1">
          {subscribed ? (
            <div className="border border-[#1a1a1a] px-4 py-3">
              <p className="text-xs text-[#d2ff5a] font-mono">
                Subscribed. You will receive updates at {email}
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.includes("@")) setSubscribed(true);
              }}
              className="flex"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#333] font-mono"
              />
              <button
                type="submit"
                className="border border-[#1a1a1a] border-l-0 px-4 py-2 text-[11px] text-[#444] hover:bg-[#111] hover:text-[#d2ff5a] transition font-mono uppercase tracking-wider"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#0a0a0a] border border-[#1a1a1a] px-3 py-2 text-xs text-[#888] font-mono focus:outline-none focus:border-[#333] appearance-none cursor-pointer"
        >
          <option value="all">All Projects</option>
          {allProjects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="border border-[#1a1a1a] px-6 py-16 text-center">
          <p className="text-sm text-[#444]">No changes found for this period.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {filtered.map((day) => (
            <div key={day.date} className="relative">
              {/* Date heading */}
              <div className="sticky top-[57px] z-10 bg-black border-b border-[#1a1a1a] py-3 mb-0">
                <h2 className="text-xs font-mono text-[#d2ff5a] uppercase tracking-widest">
                  {formatDateHeading(day.date)}
                </h2>
              </div>

              {/* Projects for this date */}
              <div className="border-l border-[#1a1a1a] ml-2 pl-6 pb-8 pt-4 space-y-6">
                {day.projects.map((project) => (
                  <div key={project.projectId}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 bg-[#d2ff5a] -ml-[29px] mr-[2px]" />
                      <Link
                        href={`/project/${project.projectId}`}
                        className="text-sm font-medium text-white hover:text-[#d2ff5a] transition"
                      >
                        {project.projectName}
                      </Link>
                      <span className="text-[10px] font-mono text-[#333] uppercase">
                        {project.projectStatus}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {project.entries.map((entry) => {
                        const typeInfo = getTypeInfo(entry.type);
                        return (
                          <div
                            key={entry.id}
                            className="group flex gap-3 py-1.5"
                          >
                            <span className={`text-[10px] font-mono uppercase tracking-wider w-16 shrink-0 pt-0.5 ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            <p className="text-sm text-[#999] group-hover:text-[#ccc] transition leading-relaxed">
                              {entry.content}
                            </p>
                            <span className="text-[10px] text-[#222] font-mono shrink-0 pt-0.5 ml-auto">
                              {format(parseISO(entry.created_at), "HH:mm")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
