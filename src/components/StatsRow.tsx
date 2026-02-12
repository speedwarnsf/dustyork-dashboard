"use client";

import { motion } from "framer-motion";
import Sparkline from "./Sparkline";
import { Flame, TrendingUp, Target, Activity, BarChart3 } from "lucide-react";

type StatsRowProps = {
  projects: number;
  activeProjects: number;
  totalMilestones: number;
  completedMilestones: number;
  avgHealthScore: number;
  activeThisWeek: number;
  weeklyActivityCount: number;
  monthlyActivityCount: number;
  commitCount: number;
  streak: number;
  sparklineData: number[];
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function StatsRow({
  projects,
  activeProjects,
  totalMilestones,
  completedMilestones,
  avgHealthScore,
  activeThisWeek,
  weeklyActivityCount,
  monthlyActivityCount,
  commitCount,
  streak,
  sparklineData,
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
      {/* Projects */}
      <motion.div
        className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4 relative overflow-hidden group hover:border-[#7bdcff]/30 transition-colors"
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Projects</p>
          <BarChart3 size={14} className="text-[#555] group-hover:text-[#7bdcff] transition-colors" />
        </div>
        <p className="text-3xl font-semibold mt-1">{projects}</p>
        <p className="text-xs text-[#555] mt-1">{activeProjects} active</p>
      </motion.div>

      {/* Milestones */}
      <motion.div
        className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4 relative overflow-hidden group hover:border-[#d2ff5a]/30 transition-colors"
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Milestones</p>
          <Target size={14} className="text-[#555] group-hover:text-[#d2ff5a] transition-colors" />
        </div>
        <p className="text-3xl font-semibold mt-1">{totalMilestones}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-[#555]">{completedMilestones} completed</p>
          {totalMilestones > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#d2ff5a]/10 text-[#d2ff5a]">
              {Math.round((completedMilestones / totalMilestones) * 100)}%
            </span>
          )}
        </div>
      </motion.div>

      {/* Avg Health */}
      <motion.div
        className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4 relative overflow-hidden group hover:border-[#7bdcff]/30 transition-colors"
        custom={2}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Avg Health</p>
          <Activity size={14} className="text-[#555] group-hover:text-[#7bdcff] transition-colors" />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-3xl font-semibold mt-1">{Math.round(avgHealthScore)}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            avgHealthScore >= 70 ? "bg-green-400/10 text-green-400" :
            avgHealthScore >= 50 ? "bg-yellow-400/10 text-yellow-400" : "bg-red-400/10 text-red-400"
          }`}>
            {avgHealthScore >= 70 ? "Good" : avgHealthScore >= 50 ? "Fair" : "Low"}
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              avgHealthScore >= 70 ? "bg-gradient-to-r from-green-400 to-green-300" :
              avgHealthScore >= 50 ? "bg-gradient-to-r from-yellow-400 to-yellow-300" : "bg-gradient-to-r from-red-400 to-red-300"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${avgHealthScore}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          />
        </div>
      </motion.div>

      {/* Active This Week + Sparkline */}
      <motion.div
        className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4 relative overflow-hidden group hover:border-[#7bdcff]/30 transition-colors"
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Activity</p>
          <TrendingUp size={14} className="text-[#555] group-hover:text-[#7bdcff] transition-colors" />
        </div>
        <div className="flex items-end justify-between mt-1">
          <div>
            <p className="text-3xl font-semibold">{activeThisWeek}</p>
            <p className="text-xs text-[#555]">{weeklyActivityCount} events</p>
          </div>
          <div className="opacity-80">
            <Sparkline
              data={sparklineData}
              width={80}
              height={28}
              color="#7bdcff"
              gradientFrom="#7bdcff"
              gradientTo="#d2ff5a"
              showDots
            />
          </div>
        </div>
      </motion.div>

      {/* Streak + Monthly */}
      <motion.div
        className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4 relative overflow-hidden group hover:border-[#f97316]/30 transition-colors col-span-2 sm:col-span-1"
        custom={4}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Streak</p>
          <Flame size={14} className={`transition-colors ${streak >= 3 ? "text-orange-400" : "text-[#555]"} group-hover:text-orange-400`} />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-3xl font-semibold">{streak}</p>
          {streak > 0 && (
            <motion.span
              className="text-lg"
              animate={streak >= 5 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🔥
            </motion.span>
          )}
        </div>
        <p className="text-xs text-[#555] mt-1">
          {streak === 0 ? "Start building!" : streak === 1 ? "day" : "days"} · {monthlyActivityCount} this month
        </p>
      </motion.div>
    </div>
  );
}
