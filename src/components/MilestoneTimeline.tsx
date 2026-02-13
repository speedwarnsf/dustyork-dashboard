"use client";

import { motion } from "framer-motion";
import { Target, CheckCircle, Clock, Circle } from "lucide-react";
import { format } from "date-fns";
import type { Milestone } from "@/lib/types";

type Props = {
  milestones: Milestone[];
};

const statusConfig = {
  completed: { icon: CheckCircle, color: "text-green-400", dotColor: "bg-green-400", lineColor: "bg-green-400/30" },
  in_progress: { icon: Clock, color: "text-[#7bdcff]", dotColor: "bg-[#7bdcff]", lineColor: "bg-[#7bdcff]/30" },
  not_started: { icon: Circle, color: "text-[#555]", dotColor: "bg-[#555]", lineColor: "bg-[#1c1c1c]" },
};

export default function MilestoneTimeline({ milestones }: Props) {
  if (milestones.length === 0) return null;

  // Sort: completed first, then in_progress, then not_started; within each by target_date
  const sorted = [...milestones].sort((a, b) => {
    const order = { completed: 0, in_progress: 1, not_started: 2 };
    const statusDiff = (order[a.status] ?? 2) - (order[b.status] ?? 2);
    if (statusDiff !== 0) return statusDiff;
    if (a.target_date && b.target_date) return a.target_date.localeCompare(b.target_date);
    return 0;
  });

  return (
    <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target size={18} className="text-[#d2ff5a]" />
        <h3 className="text-lg font-semibold">Milestone Timeline</h3>
      </div>

      <div className="relative">
        {sorted.map((milestone, i) => {
          const config = statusConfig[milestone.status] || statusConfig.not_started;
          const StatusIcon = config.icon;
          const isLast = i === sorted.length - 1;

          return (
            <motion.div
              key={milestone.id}
              className="flex gap-4 relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Timeline line & dot */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={`w-8 h-8 rounded-none flex items-center justify-center border-2 ${
                    milestone.status === "completed"
                      ? "border-green-400 bg-green-400/10"
                      : milestone.status === "in_progress"
                      ? "border-[#7bdcff] bg-[#7bdcff]/10"
                      : "border-[#333] bg-[#111]"
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  <StatusIcon size={14} className={config.color} />
                </motion.div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[40px] ${config.lineColor}`} />
                )}
              </div>

              {/* Content */}
              <div className="pb-6 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{milestone.name}</p>
                    {milestone.description && (
                      <p className="text-xs text-[#8b8b8b] mt-0.5">{milestone.description}</p>
                    )}
                  </div>
                  {milestone.target_date && (
                    <span className="text-xs text-[#666] whitespace-nowrap">
                      {format(new Date(milestone.target_date), "MMM d, yyyy")}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#1c1c1c] rounded-none overflow-hidden max-w-[200px]">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#7bdcff] to-[#d2ff5a]"
                      initial={{ width: 0 }}
                      animate={{ width: `${milestone.percent_complete}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-[#666]">{milestone.percent_complete}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
