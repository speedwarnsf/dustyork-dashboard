"use client";
import { Icon } from "./Icon";
import { motion } from "framer-motion";
import { useId, useState } from "react";
import { ExternalLink, Github, GitCommit, Globe, Clock, AlertTriangle, CheckCircle, Activity } from "lucide-react";

import type { Project, ProjectHealth } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import { getGithubOpenGraphUrl } from "@/lib/github";
import { getHealthDotColor, getHealthLabel, getHealthTextColor } from "@/lib/health";
import TimeAgo from "./TimeAgo";

const statusStyles: Record<string, { bg: string; text: string; border: string; icon: React.ComponentType<any> }> = {
  active: { bg: "bg-[#0f1d12]", text: "text-[#d2ff5a]", border: "border-[#20381f]", icon: Activity },
  paused: { bg: "bg-[#1a1410]", text: "text-[#f4b26a]", border: "border-[#3f2c1f]", icon: Clock },
  completed: { bg: "bg-[#0c1b24]", text: "text-[#7bdcff]", border: "border-[#1b3b4c]", icon: CheckCircle },
  archived: { bg: "bg-[#151515]", text: "text-[#8b8b8b]", border: "border-[#2a2a2a]", icon: ExternalLink },
};

const priorityDots: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-yellow-400", 
  low: "bg-green-400",
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 40, strokeWidth = 3 }: { progress: number; size?: number; strokeWidth?: number }) => {
  const gradientId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(28, 28, 28, 0.3)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7bdcff" />
            <stop offset="100%" stopColor="#d2ff5a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

type ProjectCardProps = {
  project: Project & { 
    github?: GithubActivity | null;
    health?: ProjectHealth;
  };
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const fallbackImage = getGithubOpenGraphUrl(project.github_repo);
  const imageUrl = project.screenshot_url || fallbackImage;
  const health = project.health;
  const healthDotColor = health ? getHealthDotColor(health) : "bg-[#555]";
  const healthLabel = health ? getHealthLabel(health) : "Unknown";
  
  const statusConfig = statusStyles[project.status] || statusStyles.active;
  const StatusIcon = statusConfig.icon;
  
  // Calculate overall progress from health and milestones
  const overallProgress = health?.score || 0;
  
  // Determine if project is "live" (recently active)
  const isLive = project.status === "active" && project.github?.lastCommitDate && 
    new Date(project.github.lastCommitDate).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
  
  const handleQuickAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <motion.a
      href={`/project/${project.id}`}
      className="group block"
      data-project-id={project.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="glass-strong rounded-3xl p-5 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex flex-col h-full"
        style={{ 
          boxShadow: isHovered ? 'var(--shadow-premium)' : 'var(--shadow-card)' 
        }}
      >
        {/* Screenshot with enhanced overlay */}
        {imageUrl ? (
          <div className="mb-4 overflow-hidden rounded-2xl border border-[#1c1c1c] bg-black relative group/image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src={imageUrl}
              alt={`${project.name} screenshot`}
              className="h-44 w-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Gradient overlay on hover */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
            
            {/* Live status indicator */}
            {isLive && (
              <motion.div 
                className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg glass"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div 
                  className="w-2 h-2 rounded-full bg-[#d2ff5a]"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs font-medium text-[#d2ff5a]">Live</span>
              </motion.div>
            )}
            
            {/* Progress ring */}
            {health && (
              <div className="absolute top-3 right-3">
                <ProgressRing progress={health.score} size={36} strokeWidth={2} />
              </div>
            )}
            
            {/* Launched badge */}
            {project.launched && (
              <motion.div 
                className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-[#d2ff5a] text-black text-xs font-medium flex items-center gap-1"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Icon name="rocket" size={12} />
                Launched
              </motion.div>
            )}
          </div>
        ) : (
          <div className="mb-4 h-44 rounded-2xl border border-dashed border-[#1c1c1c] bg-[#0a0a0a] flex items-center justify-center relative">
            <span className="text-4xl opacity-20">📁</span>
            {health && (
              <div className="absolute top-3 right-3">
                <ProgressRing progress={health.score} size={36} strokeWidth={2} />
              </div>
            )}
          </div>
        )}

        {/* Header with enhanced status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Animated priority dot */}
            <motion.span 
              className={`w-2 h-2 rounded-full ${priorityDots[project.priority] || priorityDots.medium}`}
              title={`${project.priority} priority`}
              animate={project.priority === 'high' ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <h3 className="text-lg font-semibold transition-colors">
              {project.name}
            </h3>
          </div>
          
          {/* Enhanced status badge */}
          <motion.div
            className={`rounded-full border px-3 py-1 text-[9px] uppercase tracking-[0.2em] flex items-center gap-1.5 ${
              statusConfig.bg
            } ${statusConfig.text} ${statusConfig.border}`}
            whileHover={{ scale: 1.05 }}
          >
            <StatusIcon size={10} />
            {project.status}
          </motion.div>
        </div>

        {/* Description */}
        <p className="mt-2 text-sm text-[#8b8b8b] line-clamp-2 flex-1">
          {project.description || "No description yet."}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] bg-[#1c1c1c] text-[#8b8b8b] border border-[#333]/30"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-[10px] text-[#555] self-center">+{project.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Health Alerts with enhanced styling */}
        {health && health.alerts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {health.alerts.slice(0, 2).map((alert, i) => (
              <motion.span
                key={i}
                className="px-2 py-1 rounded-full text-[10px] glass border border-yellow-500/20 text-yellow-400 flex items-center gap-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <AlertTriangle size={8} />
                {alert}
              </motion.span>
            ))}
          </div>
        )}

        {/* Last commit message */}
        {project.github?.lastCommitMessage && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#1c1c1c]/50">
            <GitCommit size={12} className="text-green-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#8b8b8b] line-clamp-1 font-mono">
              {project.github.lastCommitMessage}
            </p>
          </div>
        )}

        {/* Enhanced meta info */}
        <div className="mt-4 pt-4 border-t border-[#1c1c1c]/50">
          <div className="flex items-center justify-between text-xs text-[#666]">
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <TimeAgo date={project.updated_at} prefix="Updated " />
            </div>
            <div className="flex items-center gap-3">
              {project.github?.openIssues != null && project.github.openIssues > 0 && (
                <span className="text-[#8b8b8b] flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {project.github.openIssues} issues
                </span>
              )}
              {project.live_url && (
                <span className="text-[#7bdcff] flex items-center gap-1">
                  <Globe size={10} />
                  Live
                </span>
              )}
              {health && (
                <span className={`${health ? getHealthTextColor(health) : "text-[#555]"} flex items-center gap-1`}>
                  <div className={`w-2 h-2 rounded-full ${healthDotColor}`} />
                  {healthLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced quick actions */}
        <motion.div 
          className="mt-3 flex gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 10
          }}
          transition={{ duration: 0.2 }}
        >
          {project.github_repo && (
            <motion.button
              onClick={(e) => handleQuickAction(e, () => window.open(`https://github.com/${project.github_repo}`, "_blank"))}
              className="flex-1 py-2 text-xs rounded-lg glass-strong hover:border-[#7bdcff] hover:text-[#7bdcff] transition-all text-center flex items-center justify-center gap-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Github size={12} />
              GitHub
            </motion.button>
          )}
          {project.live_url && (
            <motion.button
              onClick={(e) => handleQuickAction(e, () => window.open(project.live_url!, "_blank"))}
              className="flex-1 py-2 text-xs rounded-lg glass-strong hover:border-[#d2ff5a] hover:text-[#d2ff5a] transition-all text-center flex items-center justify-center gap-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ExternalLink size={12} />
              Live Site
            </motion.button>
          )}
          <motion.button
            onClick={(e) => handleQuickAction(e, () => window.location.href = `/project/${project.id}/edit`)}
            className="px-3 py-2 text-xs rounded-lg glass-strong hover:border-[#8b8b8b] hover:text-[#8b8b8b] transition-all flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon name="edit" size={12} />
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.a>
  );
}
