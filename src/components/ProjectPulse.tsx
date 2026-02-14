"use client";

type Props = {
  activeProjects: number;
  milestonesInProgress: number;
  journalEntriesThisWeek: number;
};

export default function ProjectPulse({ activeProjects, milestonesInProgress, journalEntriesThisWeek }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 border border-[#1a1a1a] bg-[#080808] text-xs font-mono text-[#666]">
      <span className="uppercase tracking-[0.2em] text-[10px] text-[#444]">Pulse</span>
      <span>
        <span className="text-[#d2ff5a] font-semibold">{activeProjects}</span> project{activeProjects !== 1 ? "s" : ""} active
      </span>
      <span>
        <span className="text-cyan-400 font-semibold">{milestonesInProgress}</span> milestone{milestonesInProgress !== 1 ? "s" : ""} in progress
      </span>
      <span>
        <span className="text-[#999] font-semibold">{journalEntriesThisWeek}</span> journal entr{journalEntriesThisWeek !== 1 ? "ies" : "y"} this week
      </span>
    </div>
  );
}
