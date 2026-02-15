import Image from "next/image";
import Link from "next/link";
import {
  addJournalEntry,
  archiveProject,
  refreshScreenshot,
} from "@/app/(dashboard)/actions";
import { fetchGithubActivity } from "@/lib/github";
import { getGithubOpenGraphUrl } from "@/lib/github";
import { calculateProjectHealth } from "@/lib/health";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JournalEntry, Milestone, Project, Task } from "@/lib/types";
import MilestoneList from "@/components/MilestoneList";
import MilestoneTimeline from "@/components/MilestoneTimeline";
import RecentCommits from "@/components/RecentCommits";
import JournalEntryCard from "@/components/JournalEntry";
import CommandCenter from "@/components/CommandCenter";
import ProjectStats from "@/components/ProjectStats";
import HealthScore from "@/components/HealthScore";
import LaunchChecklist from "@/components/LaunchChecklist";
import LaunchAnnouncement from "@/components/LaunchAnnouncement";
import { fetchRecentCommits } from "@/lib/github";
import { differenceInDays } from "date-fns";

type MilestoneWithTasks = Milestone & { tasks: Task[] };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-white">
        Project not found.
      </div>
    );
  }

  const { data: milestonesData } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  const milestoneIds = (milestonesData || []).map((milestone) => milestone.id);
  const { data: tasksData } = milestoneIds.length
    ? await supabase
        .from("tasks")
        .select("*")
        .in("milestone_id", milestoneIds)
        .order("sort_order", { ascending: true })
    : { data: [] as Task[] };

  const milestoneMap = new Map<string, MilestoneWithTasks>();
  (milestonesData || []).forEach((milestone) => {
    milestoneMap.set(milestone.id, { ...(milestone as Milestone), tasks: [] });
  });
  (tasksData || []).forEach((task) => {
    const milestone = milestoneMap.get(task.milestone_id);
    if (milestone) {
      milestone.tasks.push(task as Task);
    }
  });

  const milestones = Array.from(milestoneMap.values());

  const { data: journalData } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const [github, recentCommits] = await Promise.all([
    project.github_repo ? fetchGithubActivity(project.github_repo) : null,
    project.github_repo ? fetchRecentCommits(project.github_repo, 15) : [],
  ]);

  const typedProject = project as Project;
  const fallbackScreenshot = getGithubOpenGraphUrl(typedProject.github_repo);
  const screenshotUrl = typedProject.screenshot_url || fallbackScreenshot;

  // Calculate project health
  const health = calculateProjectHealth({ ...typedProject, github });

  // Days since last activity
  const lastActivityDate = github?.lastCommitDate || typedProject.updated_at;
  const daysSinceActivity = differenceInDays(new Date(), new Date(lastActivityDate));

  // Milestone progress
  const completedMilestoneCount = milestones.filter(m => m.status === "completed").length;
  const milestoneProgressPct = milestones.length > 0 ? Math.round((completedMilestoneCount / milestones.length) * 100) : 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-xs uppercase tracking-[0.4em] text-[#7bdcff]">
              Project Overview
            </p>
            {typedProject.launched && (
              <span className="px-2 py-0.5 rounded-none text-xs font-medium bg-[#d2ff5a] text-black">
                Launched
              </span>
            )}
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-semibold">{typedProject.name}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#8b8b8b]">
            {typedProject.description || "No description yet."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Health Score Badge */}
          <div className="hidden sm:block">
            <HealthScore health={health} size="sm" />
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs uppercase tracking-[0.3em]">
            <Link
              href={`/project/${typedProject.id}/edit`}
              className="rounded-none border border-[#1c1c1c] px-4 py-2.5 sm:py-2 transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
            >
              Edit
            </Link>
            <form action={archiveProject.bind(null, typedProject.id)}>
              <button
                type="submit"
                className="rounded-none border border-[#2a2a2a] px-4 py-2.5 sm:py-2 text-[#8b8b8b] transition hover:border-[#f4b26a] hover:text-[#f4b26a]"
              >
                Archive
              </button>
            </form>
            <Link
              href="/"
              className="rounded-none border border-[#1c1c1c] px-4 py-2.5 sm:py-2 transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
        <div className="bg-[#080808] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Health</p>
          <p className={`text-xl font-semibold tabular-nums ${
            health.score >= 70 ? "text-green-400" : health.score >= 50 ? "text-yellow-400" : "text-red-400"
          }`}>{health.score}</p>
          <p className="text-[10px] text-[#444] mt-1">{health.status}</p>
        </div>
        <div className="bg-[#080808] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Last Activity</p>
          <p className={`text-xl font-semibold tabular-nums ${
            daysSinceActivity <= 3 ? "text-green-400" : daysSinceActivity <= 7 ? "text-yellow-400" : "text-orange-400"
          }`}>{daysSinceActivity}<span className="text-sm text-[#444] font-normal ml-1">d ago</span></p>
          <p className="text-[10px] text-[#444] mt-1">{daysSinceActivity <= 1 ? "Active today" : daysSinceActivity <= 7 ? "This week" : "Getting stale"}</p>
        </div>
        <div className="bg-[#080808] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Milestones</p>
          <p className="text-xl font-semibold tabular-nums">{completedMilestoneCount}<span className="text-sm text-[#444] font-normal">/{milestones.length}</span></p>
          <div className="mt-2 h-[2px] bg-[#1a1a1a] overflow-hidden">
            <div className="h-full bg-[#d2ff5a]" style={{ width: `${milestoneProgressPct}%` }} />
          </div>
        </div>
        <div className="bg-[#080808] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Journal</p>
          <p className="text-xl font-semibold tabular-nums">{(journalData || []).length}</p>
          <p className="text-[10px] text-[#444] mt-1">entries logged</p>
        </div>
      </div>

      {/* Top Alert */}
      {health.alerts.length > 0 && typedProject.status === "active" && (
        <div className="mt-4 border border-orange-500/20 bg-orange-500/5 px-5 py-3">
          <p className="text-xs text-orange-400 font-medium mb-1">Attention needed</p>
          <ul className="text-xs text-[#888] space-y-1">
            {health.alerts.map((alert, i) => (
              <li key={i}>-- {alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Command Center */}
      <div className="mt-6">
        <CommandCenter
          project={{
            id: typedProject.id,
            name: typedProject.name,
            description: typedProject.description,
            github_repo: typedProject.github_repo,
            live_url: typedProject.live_url,
            status: typedProject.status,
          }}
          milestones={milestones.map((m) => ({
            name: m.name,
            status: m.status,
            percent_complete: m.percent_complete,
          }))}
          recentJournalEntries={(journalData || []).slice(0, 5).map((j) => ({
            content: j.content,
            entry_type: j.entry_type,
            created_at: j.created_at,
          }))}
        />
      </div>

      {/* Project Stats */}
      <div className="mt-6">
        <ProjectStats
          milestoneCount={milestones.length}
          completedMilestones={milestones.filter((m) => m.status === "completed").length}
          journalEntryCount={(journalData || []).length}
          lastUpdated={typedProject.updated_at}
        />
      </div>

      {/* Screenshot + GitHub + Health Section */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
          {screenshotUrl ? (
            <div className="overflow-hidden rounded-none border border-[#1c1c1c] bg-black">
              <Image
                src={screenshotUrl}
                alt={`${typedProject.name} screenshot`}
                width={800}
                height={256}
                className="h-64 w-full object-cover"
                unoptimized={screenshotUrl.startsWith("http")}
              />
            </div>
          ) : (
            <div className="rounded-none border border-dashed border-[#1c1c1c] p-10 text-center text-sm text-[#8b8b8b]">
              No screenshot yet. Capture a fresh view from the live URL.
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {typedProject.live_url ? (
              <a
                href={typedProject.live_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-none border border-[#1c1c1c] px-4 py-2 text-xs uppercase tracking-[0.3em] transition hover:border-[#d2ff5a] hover:text-[#d2ff5a]"
              >
                Live site
              </a>
            ) : null}
            {typedProject.live_url ? (
              <form
                action={refreshScreenshot.bind(null, typedProject.id, typedProject.live_url)}
              >
                <button
                  type="submit"
                  className="rounded-none border border-[#1c1c1c] px-4 py-2 text-xs uppercase tracking-[0.3em] transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
                >
                  Refresh screenshot
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          {/* Health Score Panel */}
          <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
            <h3 className="text-lg font-semibold mb-4">Project Health</h3>
            <HealthScore health={health} size="md" showFactors />
          </div>

          {/* GitHub Intelligence */}
          <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
            <h3 className="text-lg font-semibold">GitHub Intelligence</h3>
            {github ? (
              <div className="mt-4 space-y-3 text-sm text-[#8b8b8b]">
                <p>
                  Repo:{" "}
                  <a
                    href={github.repoUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white underline decoration-[#7bdcff]"
                  >
                    {typedProject.github_repo}
                  </a>
                </p>
                <div className="flex items-center gap-2">
                  <span>Activity:</span>
                  <span className={`px-2 py-0.5 rounded-none text-xs ${
                    github.activityLabel === "Hot" ? "bg-green-500/10 text-green-400" :
                    github.activityLabel === "Warm" ? "bg-yellow-500/10 text-yellow-400" :
                    github.activityLabel === "Cold" ? "bg-blue-500/10 text-blue-400" :
                    "bg-[#1c1c1c] text-[#666]"
                  }`}>
                    {github.activityLabel}
                  </span>
                </div>
                <p>
                  Latest: {github.lastCommitMessage || "No commits"}{" "}
                </p>
                <p>Open issues: {github.openIssues ?? "—"}</p>
                <div className="flex items-center gap-2">
                  <span>CI:</span>
                  <span className={`px-2 py-0.5 rounded-none text-xs ${
                    github.ciStatus === "success" ? "bg-green-500/10 text-green-400" :
                    github.ciStatus === "failure" ? "bg-red-500/10 text-red-400" :
                    "bg-[#1c1c1c] text-[#666]"
                  }`}>
                    {github.ciStatus}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#8b8b8b]">
                Add a GitHub repo to unlock real-time activity.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Launch Readiness Section */}
      {typedProject.status === "active" && (
        <section className="mt-8">
          <LaunchChecklist
            projectId={typedProject.id}
            liveUrl={typedProject.live_url}
          />
        </section>
      )}

      {/* Timeline + Commits Section */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <MilestoneTimeline milestones={milestones} />
        <RecentCommits
          commits={recentCommits || []}
          repoUrl={github?.repoUrl || null}
        />
      </section>

      {/* Milestones + Journal Section */}
      <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <MilestoneList milestones={milestones} projectId={typedProject.id} />

        <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
          <h3 className="text-lg font-semibold">Progress Journal</h3>
          <form
            action={addJournalEntry.bind(null, typedProject.id)}
            className="mt-4 grid gap-3"
          >
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Log progress, blockers, or insights..."
              aria-label="Journal entry content"
              className="rounded-none border border-[#1c1c1c] bg-black px-4 py-3 text-sm focus:outline-none focus:border-[#7bdcff]"
            />
            <select
              name="entry_type"
              aria-label="Entry type"
              className="rounded-none border border-[#1c1c1c] bg-black px-4 py-2 text-sm"
            >
              <option value="note">Note</option>
              <option value="milestone">Milestone</option>
              <option value="commit">Commit</option>
            </select>
            <button
              type="submit"
              className="rounded-none border border-[#1c1c1c] px-4 py-2 text-xs uppercase tracking-[0.3em] transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
            >
              Add entry
            </button>
          </form>
          <div className="mt-6 space-y-4 max-h-[500px] overflow-y-auto">
            {(journalData || []).map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry as JournalEntry}
                projectId={typedProject.id}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Launch Announcement Section */}
      {typedProject.status === "active" && typedProject.live_url && (
        <section className="mt-10">
          <LaunchAnnouncement
            project={{
              id: typedProject.id,
              name: typedProject.name,
              description: typedProject.description,
              live_url: typedProject.live_url,
              tags: typedProject.tags,
            }}
          />
        </section>
      )}

      {/* Project Meta */}
      <section className="mt-10">
        <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
          <h3 className="text-lg font-semibold mb-4">Project Details</h3>
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#666] mb-1">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded-none text-xs capitalize ${
                typedProject.status === "active" ? "bg-green-500/10 text-green-400" :
                typedProject.status === "paused" ? "bg-yellow-500/10 text-yellow-400" :
                typedProject.status === "completed" ? "bg-blue-500/10 text-blue-400" :
                "bg-[#1c1c1c] text-[#666]"
              }`}>
                {typedProject.status}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#666] mb-1">Priority</p>
              <span className={`inline-block px-2 py-0.5 rounded-none text-xs capitalize ${
                typedProject.priority === "high" ? "bg-red-500/10 text-red-400" :
                typedProject.priority === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                "bg-green-500/10 text-green-400"
              }`}>
                {typedProject.priority}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#666] mb-1">Tags</p>
              <div className="flex flex-wrap gap-1">
                {typedProject.tags && typedProject.tags.length ? (
                  typedProject.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-none text-xs bg-[#1c1c1c] text-[#8b8b8b]">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-[#666]">No tags</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
