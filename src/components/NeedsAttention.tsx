"use client";
import { motion } from "framer-motion";
import { Icon } from "./Icon";

import type { Project } from "@/lib/types";
import TimeAgo from "./TimeAgo";

type ProjectWithActivity = Project & {
  lastActivity?: string;
  daysSinceActivity?: number;
};

type Props = {
  projects: ProjectWithActivity[];
};

export default function NeedsAttention({ projects }: Props) {
  // Filter to projects with no activity in 7+ days
  const staleProjects = projects
    .filter((p) => p.status === "active" && (p.daysSinceActivity || 0) >= 7)
    .sort((a, b) => (b.daysSinceActivity || 0) - (a.daysSinceActivity || 0))
    .slice(0, 5);

  if (staleProjects.length === 0) {
    return (
      <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="star" size={20} className="text-[#d2ff5a]" />
          <h3 className="text-lg font-semibold">All Good!</h3>
        </div>
        <p className="text-sm text-[#8b8b8b]">
          All active projects have recent activity.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="warning" size={20} />
        <h3 className="text-lg font-semibold">Needs Attention</h3>
      </div>
      <div className="space-y-3">
        {staleProjects.map((project, index) => (
          <motion.a
            key={project.id}
            href={`/project/${project.id}`}
            className="flex items-center justify-between p-3 rounded-none hover:bg-[#111] transition group"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.01, x: 4 }}
          >
            <div>
              <p className="font-medium text-sm group-hover:text-[#7bdcff] transition">
                {project.name}
              </p>
              <p className="text-xs text-[#666]">
                {project.lastActivity
                  ? <TimeAgo date={project.lastActivity} prefix="Last activity " />
                  : "No recent activity"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-none ${
                  (project.daysSinceActivity || 0) >= 30
                    ? "bg-red-500/20 text-red-400"
                    : (project.daysSinceActivity || 0) >= 14
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-orange-500/20 text-orange-400"
                }`}
              >
                {project.daysSinceActivity}d
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
