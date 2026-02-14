"use client";

import { useMemo, useState, useEffect } from "react";
import type { Project, ProjectHealth } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import ProjectCard from "@/components/ProjectCard";
import { AlertTriangle, Activity, CheckCircle } from "lucide-react";

type ProjectGridProps = {
  projects: Array<Project & { 
    github?: GithubActivity | null;
    health?: ProjectHealth;
    healthTrend?: "up" | "down" | "stable";
    lastDeployed?: string | null;
  }>;
};

// Lazy loading component wrapper
function LazyProjectCard({ project, isVisible }: { 
  project: Project & { github?: GithubActivity | null; health?: ProjectHealth; healthTrend?: "up" | "down" | "stable"; lastDeployed?: string | null; }, 
  isVisible: boolean 
}) {
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isVisible && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isVisible, hasLoaded]);

  if (!hasLoaded) {
    return (
      <div className="bg-black border border-[#1a1a1a] bg-[#080808] h-[400px] flex items-center justify-center">
        <div className="shimmer w-full h-full" />
      </div>
    );
  }

  return <ProjectCard project={project} />;
}

export default function ProjectGrid({ projects }: ProjectGridProps) {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  // Prioritize projects by importance for visual hierarchy
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      // 1. Critical health issues first
      const aAlerts = a.health?.alerts.length || 0;
      const bAlerts = b.health?.alerts.length || 0;
      if (aAlerts !== bAlerts) return bAlerts - aAlerts;

      // 2. Active projects before others
      if (a.status !== b.status) {
        if (a.status === "active") return -1;
        if (b.status === "active") return 1;
        if (a.status === "completed") return -1;
        if (b.status === "completed") return 1;
      }

      // 3. Health score (lower = needs more attention)
      const aHealth = a.health?.score || 50;
      const bHealth = b.health?.score || 50;
      if (Math.abs(aHealth - bHealth) > 10) {
        return aHealth - bHealth; // Lower health first for attention
      }

      // 4. Recent activity
      const aActivity = new Date(a.updated_at).getTime();
      const bActivity = new Date(b.updated_at).getTime();
      return bActivity - aActivity;
    });
  }, [projects]);

  // Group projects by status for better visual organization
  const groupedProjects = useMemo(() => {
    const groups = {
      needsAttention: sortedProjects.filter(p => 
        p.status === "active" && 
        ((p.health?.alerts.length || 0) > 0 || (p.health?.score || 50) < 50)
      ),
      active: sortedProjects.filter(p => 
        p.status === "active" && 
        (p.health?.alerts.length || 0) === 0 && 
        (p.health?.score || 50) >= 50
      ),
      completed: sortedProjects.filter(p => p.status === "completed"),
      other: sortedProjects.filter(p => !["active", "completed"].includes(p.status))
    };
    
    return groups;
  }, [sortedProjects]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { 
        rootMargin: '100px',
        threshold: 0.1 
      }
    );

    // Observe all project cards
    const cards = document.querySelectorAll('[data-project-id]');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [sortedProjects]);

  const renderProjectGroup = (
    title: string, 
    projects: typeof sortedProjects, 
    icon: React.ReactNode,
    className?: string
  ) => {
    if (projects.length === 0) return null;

    return (
      <div className={`mb-8 ${className || ""}`}>
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
            {title}
            <span className="ml-2 text-[#333] font-mono">{projects.length}</span>
          </h3>
        </div>
        <div className="grid gap-px bg-[#1a1a1a] sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div 
              key={project.id} 
              id={`project-${project.id}`}
              data-project-id={project.id}
              className="bg-black"
            >
              <LazyProjectCard 
                project={project} 
                isVisible={visibleItems.has(`project-${project.id}`)} 
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderProjectGroup(
        "Needs Attention", 
        groupedProjects.needsAttention,
        <AlertTriangle size={14} className="text-orange-400" />
      )}
      
      {renderProjectGroup(
        "Active Projects", 
        groupedProjects.active,
        <Activity size={14} className="text-green-400" />
      )}
      
      {renderProjectGroup(
        "Completed", 
        groupedProjects.completed,
        <CheckCircle size={14} className="text-cyan-400" />
      )}
      
      {renderProjectGroup(
        "Other", 
        groupedProjects.other,
        <div className="w-3.5 h-3.5 bg-[#333]" />
      )}
    </div>
  );
}
