"use client";

import TimeAgo from "./TimeAgo";

type ActivityItem = {
  id: string;
  type: "commit" | "journal" | "milestone" | "status_change" | "io_update";
  projectName: string;
  projectId: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

type Props = {
  activities: ActivityItem[];
};

const iconMap: Record<string, string> = {
  commit: "🔨",
  journal: "📝",
  milestone: "🎯",
  status_change: "🔄",
  io_update: "🌙",
};

const colorMap: Record<string, string> = {
  commit: "text-green-400",
  journal: "text-blue-400",
  milestone: "text-yellow-400",
  status_change: "text-purple-400",
  io_update: "text-cyan-400",
};

export default function ActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
        <h3 className="text-lg font-semibold">Activity Feed</h3>
        <p className="mt-4 text-sm text-[#8b8b8b]">
          No recent activity. Start working on a project!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {activities.map((activity) => (
          <a
            key={activity.id}
            href={`/project/${activity.projectId}`}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#111] transition group"
          >
            <span className="text-xl">{iconMap[activity.type] || "📌"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className={`font-medium ${colorMap[activity.type] || "text-white"}`}>
                  {activity.projectName}
                </span>
              </p>
              <p className="text-sm text-[#8b8b8b] truncate group-hover:text-white transition">
                {activity.message}
              </p>
              <p className="text-xs text-[#666] mt-1">
                <TimeAgo date={activity.timestamp} />
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
