import {
  addJournalEntry,
  archiveProject,
  refreshScreenshot,
} from "@/app/(dashboard)/actions";
import { fetchGithubActivity } from "@/lib/github";
import { getGithubOpenGraphUrl } from "@/lib/github";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JournalEntry, Milestone, Project, Task } from "@/lib/types";
import MilestoneList from "@/components/MilestoneList";
import JournalEntryCard from "@/components/JournalEntry";
import QuickActions from "@/components/QuickActions";
import ProjectStats from "@/components/ProjectStats";

type MilestoneWithTasks = Milestone & { tasks: Task[] };

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
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

  const github = project.github_repo
    ? await fetchGithubActivity(project.github_repo)
    : null;

  const typedProject = project as Project;
  const fallbackScreenshot = getGithubOpenGraphUrl(typedProject.github_repo);
  const screenshotUrl = typedProject.screenshot_url || fallbackScreenshot;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#7bdcff]">
            Project Overview
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{typedProject.name}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#8b8b8b]">
            {typedProject.description || "No description yet."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em]">
          <a
            href={`/project/${typedProject.id}/edit`}
            className="rounded-full border border-[#1c1c1c] px-4 py-2 transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
          >
            Edit
          </a>
          <form action={async () => archiveProject(typedProject.id)}>
            <button
              type="submit"
              className="rounded-full border border-[#2a2a2a] px-4 py-2 text-[#8b8b8b] transition hover:border-[#f4b26a] hover:text-[#f4b26a]"
            >
              Archive
            </button>
          </form>
          <a
            href="/"
            className="rounded-full border border-[#1c1c1c] px-4 py-2 transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
          >
            Back
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <QuickActions
          project={{
            id: typedProject.id,
            name: typedProject.name,
            description: typedProject.description,
            github_repo: typedProject.github_repo,
            live_url: typedProject.live_url,
            status: typedProject.status,
            priority: typedProject.priority,
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

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
          {screenshotUrl ? (
            <div className="overflow-hidden rounded-2xl border border-[#1c1c1c] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotUrl}
                alt={`${typedProject.name} screenshot`}
                className="h-64 w-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#1c1c1c] p-10 text-center text-sm text-[#8b8b8b]">
              No screenshot yet. Capture a fresh view from the live URL.
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {typedProject.live_url ? (
              <a
                href={typedProject.live_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#1c1c1c] px-4 py-2 text-xs uppercase tracking-[0.3em] transition hover:border-[#d2ff5a] hover:text-[#d2ff5a]"
              >
                Live site
              </a>
            ) : null}
            {typedProject.live_url ? (
              <form
                action={async () =>
                  refreshScreenshot(typedProject.id, typedProject.live_url || "")
                }
              >
                <button
                  type="submit"
                  className="rounded-full border border-[#1c1c1c] px-4 py-2 text-xs uppercase tracking-[0.3em] transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
                >
                  Refresh screenshot
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
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
              <p>Activity: {github.activityLabel}</p>
              <p>
                Latest commit: {github.lastCommitMessage || "No commits"}{" "}
                {github.lastCommitDate
                  ? `(${new Date(github.lastCommitDate).toLocaleDateString()})`
                  : ""}
              </p>
              <p>Open issues: {github.openIssues ?? "—"}</p>
              <p>CI status: {github.ciStatus}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#8b8b8b]">
              Add a GitHub repo to unlock real-time activity.
            </p>
          )}
          <div className="mt-6 grid gap-3 text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
            <div>Status: {typedProject.status}</div>
            <div>Priority: {typedProject.priority}</div>
            <div>
              Tags:{" "}
              {typedProject.tags && typedProject.tags.length
                ? typedProject.tags.join(", ")
                : "—"}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <MilestoneList milestones={milestones} projectId={typedProject.id} />

        <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
          <h3 className="text-lg font-semibold">Progress Journal</h3>
          <form
            action={async (formData) => addJournalEntry(typedProject.id, formData)}
            className="mt-4 grid gap-3"
          >
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Log progress, blockers, or insights..."
              className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3 text-sm"
            />
            <select
              name="entry_type"
              className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-2 text-sm"
            >
              <option value="note">Note</option>
              <option value="milestone">Milestone</option>
              <option value="commit">Commit</option>
            </select>
            <button
              type="submit"
              className="rounded-full border border-[#1c1c1c] px-4 py-2 text-xs uppercase tracking-[0.3em] transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
            >
              Add entry
            </button>
          </form>
          <div className="mt-6 space-y-4">
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
    </main>
  );
}
