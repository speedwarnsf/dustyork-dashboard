"use client";
import Image from "next/image";
import { useState } from "react";
import { ExternalLink, Github, GitCommit, Globe, Clock } from "lucide-react";

import type { Project, ProjectHealth } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import { getGithubOpenGraphUrl } from "@/lib/github";
import { getHealthDotColor, getHealthLabel, getHealthTextColor } from "@/lib/health";
import TimeAgo from "./TimeAgo";

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
  };
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const fallbackImage = getGithubOpenGraphUrl(project.github_repo);
  const imageUrl = project.screenshot_url || fallbackImage;
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
        {imageUrl ? (
          <div className="overflow-hidden border-b border-[#1a1a1a] bg-black relative">
            <Image
              src={imageUrl}
              alt={`${project.name}`}
              width={400}
              height={200}
              className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              unoptimized={imageUrl.startsWith("http")}
            />
            {/* Subtle gradient at bottom for readability */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#080808] to-transparent" />
            
            {/* Health score - top right */}
            {health && (
              <div className="absolute top-3 right-3 text-xs font-mono font-medium px-2 py-1 bg-black/70 backdrop-blur-sm border border-[#1a1a1a]">
                <span className={getHealthTextColor(health)}>{health.score}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-center relative">
            <span className="text-[#1a1a1a] text-xs uppercase tracking-widest">No preview</span>
            {health && (
              <div className="absolute top-3 right-3 text-xs font-mono font-medium px-2 py-1 bg-black/70 border border-[#1a1a1a]">
                <span className={getHealthTextColor(health)}>{health.score}</span>
              </div>
            )}
          </div>
        )}

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
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <TimeAgo date={project.updated_at} />
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

          {/* Quick links on hover */}
          <div className={`flex gap-2 mt-3 pt-3 border-t border-[#1a1a1a]/40 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            {project.github_repo && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`https://github.com/${project.github_repo}`, "_blank"); }}
                className="flex-1 py-1.5 text-[11px] border border-[#1a1a1a] text-[#555] hover:border-[#333] hover:text-[#999] transition flex items-center justify-center gap-1.5"
              >
                <Github size={11} />
                Repo
              </button>
            )}
            {project.live_url && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(project.live_url!, "_blank"); }}
                className="flex-1 py-1.5 text-[11px] border border-[#1a1a1a] text-[#555] hover:border-[#333] hover:text-[#999] transition flex items-center justify-center gap-1.5"
              >
                <Globe size={11} />
                Live
              </button>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
