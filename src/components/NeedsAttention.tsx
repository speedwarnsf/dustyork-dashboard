"use client";
import type { Project, ProjectHealth } from "@/lib/types";
import { AlertTriangle, Clock, GitCommit, Globe, Github } from "lucide-react";
import TimeAgo from "./TimeAgo";
import { getHealthDotColor } from "@/lib/health";

type ProjectWithActivity = Project & {
  lastActivity?: string;
  daysSinceActivity?: number;
  health?: ProjectHealth;
};

type Props = {
  projects: ProjectWithActivity[];
};

export default function NeedsAttention({ projects }: Props) {
  // Enhanced attention criteria - include health issues and stale projects
  const projectsNeedingAttention = projects
    .filter((p) => {
      if (p.status !== "active") return false;
      
      // Health issues (alerts or low score)
      const hasHealthIssues = (p.health?.alerts.length || 0) > 0 || (p.health?.score || 50) < 50;
      
      // Stale activity (7+ days)
      const isStale = (p.daysSinceActivity || 0) >= 7;
      
      return hasHealthIssues || isStale;
    })
    .sort((a, b) => {
      // Sort by severity - health issues first, then staleness
      const aAlerts = a.health?.alerts.length || 0;
      const bAlerts = b.health?.alerts.length || 0;
      if (aAlerts !== bAlerts) return bAlerts - aAlerts;
      
      const aHealth = a.health?.score || 50;
      const bHealth = b.health?.score || 50;
      if (Math.abs(aHealth - bHealth) > 10) return aHealth - bHealth;
      
      return (b.daysSinceActivity || 0) - (a.daysSinceActivity || 0);
    })
    .slice(0, 6);

  if (projectsNeedingAttention.length === 0) {
    return (
      <div className="border border-[#1a1a1a] bg-[#080808] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-400/20 border border-green-400/40 flex items-center justify-center">
            <div className="w-1 h-1 bg-green-400" />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">All Clear</h3>
        </div>
        <p className="text-sm text-[#444]">All active projects are healthy with recent activity.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={14} className="text-orange-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
          Needs Attention
          <span className="ml-2 text-[#333] font-mono">{projectsNeedingAttention.length}</span>
        </h3>
      </div>
      
      <div className="space-y-1">
        {projectsNeedingAttention.map((project) => {
          const hasHealthIssues = (project.health?.alerts.length || 0) > 0;
          const healthScore = project.health?.score || 50;
          const isStale = (project.daysSinceActivity || 0) >= 7;
          
          return (
            <a
              key={project.id}
              href={`/project/${project.id}`}
              className="flex items-start gap-3 py-3 px-3 -mx-3 hover:bg-[#0c0c0c] transition-colors group border-l-2 border-transparent hover:border-orange-400/30"
            >
              {/* Health indicator */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {project.health && (
                  <span className={`w-2 h-2 ${getHealthDotColor(project.health)}`} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-[#999] group-hover:text-white transition-colors">
                    {project.name}
                  </p>
                  {project.health && (
                    <span className="text-xs font-mono text-[#555]">
                      {project.health.score}
                    </span>
                  )}
                </div>
                
                {/* Issues summary */}
                {hasHealthIssues && project.health?.alerts[0] && (
                  <p className="text-[11px] text-orange-400 mb-1">
                    {project.health.alerts[0]}
                    {project.health.alerts.length > 1 && ` (+${project.health.alerts.length - 1} more)`}
                  </p>
                )}
                
                {/* Activity info */}
                <div className="flex items-center gap-3 text-[10px] text-[#444]">
                  {isStale && (
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      <TimeAgo date={project.lastActivity || project.updated_at} />
                    </div>
                  )}
                  
                  {project.github_repo && (
                    <div className="flex items-center gap-1">
                      <Github size={10} />
                      <span>Repo</span>
                    </div>
                  )}
                  
                  {project.live_url && (
                    <div className="flex items-center gap-1">
                      <Globe size={10} />
                      <span>Live</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Severity indicator */}
              <div className={`text-[10px] font-mono px-2 py-1 shrink-0 ${
                hasHealthIssues && healthScore < 30
                  ? "text-red-400 bg-red-500/10 border border-red-500/20"
                  : hasHealthIssues || (project.daysSinceActivity || 0) >= 30
                  ? "text-orange-400 bg-orange-500/10 border border-orange-500/20"
                  : "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20"
              }`}>
                {hasHealthIssues ? "HEALTH" : `${project.daysSinceActivity}D`}
              </div>
            </a>
          );
        })}
      </div>
      
      {/* Quick actions */}
      <div className="mt-4 pt-4 border-t border-[#1a1a1a]/60">
        <button
          onClick={() => window.location.reload()}
          className="text-[11px] text-[#444] hover:text-[#777] transition-colors"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}
