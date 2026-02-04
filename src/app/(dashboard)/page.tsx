import ProjectDashboard from "@/components/ProjectDashboard";
import ActivityFeed from "@/components/ActivityFeed";
import NeedsAttention from "@/components/NeedsAttention";
import InsightsPanel from "@/components/InsightsPanel";
import { fetchGithubActivity } from "@/lib/github";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project, Milestone } from "@/lib/types";
import { differenceInDays } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all projects
  const { data: projectsData } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  const projects = (projectsData || []) as Project[];

  // Fetch GitHub activity for all projects
  const projectsWithGithub = await Promise.all(
    projects.map(async (project) => {
      if (!project.github_repo) {
        return { ...project, github: null };
      }
      const github = await fetchGithubActivity(project.github_repo);
      return { ...project, github };
    })
  );

  // Add activity metadata to projects
  const projectsWithActivity = projectsWithGithub.map((p) => ({
    ...p,
    lastActivity: p.github?.lastCommitDate || p.updated_at,
    daysSinceActivity: differenceInDays(
      new Date(),
      new Date(p.github?.lastCommitDate || p.updated_at)
    ),
  }));

  // Fetch all milestones
  const { data: milestonesData } = await supabase
    .from("milestones")
    .select("*, projects(name)")
    .order("target_date", { ascending: true });

  const milestones = (milestonesData || []) as Array<Milestone & { projects: { name: string } }>;

  // Get upcoming milestones (not completed, with dates)
  const upcomingMilestones = milestones
    .filter((m) => m.status !== "completed" && m.target_date)
    .map((m) => ({
      ...m,
      projectName: m.projects?.name || "Unknown",
    }))
    .slice(0, 5);

  // Fetch recent journal entries for activity feed
  const { data: journalData } = await supabase
    .from("journal_entries")
    .select("*, projects(id, name)")
    .order("created_at", { ascending: false })
    .limit(20);

  // Build activity feed
  type ActivityType = "commit" | "journal" | "milestone" | "status_change" | "io_update";
  
  const journalActivities = (journalData || []).map((entry) => ({
    id: `journal-${entry.id}`,
    type: (entry.entry_type === "io_update" ? "io_update" : "journal") as ActivityType,
    projectName: entry.projects?.name || "Unknown",
    projectId: entry.projects?.id || "",
    message: entry.content.slice(0, 100) + (entry.content.length > 100 ? "..." : ""),
    timestamp: entry.created_at,
  }));
  
  const commitActivities = projectsWithGithub
    .filter((p) => p.github?.lastCommitMessage && p.github?.lastCommitDate)
    .map((p) => ({
      id: `commit-${p.id}`,
      type: "commit" as ActivityType,
      projectName: p.name,
      projectId: p.id,
      message: p.github!.lastCommitMessage!,
      timestamp: p.github!.lastCommitDate!,
    }));
  
  const activities = [...journalActivities, ...commitActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Collect recent commits for insights
  const recentCommits = projectsWithGithub
    .filter((p) => p.github?.lastCommitMessage && p.github?.lastCommitDate)
    .map((p) => ({
      projectName: p.name,
      message: p.github!.lastCommitMessage!,
      date: p.github!.lastCommitDate!,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate stats
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;

  return (
    <main>
      {/* Hero Section */}
      <section className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#7bdcff] mb-2">
              Command Center
            </p>
            <h1 className="text-4xl font-semibold">
              Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
            </h1>
            <p className="mt-2 text-[#8b8b8b] max-w-xl">
              Track your projects, monitor GitHub activity, and keep the momentum going.
              Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-[#1c1c1c] text-[#7bdcff]">⌘K</kbd> to
              quickly navigate.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/project/new"
              className="rounded-xl bg-[#7bdcff] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#a5ebff]"
            >
              + New Project
            </a>
          </div>
        </div>

        {/* Insights Panel */}
        <InsightsPanel
          totalProjects={projects.length}
          activeProjects={activeProjects}
          totalMilestones={milestones.length}
          completedMilestones={completedMilestones}
          upcomingMilestones={upcomingMilestones}
          recentCommits={recentCommits}
        />
      </section>

      {/* Activity + Attention Section */}
      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityFeed activities={activities.slice(0, 10)} />
          <NeedsAttention projects={projectsWithActivity} />
        </div>
      </section>

      {/* Projects Section */}
      <ProjectDashboard projects={projectsWithGithub} />
    </main>
  );
}
