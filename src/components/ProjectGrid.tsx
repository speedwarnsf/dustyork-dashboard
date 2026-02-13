"use client";

import type { Project, ProjectHealth } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import ProjectCard from "@/components/ProjectCard";

type ProjectGridProps = {
  projects: Array<Project & { 
    github?: GithubActivity | null;
    health?: ProjectHealth;
  }>;
};

export default function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <div className="grid gap-px bg-[#1a1a1a] sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div key={project.id} className="bg-black">
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
}
