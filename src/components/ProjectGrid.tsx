import type { Project } from "@/lib/types";
import type { GithubActivity } from "@/lib/github";
import ProjectCard from "@/components/ProjectCard";

type ProjectGridProps = {
  projects: Array<Project & { github?: GithubActivity | null }>;
};

export default function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
