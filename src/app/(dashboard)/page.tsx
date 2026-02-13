import dynamic from "next/dynamic";
import ProjectDashboard from "@/components/ProjectDashboard";
import { ActivityFeedSkeleton } from "@/components/SkeletonLoader";

const ActivityFeed = dynamic(() => import("@/components/ActivityFeed"), {
  loading: () => <ActivityFeedSkeleton />,
});
const NeedsAttention = dynamic(() => import("@/components/NeedsAttention"));
const SmartInsights = dynamic(() => import("@/components/SmartInsights"));
const ProjectTimeline = dynamic(() => import("@/components/ProjectTimeline"));
import { fetchGithubActivity } from "@/lib/github";
import { calculateProjectHealth, generateSmartInsights } from "@/lib/health";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project, Milestone } from "@/lib/types";
import { differenceInDays, subDays, eachDayOfInterval, startOfDay, isSameDay } from "date-fns";
import StatsRow from "@/components/StatsRow";

export const revalidate = 60;

export default async function DashboardPage() {
  let user = null;
  let projects: Project[] = [];
  let milestones: Array<Milestone & { projects: { name: string } | null }> = [];
  let journalData: Array<{ id: string; content: string; entry_type: string; created_at: string; projects: { id: string; name: string } | null }> = [];

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError) console.error("Auth error:", authError);
    user = authUser;

    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (projectsError) console.error("Projects fetch error:", projectsError);
    projects = (projectsData || []) as Project[];

    const { data: milestonesData, error: milestonesError } = await supabase
      .from("milestones")
      .select("*, projects(name)")
      .order("target_date", { ascending: true });
    if (milestonesError) console.error("Milestones fetch error:", milestonesError);
    milestones = (milestonesData || []) as Array<Milestone & { projects: { name: string } | null }>;

    const { data: journalResult, error: journalError } = await supabase
      .from("journal_entries")
      .select("*, projects(id, name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (journalError) console.error("Journal fetch error:", journalError);
    journalData = journalResult || [];
  } catch (err) {
    console.error("Database error:", err);
  }

  let projectsWithGithub: Array<Project & { github: any }> = [];
  try {
    projectsWithGithub = await Promise.all(
      projects.map(async (project) => {
        if (!project.github_repo) return { ...project, github: null };
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

  const projectsWithHealth = projectsWithGithub.map((p) => ({
    ...p,
    health: calculateProjectHealth(p),
  }));

  const projectsWithActivity = projectsWithHealth.map((p) => {
    const lastActivityDate = p.github?.lastCommitDate || p.updated_at;
    let daysSinceActivity = 0;
    try {
      daysSinceActivity = differenceInDays(new Date(), new Date(lastActivityDate));
    } catch {
      daysSinceActivity = 0;
    }
    return { ...p, lastActivity: lastActivityDate, daysSinceActivity };
  });

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

  const timelineEvents = activities.map((a) => ({
    id: a.id,
    projectId: a.projectId,
    projectName: a.projectName,
    type: a.type === "io_update" ? "journal" : a.type,
    message: a.message,
    timestamp: a.timestamp,
  }));

  const recentCommits = projectsWithGithub
    .filter((p) => p.github?.lastCommitMessage && p.github?.lastCommitDate)
    .map((p) => ({
      projectName: p.name,
      message: p.github!.lastCommitMessage!,
      date: p.github!.lastCommitDate!,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const insights = generateSmartInsights(projectsWithGithub, recentCommits);

  // Stats
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const totalMilestones = milestones.length;
  const avgHealthScore = projectsWithHealth
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + p.health.score, 0) / Math.max(activeProjects, 1);

  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);
  const weeklyActivityCount = activities.filter((a) => new Date(a.timestamp) >= weekAgo).length;
  const monthlyActivityCount = activities.filter((a) => new Date(a.timestamp) >= monthAgo).length;

  // Sparkline
  const sparklineDays = 14;
  const sparklineStart = subDays(now, sparklineDays - 1);
  const sparklineDateRange = eachDayOfInterval({ start: sparklineStart, end: now });
  const dailyActivityCounts = sparklineDateRange.map((day) => {
    const dayStart = startOfDay(day);
    return activities.filter((a) => isSameDay(startOfDay(new Date(a.timestamp)), dayStart)).length;
  });

  let streak = 0;
  for (let i = dailyActivityCounts.length - 1; i >= 0; i--) {
    if (dailyActivityCounts[i] > 0) streak++;
    else break;
  }

  // Determine greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  const name = user?.email ? user.email.split("@")[0] : "";

  // Hot projects (active in last 3 days)
  const hotCount = projectsWithActivity.filter(p => p.daysSinceActivity <= 3 && p.status === "active").length;
  // Stale projects (active but no activity in 7+ days)
  const staleCount = projectsWithActivity.filter(p => p.daysSinceActivity >= 7 && p.status === "active").length;

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.5em] text-[#555] mb-3 font-mono">
              {greeting}{name ? `, ${name}` : ""}
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              {hotCount > 0 ? (
                <>
                  <span className="text-[#d2ff5a]">{hotCount}</span> project{hotCount !== 1 ? "s" : ""} running hot
                  {staleCount > 0 && (
                    <span className="text-[#777] text-lg font-normal ml-3">
                      / {staleCount} going cold
                    </span>
                  )}
                </>
              ) : (
                <>
                  {activeProjects} active project{activeProjects !== 1 ? "s" : ""}
                  {staleCount > 0 && (
                    <span className="text-[#777] text-lg font-normal ml-3">
                      / {staleCount} need{staleCount === 1 ? "s" : ""} attention
                    </span>
                  )}
                </>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={undefined}
              className="hidden sm:flex items-center gap-2 border border-[#1a1a1a] px-3 py-2 text-xs text-[#555] hover:border-[#333] hover:text-[#999] transition"
            >
              <kbd className="text-[10px] text-[#444] font-mono">Cmd+K</kbd>
            </button>
            <a
              href="/project/new"
              className="bg-white px-4 py-2 text-sm font-medium text-black hover:bg-[#e8e8e8] transition"
            >
              New Project
            </a>
          </div>
        </div>

        {/* Stats */}
        <StatsRow
          projects={projects.length}
          activeProjects={activeProjects}
          totalMilestones={totalMilestones}
          completedMilestones={completedMilestones}
          avgHealthScore={avgHealthScore}
          activeThisWeek={projectsWithActivity.filter(p => p.daysSinceActivity <= 7 && p.status === "active").length}
          weeklyActivityCount={weeklyActivityCount}
          monthlyActivityCount={monthlyActivityCount}
          commitCount={commitActivities.filter(a => new Date(a.timestamp) >= monthAgo).length}
          streak={streak}
          sparklineData={dailyActivityCounts}
        />
      </section>

      {/* Projects first — the main event */}
      <ProjectDashboard projects={projectsWithHealth} />

      {/* Intelligence Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <SmartInsights insights={insights} />
          <ProjectTimeline events={timelineEvents.slice(0, 100)} days={14} />
        </div>
      </section>

      {/* Activity + Attention */}
      <section id="activity" className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 scroll-mt-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityFeed activities={activities.slice(0, 25)} showProjectFilter />
          <NeedsAttention projects={projectsWithActivity} />
        </div>
      </section>
    </main>
  );
}
