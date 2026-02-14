"use client";

import { formatDistanceToNow } from "date-fns";

type RecentEntry = {
  id: string;
  content: string;
  entry_type: string;
  created_at: string;
  projectName: string;
  projectId: string;
};

type Props = {
  entries: RecentEntry[];
};

const typeColors: Record<string, string> = {
  io_update: "text-cyan-400",
  note: "text-[#999]",
  milestone: "text-[#d2ff5a]",
  decision: "text-yellow-400",
  blocker: "text-red-400",
};

export default function RecentActivity({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="border border-[#1a1a1a] bg-[#080808]">
      <div className="px-5 py-4 border-b border-[#1a1a1a]">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
          Recent Activity
          <span className="ml-2 text-[#333] font-mono">{entries.length}</span>
        </h3>
      </div>
      <div className="divide-y divide-[#1a1a1a]">
        {entries.map((entry) => (
          <a
            key={entry.id}
            href={`/project/${entry.projectId}`}
            className="block px-5 py-3 hover:bg-[#0c0c0c] transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#444] font-mono">
                    {entry.projectName}
                  </span>
                  <span className={`text-[10px] uppercase tracking-[0.1em] ${typeColors[entry.entry_type] || "text-[#555]"}`}>
                    {entry.entry_type.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-[#888] line-clamp-1 group-hover:text-[#ccc] transition-colors">
                  {entry.content}
                </p>
              </div>
              <span className="text-[11px] text-[#444] font-mono shrink-0 mt-0.5">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
