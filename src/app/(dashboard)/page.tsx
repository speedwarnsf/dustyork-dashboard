import Link from "next/link";
import ProjectDashboard from "@/components/ProjectDashboard";
import ActivityFeed from "@/components/ActivityFeed";
import NeedsAttention from "@/components/NeedsAttention";
import SmartInsights from "@/components/SmartInsights";
import ProjectTimeline from "@/components/ProjectTimeline";
import { fetchGithubActivity } from "@/lib/github";
import { calculateProjectHealth, generateSmartInsights } from "@/lib/health";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project, Milestone } from "@/lib/types";
import { differenceInDays, format } from "date-fns";

export const revalidate = 60; // Revalidate every minute

export default async function DashboardPage() {
  let user = null;
  let projects: Project[] = [];
  let milestones: Array<Milestone & { projects: { name: string } | null }> = [];
  let journalData: Array<{ id: string; content: string; entry_type: string; created_at: string; projects: { id: string; name: string } | null }> = [];

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Auth error:", authError);
    }
    user = authUser;

    // Fetch all projects
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (projectsError) {
      console.error("Projects fetch error:", projectsError);
    }
    projects = (projectsData || []) as Project[];

    // Fetch all milestones
    const { data: milestonesData, error: milestonesError } = await supabase
      .from("milestones")
      .select("*, projects(name)")
      .order("target_date", { ascending: true });

    if (milestonesError) {
      console.error("Milestones fetch error:", milestonesError);
    }
    milestones = (milestonesData || []) as Array<Milestone & { projects: { name: string } | null }>;

    // Fetch recent journal entries for activity feed
    const { data: journalResult, error: journalError } = await supabase
      .from("journal_entries")
      .select("*, projects(id, name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (journalError) {
      console.error("Journal fetch error:", journalError);
    }
    journalData = journalResult || [];
  } catch (err) {
    console.error("Database error:", err);
  }

  // Fetch GitHub activity for all projects (with error handling for each)
  let projectsWithGithub: Array<Project & { github: any }> = [];
  try {
    projectsWithGithub = await Promise.all(
      projects.map(async (project) => {
        if (!project.github_repo) {
          return { ...project, github: null };
        }
        try {
          const github = await fetchGithubActivity(project.github_repo);
          return { ...project, github };
        } catch (err) {
          console.error(`GitHub fetch error for ${project.name}:`, err);
          return { ...project, github: null };
        }
      })
    );
  } catch (err) {
    console.error("GitHub batch fetch error:", err);
    projectsWithGithub = projects.map(p => ({ ...p, github: null }));
  }

  // Calculate health scores for all projects
  const projectsWithHealth = projectsWithGithub.map((p) => ({
    ...p,
    health: calculateProjectHealth(p),
  }));

  // Add activity metadata to projects (with safe date handling)
  const projectsWithActivity = projectsWithHealth.map((p) => {
    const lastActivityDate = p.github?.lastCommitDate || p.updated_at;
    let daysSinceActivity = 0;
    try {
      daysSinceActivity = differenceInDays(new Date(), new Date(lastActivityDate));
    } catch {
      daysSinceActivity = 0;
    }
    return {
      ...p,
      lastActivity: lastActivityDate,
      daysSinceActivity,
    };
  });

  // Get upcoming milestones (not completed, with dates)
  const upcomingMilestones = milestones
    .filter((m) => m.status !== "completed" && m.target_date)
    .map((m) => ({
      ...m,
      projectName: m.projects?.name || "Unknown",
    }))
    .slice(0, 5);

  // Build activity feed
  type ActivityType = "commit" | "journal" | "milestone" | "status_change" | "io_update";
  
  const journalActivities = journalData.map((entry) => ({
    id: `journal-${entry.id}`,
    type: (entry.entry_type === "io_update" ? "io_update" : "journal") as ActivityType,
    projectName: entry.projects?.name || "Unknown",
    projectId: entry.projects?.id || "",
    message: (entry.content || "").slice(0, 100) + ((entry.content || "").length > 100 ? "..." : ""),
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

  // Build timeline events
  const timelineEvents = activities.map((a) => ({
    id: a.id,
    projectId: a.projectId,
    projectName: a.projectName,
    type: a.type === "io_update" ? "journal" : a.type,
    message: a.message,
    timestamp: a.timestamp,
  }));

  // Collect recent commits for insights
  const recentCommits = projectsWithGithub
    .filter((p) => p.github?.lastCommitMessage && p.github?.lastCommitDate)
    .map((p) => ({
      projectName: p.name,
      message: p.github!.lastCommitMessage!,
      date: p.github!.lastCommitDate!,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Generate smart insights
  const insights = generateSmartInsights(projectsWithGithub, recentCommits);

  // Calculate stats
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const totalMilestones = milestones.length;
  const avgHealthScore = projectsWithHealth
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + p.health.score, 0) / Math.max(activeProjects, 1);

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
            <Link
              href="/project/new"
              className="rounded-xl bg-[#7bdcff] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#a5ebff]"
            >
              + New Project
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
            <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Projects</p>
            <p className="text-3xl font-semibold mt-1">{projects.length}</p>
            <p className="text-xs text-[#555] mt-1">{activeProjects} active</p>
          </div>
          
          <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
            <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Milestones</p>
            <p className="text-3xl font-semibold mt-1">{totalMilestones}</p>
            <p className="text-xs text-[#555] mt-1">{completedMilestones} completed</p>
          </div>
          
          <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
            <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Avg Health</p>
            <p className="text-3xl font-semibold mt-1">{Math.round(avgHealthScore)}</p>
            <div className="mt-2 h-1 bg-[#1c1c1c] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  avgHealthScore >= 70 ? "bg-green-400" : 
                  avgHealthScore >= 50 ? "bg-yellow-400" : "bg-red-400"
                }`}
                style={{ width: `${avgHealthScore}%` }}
              />
            </div>
          </div>
          
          <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
            <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">This Week</p>
            <p className="text-3xl font-semibold mt-1">{recentCommits.length}</p>
            <p className="text-xs text-[#555] mt-1">commits</p>
          </div>

          <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
            <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Today</p>
            <p className="text-lg font-semibold mt-1">{format(new Date(), "EEE, MMM d")}</p>
            <p className="text-xs text-[#555] mt-1">{format(new Date(), "h:mm a")}</p>
          </div>
        </div>
      </section>

      {/* Insights + Timeline Section */}
      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SmartInsights insights={insights} />
          <ProjectTimeline events={timelineEvents.slice(0, 100)} days={14} />
        </div>
      </section>

      {/* Activity + Attention Section */}
      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityFeed activities={activities.slice(0, 10)} />
          <NeedsAttention projects={projectsWithActivity} />
        </div>
      </section>

      {/* Upcoming Milestones */}
      {upcomingMilestones.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-6 py-6">
          <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎯</span>
              <h3 className="text-lg font-semibold">Upcoming Milestones</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingMilestones.map((milestone) => (
                <div 
                  key={milestone.id}
                  className="p-4 rounded-xl bg-[#111] border border-[#1c1c1c]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{milestone.name}</p>
                      <p className="text-xs text-[#7bdcff]">{milestone.projectName}</p>
                    </div>
                    {milestone.target_date && (
                      <span className="text-xs text-[#8b8b8b] whitespace-nowrap">
                        {format(new Date(milestone.target_date), "MMM d")}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#7bdcff] to-[#d2ff5a]"
                      style={{ width: `${milestone.percent_complete}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#666] mt-2">{milestone.percent_complete}% complete</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Projects Section */}
      <ProjectDashboard projects={projectsWithHealth} />
    </main>
  );
}
