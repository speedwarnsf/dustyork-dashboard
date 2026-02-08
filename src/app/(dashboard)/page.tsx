import Link from "next/link";
import { Suspense } from "react";
import { motion } from "framer-motion";
import ProjectDashboard from "@/components/ProjectDashboard";
import ActivityFeed from "@/components/ActivityFeed";
import NeedsAttention from "@/components/NeedsAttention";
import SmartInsights from "@/components/SmartInsights";
import ProjectTimeline from "@/components/ProjectTimeline";
import { ProjectCardSkeleton, ActivityFeedSkeleton, StatCardSkeleton } from "@/components/SkeletonLoader";
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
    const { data: { user: authUser } } = await supabase.auth.getUser();
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
  const projectsWithGithub = await Promise.all(
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
      {/* Enhanced Hero Section */}
      <motion.section 
        className="mx-auto w-full max-w-7xl px-6 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <motion.p 
              className="text-xs uppercase tracking-[0.4em] text-[#7bdcff] mb-2 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="w-2 h-2 bg-[#7bdcff] rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Command Center
            </motion.p>
            <motion.h1 
              className="text-4xl font-semibold bg-gradient-to-r from-white to-[#8b8b8b] bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
            </motion.h1>
            <motion.p 
              className="mt-2 text-[#8b8b8b] max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Track your projects, monitor GitHub activity, and keep the momentum going.
              Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-[#1c1c1c] text-[#7bdcff] border border-[#333]">⌘K</kbd> to
              quickly navigate.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/project/new"
                className="rounded-xl bg-gradient-to-r from-[#7bdcff] to-[#d2ff5a] px-5 py-2.5 text-sm font-semibold text-black transition-all hover:shadow-lg hover:shadow-[#7bdcff]/25"
              >
                + New Project
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced Stats Row */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <motion.div 
            className="glass-strong rounded-2xl p-4 hover:shadow-lg hover:shadow-[#7bdcff]/10 transition-all"
            whileHover={{ scale: 1.02, y: -2 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Projects</p>
            <motion.p 
              className="text-3xl font-semibold mt-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              {projects.length}
            </motion.p>
            <p className="text-xs text-[#555] mt-1">{activeProjects} active</p>
          </motion.div>
          
          <motion.div 
            className="glass-strong rounded-2xl p-4 hover:shadow-lg hover:shadow-[#d2ff5a]/10 transition-all"
            whileHover={{ scale: 1.02, y: -2 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.75, duration: 0.3 }}
          >
            <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Milestones</p>
            <motion.p 
              className="text-3xl font-semibold mt-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, type: "spring" }}
            >
              {totalMilestones}
            </motion.p>
            <p className="text-xs text-[#555] mt-1">{completedMilestones} completed</p>
          </motion.div>
          
          <motion.div 
            className="glass-strong rounded-2xl p-4 hover:shadow-lg transition-all"
            whileHover={{ scale: 1.02, y: -2 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Avg Health</p>
            <motion.p 
              className="text-3xl font-semibold mt-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: "spring" }}
            >
              {Math.round(avgHealthScore)}
            </motion.p>
            <div className="mt-2 h-1 bg-[#1c1c1c] rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${
                  avgHealthScore >= 70 ? "bg-gradient-to-r from-green-400 to-green-300" : 
                  avgHealthScore >= 50 ? "bg-gradient-to-r from-yellow-400 to-yellow-300" : "bg-gradient-to-r from-red-400 to-red-300"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${avgHealthScore}%` }}
                transition={{ delay: 1, duration: 1, ease: "easeOut" }}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="glass-strong rounded-2xl p-4 hover:shadow-lg transition-all"
            whileHover={{ scale: 1.02, y: -2 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.85, duration: 0.3 }}
          >
            <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">This Week</p>
            <motion.p 
              className="text-3xl font-semibold mt-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.95, type: "spring" }}
            >
              {recentCommits.length}
            </motion.p>
            <p className="text-xs text-[#555] mt-1">commits</p>
          </motion.div>

          <motion.div 
            className="glass-strong rounded-2xl p-4 hover:shadow-lg transition-all"
            whileHover={{ scale: 1.02, y: -2 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            <p className="text-xs uppercase tracking-wider text-[#8b8b8b]">Today</p>
            <motion.p 
              className="text-lg font-semibold mt-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
            >
              {format(new Date(), "EEE, MMM d")}
            </motion.p>
            <p className="text-xs text-[#555] mt-1">{format(new Date(), "h:mm a")}</p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Insights + Timeline Section */}
      <motion.section 
        className="mx-auto w-full max-w-7xl px-6 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<div className="h-[400px] glass-strong rounded-3xl p-6"><StatCardSkeleton /></div>}>
            <SmartInsights insights={insights} />
          </Suspense>
          <Suspense fallback={<div className="h-[400px] glass-strong rounded-3xl p-6"><StatCardSkeleton /></div>}>
            <ProjectTimeline events={timelineEvents.slice(0, 100)} days={14} />
          </Suspense>
        </div>
      </motion.section>

      {/* Activity + Attention Section */}
      <motion.section 
        className="mx-auto w-full max-w-7xl px-6 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <ActivityFeed activities={activities.slice(0, 10)} />
          </Suspense>
          <Suspense fallback={<div className="h-[400px] glass-strong rounded-3xl p-6"><StatCardSkeleton /></div>}>
            <NeedsAttention projects={projectsWithActivity} />
          </Suspense>
        </div>
      </motion.section>

      {/* Enhanced Upcoming Milestones */}
      {upcomingMilestones.length > 0 && (
        <motion.section 
          className="mx-auto w-full max-w-7xl px-6 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
        >
          <motion.div 
            className="glass-strong rounded-3xl p-6"
            layout
          >
            <motion.div 
              className="flex items-center gap-2 mb-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 }}
            >
              <motion.span 
                className="text-xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
              >
                🎯
              </motion.span>
              <h3 className="text-lg font-semibold">Upcoming Milestones</h3>
              <span className="px-2 py-0.5 text-xs rounded-full bg-[#7bdcff]/20 text-[#7bdcff]">
                {upcomingMilestones.length}
              </span>
            </motion.div>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingMilestones.map((milestone, index) => (
                <motion.div 
                  key={milestone.id}
                  className="p-4 rounded-xl bg-[#111]/50 border border-[#1c1c1c] hover:border-[#333] transition-all hover:shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{milestone.name}</p>
                      <p className="text-xs text-[#7bdcff]">{milestone.projectName}</p>
                    </div>
                    {milestone.target_date && (
                      <span className="text-xs text-[#8b8b8b] whitespace-nowrap px-2 py-1 rounded-lg bg-[#1c1c1c]">
                        {format(new Date(milestone.target_date), "MMM d")}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3 h-2 bg-[#1c1c1c] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#7bdcff] to-[#d2ff5a] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${milestone.percent_complete}%` }}
                      transition={{ delay: 1.7 + index * 0.1, duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-[#666]">{milestone.percent_complete}% complete</p>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7bdcff]" />
                      <span className="text-xs text-[#7bdcff]">{milestone.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.section>
      )}

      {/* Enhanced Projects Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <Suspense 
          fallback={
            <div className="mx-auto w-full max-w-7xl px-6 py-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            </div>
          }
        >
          <ProjectDashboard projects={projectsWithHealth} />
        </Suspense>
      </motion.div>
    </main>
  );
}
