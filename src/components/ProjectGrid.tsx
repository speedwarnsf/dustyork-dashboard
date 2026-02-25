"use client";

import { useMemo, useState, useEffect } from "react";
import type { Project, ProjectHealth } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import ProjectCard from "@/components/ProjectCard";
// lucide-react icons removed (unused)

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
      // Sort by most recent activity (newest commit/update first)
      const aTime = a.github?.lastCommitDate 
        ? new Date(a.github.lastCommitDate).getTime() 
        : new Date(a.updated_at).getTime();
      const bTime = b.github?.lastCommitDate 
        ? new Date(b.github.lastCommitDate).getTime() 
        : new Date(b.updated_at).getTime();
      return bTime - aTime;
    });
  }, [projects]);

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

  return (
    <div>
      <div className="grid gap-px bg-[#1a1a1a] sm:grid-cols-2 lg:grid-cols-3">
        {sortedProjects.map((project) => (
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
}
