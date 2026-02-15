import { createSupabaseServerClient } from "@/lib/supabase/server";
import RoadmapView from "@/components/RoadmapView";
import type { Project, Milestone, Release, MilestoneDependency } from "@/lib/types";

export const revalidate = 60;

export default async function RoadmapPage() {
  const supabase = await createSupabaseServerClient();

  const [projectsRes, milestonesRes, releasesRes, depsRes] = await Promise.all([
    supabase.from("projects").select("id, name, status, priority").order("name"),
    supabase.from("milestones").select("*, projects(name)").order("target_date", { ascending: true }),
    supabase.from("releases").select("*").order("target_date", { ascending: true }),
    supabase.from("milestone_dependencies").select("*"),
  ]);

  const projects = (projectsRes.data || []) as Array<Pick<Project, "id" | "name" | "status" | "priority">>;
  const milestones = (milestonesRes.data || []) as Array<Milestone & { projects: { name: string } | null }>;
  const releases = (releasesRes.data || []) as Release[];
  const dependencies = (depsRes.data || []) as MilestoneDependency[];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.5em] text-[#555] mb-2 font-mono">
            Planning
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Roadmap
          </h1>
        </div>
      </div>

      <RoadmapView
        projects={projects}
        milestones={milestones}
        releases={releases}
        dependencies={dependencies}
      />
    </main>
  );
}
