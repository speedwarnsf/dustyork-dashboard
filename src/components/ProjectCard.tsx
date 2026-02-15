"use client";
import { useState } from "react";
import { Github, GitCommit, Globe, Clock, Rocket, Eye, AlertTriangle } from "lucide-react";
import OptimizedImage from "./OptimizedImage";
import { deployProject } from "@/lib/actions";

import type { Project, ProjectHealth } from "@/lib/types";
import type { GithubActivity, DeployStatus } from "@/lib/github";
import { getGithubOpenGraphUrl } from "@/lib/github";
import { getHealthDotColor, getHealthLabel, getHealthTextColor } from "@/lib/health";
import TimeAgo from "./TimeAgo";
import Sparkline from "./Sparkline";

const statusStyles: Record<string, { text: string; border: string }> = {
  active: { text: "text-[#d2ff5a]", border: "border-[#d2ff5a]/20" },
  paused: { text: "text-[#f4b26a]", border: "border-[#f4b26a]/20" },
  completed: { text: "text-[#7bdcff]", border: "border-[#7bdcff]/20" },
  archived: { text: "text-[#555]", border: "border-[#333]" },
};

type ProjectCardProps = {
  project: Project & { 
    github?: GithubActivity | null;
    health?: ProjectHealth;
    healthTrend?: "up" | "down" | "stable";
    lastDeployed?: string | null;
    sparklineData?: number[];
    deployStatus?: DeployStatus;
  };
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const fallbackImage = getGithubOpenGraphUrl(project.github_repo);
  const imageUrl = project.screenshot_url || fallbackImage || '/api/placeholder/400/192';
  const health = project.health;
  const healthDotColor = health ? getHealthDotColor(health) : "bg-[#555]";
  const healthLabel = health ? getHealthLabel(health) : "";
  const statusConfig = statusStyles[project.status] || statusStyles.active;

  return (
    <a
      href={`/project/${project.id}`}
      className="group block"
      data-project-id={project.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="border border-[#1a1a1a] bg-[#080808] p-0 flex flex-col h-full transition-shadow duration-200"
        style={{ boxShadow: isHovered ? 'var(--shadow-hover)' : 'var(--shadow-card)' }}
      >
        {/* Screenshot */}
        <div className="relative border-b border-[#1a1a1a] bg-black">
          <OptimizedImage
            src={imageUrl}
            alt={`${project.name} screenshot`}
            width={400}
            height={192}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            fallback={fallbackImage || undefined}
          />
          
          {/* Health score - top right */}
          {health && (
            <div className="absolute top-3 right-3 text-xs font-mono font-medium px-2 py-1 bg-black/70 backdrop-blur-sm border border-[#1a1a1a] flex items-center gap-1">
              <span className={getHealthTextColor(health)}>{health.score}</span>
              {project.healthTrend === "up" && <span className="text-green-400" title="Improving">&#9650;</span>}
              {project.healthTrend === "down" && <span className="text-red-400" title="Declining">&#9660;</span>}
            </div>
          )}
          
          {/* Status indicator - top left */}
          {project.status !== "active" && (
            <div className="absolute top-3 left-3">
              <span className={`text-[10px] uppercase tracking-[0.15em] border px-2 py-1 backdrop-blur-sm ${statusConfig.text} ${statusConfig.border} bg-black/50`}>
                {project.status}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          {/* Name + Status */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-base font-semibold group-hover:text-white transition-colors">
              {project.name}
            </h3>
            <span className={`text-[10px] uppercase tracking-[0.15em] border px-2 py-0.5 shrink-0 ${statusConfig.text} ${statusConfig.border}`}>
              {project.status}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-[#666] line-clamp-2 mb-3 flex-1">
            {project.description || "No description."}
          </p>

          {/* Deploy Status Badge */}
          {project.deployStatus && project.deployStatus.status !== "unknown" && (
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] font-mono px-2 py-1 border ${
                project.deployStatus.status === "success" ? "text-[#d2ff5a] border-[#d2ff5a]/20 bg-[#d2ff5a]/5" :
                project.deployStatus.status === "failed" ? "text-red-400 border-red-400/20 bg-red-400/5" :
                project.deployStatus.status === "building" ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/5" :
                "text-[#555] border-[#1a1a1a]"
              }`}>
                <span className={`w-1.5 h-1.5 ${
                  project.deployStatus.status === "success" ? "bg-[#d2ff5a]" :
                  project.deployStatus.status === "failed" ? "bg-red-400" :
                  project.deployStatus.status === "building" ? "bg-yellow-400 animate-pulse" :
                  "bg-[#555]"
                }`} />
                {project.deployStatus.status === "success" ? "Deployed" :
                 project.deployStatus.status === "failed" ? "Deploy Failed" :
                 project.deployStatus.status === "building" ? "Building" : "Unknown"}
              </span>
              {project.deployStatus.timestamp && (
                <span className="text-[10px] text-[#444] font-mono">
                  <TimeAgo date={project.deployStatus.timestamp} />
                </span>
              )}
            </div>
          )}

          {/* Sparkline - 30 day commit activity */}
          {project.sparklineData && project.sparklineData.length > 0 && project.sparklineData.some(v => v > 0) && (
            <div className="mb-3 py-2 border-t border-b border-[#1a1a1a]/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#444] font-mono uppercase tracking-wider">30d commits</span>
                <span className="text-[10px] text-[#555] font-mono">{project.sparklineData.reduce((a, b) => a + b, 0)} total</span>
              </div>
              <Sparkline
                data={project.sparklineData}
                width={320}
                height={28}
                color="#7bdcff"
                gradientFrom="#7bdcff"
                gradientTo="#d2ff5a"
                strokeWidth={1.5}
                showDots
              />
            </div>
          )}

          {/* Last commit */}
          {project.github?.lastCommitMessage && (
            <div className="flex items-start gap-2 mb-3 py-2 border-t border-b border-[#1a1a1a]/60">
              <GitCommit size={11} className="text-[#444] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[#555] line-clamp-1 font-mono">
                {project.github.lastCommitMessage}
              </p>
            </div>
          )}

          {/* Footer meta */}
          <div className="flex items-center justify-between text-[11px] text-[#444] mt-auto pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock size={10} />
                <TimeAgo date={project.updated_at} />
              </div>
              {project.lastDeployed && (
                <div className="flex items-center gap-1 text-[#555]">
                  <Rocket size={9} />
                  <TimeAgo date={project.lastDeployed} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {project.github?.openIssues != null && project.github.openIssues > 0 && (
                <span className="text-[#666]">{project.github.openIssues} issues</span>
              )}
              {health && (
                <span className={`flex items-center gap-1.5 ${getHealthTextColor(health)}`}>
                  <span className={`w-1.5 h-1.5 ${healthDotColor}`} />
                  {healthLabel}
                </span>
              )}
            </div>
          </div>

          {/* Health alerts */}
          {health && health.alerts.length > 0 && (
            <div className="flex items-start gap-2 mt-3 pt-2 border-t border-[#1a1a1a]/40">
              <AlertTriangle size={12} className="text-orange-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-[#666] line-clamp-2">
                {health.alerts[0]}{health.alerts.length > 1 && ` (+${health.alerts.length - 1} more)`}
              </p>
            </div>
          )}

          {/* Enhanced Quick Actions */}
          <div className={`flex gap-1.5 mt-3 pt-3 border-t border-[#1a1a1a]/40 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/project/${project.id}`; }}
              className="flex-1 py-2 text-[11px] border border-[#1a1a1a] text-[#555] hover:border-[#333] hover:text-white hover:bg-[#0c0c0c] transition flex items-center justify-center gap-1.5"
              title="View details"
            >
              <Eye size={11} />
              View
            </button>
            {project.github_repo && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`https://github.com/${project.github_repo}`, "_blank"); }}
                className="flex-1 py-2 text-[11px] border border-[#1a1a1a] text-[#555] hover:border-[#333] hover:text-[#7bdcff] hover:bg-[#0c0c0c] transition flex items-center justify-center gap-1.5"
                title="Open repository"
              >
                <Github size={11} />
                Code
              </button>
            )}
            {project.live_url && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(project.live_url!, "_blank"); }}
                className="flex-1 py-2 text-[11px] border border-[#1a1a1a] text-[#555] hover:border-[#333] hover:text-[#d2ff5a] hover:bg-[#0c0c0c] transition flex items-center justify-center gap-1.5"
                title="View live site"
              >
                <Globe size={11} />
                Live
              </button>
            )}
            {project.status === "active" && project.github_repo && (
              <button
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  deployProject(project.id, project.name);
                }}
                className="flex-1 py-2 text-[11px] border border-[#1a1a1a] text-[#555] hover:border-[#333] hover:text-orange-400 hover:bg-[#0c0c0c] transition flex items-center justify-center gap-1.5"
                title="Deploy project"
              >
                <Rocket size={11} />
                Deploy
              </button>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
