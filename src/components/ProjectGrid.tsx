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
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
