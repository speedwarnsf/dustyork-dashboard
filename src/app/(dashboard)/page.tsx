import dynamic from "next/dynamic";
import ProjectDashboard from "@/components/ProjectDashboard";
import { ActivityFeedSkeleton } from "@/components/SkeletonLoader";

const ActivityFeed = dynamic(() => import("@/components/ActivityFeed"), {
  loading: () => <ActivityFeedSkeleton />,
});
const NeedsAttention = dynamic(() => import("@/components/NeedsAttention"));
const SmartInsights = dynamic(() => import("@/components/SmartInsights"));
const ActivityTimeline = dynamic(() => import("@/components/ActivityTimeline"));
import { fetchGithubActivity, fetchCommitActivitySparkline, fetchDeployStatus } from "@/lib/github";
import { calculateProjectHealth, generateSmartInsights } from "@/lib/health";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project, Milestone } from "@/lib/types";
import { differenceInDays, subDays, eachDayOfInterval, startOfDay, isSameDay } from "date-fns";
import StatsRow from "@/components/StatsRow";
import ProjectPulse from "@/components/ProjectPulse";
import RecentActivity from "@/components/RecentActivity";
import MobileSearchButton from "@/components/MobileSearchButton";
import FocusSuggestion from "@/components/FocusSuggestion";

