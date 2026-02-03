import ProjectDashboard from "@/components/ProjectDashboard";
import ResumePanel from "@/components/ResumePanel";
import { fetchGithubActivity } from "@/lib/github";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projectsData } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  const projects = (projectsData || []) as Project[];
  const projectsWithGithub = await Promise.all(
    projects.map(async (project) => {
      if (!project.github_repo) {
        return { ...project, github: null };
      }
      const github = await fetchGithubActivity(project.github_repo);
      return { ...project, github };
    })
  );

  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-8">
            <p className="text-xs uppercase tracking-[0.4em] text-[#7bdcff]">
              Welcome back
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {user?.email || "Operator"}
            </h2>
            <p className="mt-2 text-sm text-[#8b8b8b]">
              Monitor live releases, track milestones, and keep the momentum
              moving.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#1c1c1c] bg-black p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
                  Projects
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {projects.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#1c1c1c] bg-black p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
                  Active
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {projects.filter((project) => project.status === "active")
                    .length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#1c1c1c] bg-black p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
                  Paused
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {projects.filter((project) => project.status === "paused")
                    .length}
                </p>
              </div>
            </div>
          </div>
          <ResumePanel />
        </div>
      </section>
      <ProjectDashboard projects={projectsWithGithub} />
    </main>
  );
}