const UnifiedTimeline = dynamic(() => import("@/components/UnifiedTimeline"));
const WeeklyDigest = dynamic(() => import("@/components/WeeklyDigest"));
const GanttMilestones = dynamic(() => import("@/components/GanttMilestones"));
const BulkJournalEntry = dynamic(() => import("@/components/BulkJournalEntry"));
const ProjectComparison = dynamic(() => import("@/components/ProjectComparison"));
const GlobalSearch = dynamic(() => import("@/components/GlobalSearch"));
const CustomizableDashboardLayout = dynamic(() => import("@/components/DashboardLayout"));
const QuickActions = dynamic(() => import("@/components/QuickActions"));
const DataExport = dynamic(() => import("@/components/DataExport"));

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

  let projectsWithGithub: Array<Project & { github: any; sparklineData?: number[]; deployStatus?: { status: string; timestamp: string | null; url: string | null } }> = [];
  try {
    projectsWithGithub = await Promise.all(
      projects.map(async (project) => {
        if (!project.github_repo) return { ...project, github: null, sparklineData: [], deployStatus: undefined };
        try {
          const [github, sparklineData, deployStatus] = await Promise.all([
            fetchGithubActivity(project.github_repo),
            fetchCommitActivitySparkline(project.github_repo, 30),
            fetchDeployStatus(project.github_repo),
          ]);
          return { ...project, github, sparklineData, deployStatus };
        } catch (err) {
          console.error(`GitHub fetch error for ${project.name}:`, err);
          return { ...project, github: null, sparklineData: [], deployStatus: undefined };
        }
      })
    );
  } catch (err) {
    console.error("GitHub batch fetch error:", err);
    projectsWithGithub = projects.map(p => ({ ...p, github: null, sparklineData: [], deployStatus: undefined }));
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

  // Project Pulse data
  const milestonesInProgress = milestones.filter((m) => m.status === "in_progress").length;
  const journalEntriesThisWeek = journalData.filter((j) => new Date(j.created_at) >= weekAgo).length;

  // Status breakdown for Pulse
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const pausedProjects = projects.filter((p) => p.status === "paused").length;
  const archivedProjects = projects.filter((p) => p.status === "archived").length;

  // Last deployed timestamps per project (from io_update journal entries or updated_at)
  const lastDeployedMap: Record<string, string> = {};
  for (const entry of journalData) {
    if (entry.entry_type === "io_update" && entry.projects?.id && !lastDeployedMap[entry.projects.id]) {
      lastDeployedMap[entry.projects.id] = entry.created_at;
    }
  }

  // Recent Activity entries (last 10 journal entries)
  const recentEntries = journalData.slice(0, 10).map((entry) => ({
    id: entry.id,
    content: entry.content,
    entry_type: entry.entry_type,
    created_at: entry.created_at,
    projectName: entry.projects?.name || "Unknown",
    projectId: entry.projects?.id || "",
  }));

  // Health trend: compare current health to stored health_score (previous snapshot)
  const projectsWithTrend = projectsWithHealth.map((p) => {
    const previousScore = p.health_score ?? null;
    const currentScore = p.health.score;
    let trend: "up" | "down" | "stable" = "stable";
    if (previousScore !== null && previousScore !== undefined) {
      if (currentScore > previousScore + 3) trend = "up";
      else if (currentScore < previousScore - 3) trend = "down";
    }
    const lastDeployed = lastDeployedMap[p.id] || null;
    return { ...p, healthTrend: trend, lastDeployed, sparklineData: p.sparklineData || [], deployStatus: p.deployStatus };
  });

  // Build global search items
  const searchItems = [
    ...journalData.map((entry) => ({
      id: `j-${entry.id}`,
      type: "journal" as const,
      title: (entry.content || "").slice(0, 80),
      snippet: entry.content || "",
      projectName: entry.projects?.name || "Unknown",
      projectId: entry.projects?.id || "",
      date: entry.created_at,
    })),
    ...milestones.map((m) => ({
      id: `m-${m.id}`,
      type: "milestone" as const,
      title: m.name,
      snippet: m.description || `${m.percent_complete}% complete`,
      projectName: m.projects?.name || "Unknown",
      projectId: m.project_id,
      date: m.updated_at,
    })),
    ...projects.map((p) => ({
      id: `p-${p.id}`,
      type: "project" as const,
      title: p.name,
      snippet: p.description || "",
      projectName: p.name,
      projectId: p.id,
      date: p.updated_at,
    })),
  ];

  return (
    <main>
      {/* Global Search (Cmd+Shift+F) */}
      <GlobalSearch items={searchItems} />

      {/* Quick Actions FAB */}
      <QuickActions />

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
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
                      / <span className="text-orange-400">{staleCount}</span> need attention
                    </span>
                  )}
                </>
              ) : (
                <>
                  {activeProjects} active project{activeProjects !== 1 ? "s" : ""}
                  {staleCount > 0 && (
                    <span className="text-[#777] text-lg font-normal ml-3">
                      / <span className="text-orange-400">{staleCount}</span> need{staleCount === 1 ? "s" : ""} attention
                    </span>
                  )}
                </>
              )}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-[#666]">
              <div className="flex items-center gap-2">
                <span>Avg Health:</span>
                <span className={`font-mono ${
                  avgHealthScore >= 80 ? "text-green-400" :
                  avgHealthScore >= 60 ? "text-cyan-400" :
                  avgHealthScore >= 40 ? "text-yellow-400" : "text-orange-400"
                }`}>
                  {Math.round(avgHealthScore)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Activity Streak:</span>
                <span className={`font-mono ${streak >= 5 ? "text-green-400" : streak >= 2 ? "text-cyan-400" : "text-[#666]"}`}>
                  {streak} day{streak !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <MobileSearchButton />
            <DataExport />
            <a
              href="/analytics"
              className="border border-[#1a1a1a] px-4 py-2 text-sm font-medium text-[#666] hover:border-[#7bdcff] hover:text-[#7bdcff] transition"
            >
              Analytics
            </a>
            <a
              href="/project/new"
              className="bg-white px-4 py-2 text-sm font-medium text-black hover:bg-[#e8e8e8] transition"
            >
              New Project
            </a>
          </div>
        </div>
      </section>

      <CustomizableDashboardLayout>
        {{
          pulse: (
            <section className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 pb-4">
              <div className="mb-6">
                <ProjectPulse
                  activeProjects={activeProjects}
                  completedProjects={completedProjects}
                  pausedProjects={pausedProjects}
                  archivedProjects={archivedProjects}
                  totalProjects={projects.length}
                  milestonesInProgress={milestonesInProgress}
                  journalEntriesThisWeek={journalEntriesThisWeek}
                />
              </div>
            </section>
          ),
          focus: (
            <section className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 pb-4">
              <div className="mb-6">
                <FocusSuggestion projects={projectsWithActivity} />
              </div>
            </section>
          ),
          stats: (
            <section className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 pb-4">
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
          ),
          comparison: (
            <section className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 py-4">
              <ProjectComparison projects={projectsWithTrend} />
            </section>
          ),
          projects: (
            <ProjectDashboard projects={projectsWithTrend} />
          ),
          intelligence: (
            <section className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 py-6 sm:py-8">
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <SmartInsights insights={insights} />
                <ActivityTimeline events={timelineEvents.slice(0, 100)} days={14} showProjectFilter />
              </div>
            </section>
          ),
          "digest-gantt": (
            <section className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 py-4 sm:py-6">
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <WeeklyDigest
                  activities={activities}
                  totalProjects={projects.length}
                  activeProjects={activeProjects}
                />
                <GanttMilestones
                  milestones={milestones.map(m => ({
                    ...m,
                    projectName: m.projects?.name || undefined,
                  }))}
                />
              </div>
            </section>
          ),
          timeline: (
            <section className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 py-4 sm:py-6">
              <UnifiedTimeline
                entries={timelineEvents}
                projectNames={Array.from(new Set(timelineEvents.map(e => e.projectName))).sort()}
              />
            </section>
          ),
          recent: (
            <section className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 py-4 sm:py-6">
              <RecentActivity entries={recentEntries} />
            </section>
          ),
          "bulk-journal": (
            <section className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 py-4 sm:py-6" data-bulk-journal>
              <BulkJournalEntry projects={projects.map(p => ({ id: p.id, name: p.name }))} />
            </section>
          ),
          "activity-attention": (
            <section id="activity" className="mx-auto w-full max-w-7xl mobile-px px-4 sm:px-6 py-4 sm:py-6 scroll-mt-24">
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <ActivityFeed activities={activities.slice(0, 25)} showProjectFilter />
                <NeedsAttention projects={projectsWithActivity} />
              </div>
            </section>
          ),
        }}
      </CustomizableDashboardLayout>
    </main>
  );
}
