import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Goal, Project } from "@/lib/types";
import { differenceInDays, format } from "date-fns";
import Link from "next/link";

export const revalidate = 60;

export const metadata = {
  title: "Goals Overview",
};

export default async function GoalsPage() {
  const supabase = await createSupabaseServerClient();
  const now = new Date();

  const [goalsRes, projectsRes] = await Promise.all([
    supabase.from("project_goals").select("*, projects(id, name)").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name, status").order("name"),
  ]);

  const goals = (goalsRes.data || []) as Array<Goal & { projects: { id: string; name: string } | null }>;
  const projects = (projectsRes.data || []) as Pick<Project, "id" | "name" | "status">[];

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");
  const abandonedGoals = goals.filter(g => g.status === "abandoned");

  // Goals approaching deadline (within 14 days)
  const urgentGoals = activeGoals
    .filter(g => g.target_date && differenceInDays(new Date(g.target_date), now) <= 14 && differenceInDays(new Date(g.target_date), now) >= 0)
    .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime());

  const overdueGoals = activeGoals
    .filter(g => g.target_date && new Date(g.target_date) < now)
    .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime());

  // Stats
  const avgProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length)
    : 0;
  const completionRate = goals.length > 0
    ? Math.round((completedGoals.length / (completedGoals.length + abandonedGoals.length || 1)) * 100)
    : 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 pt-10 pb-16">
      {/* Header */}
      <header className="mb-8 border-b border-[#1a1a1a] pb-6">
        <p className="text-[11px] uppercase tracking-[0.5em] text-[#555] font-mono mb-2">
          Goals Overview
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          All Goals
        </h1>
        <div className="mt-4 flex gap-3">
          <Link
            href="/briefing"
            className="text-xs text-[#555] border border-[#1a1a1a] px-3 py-1.5 hover:border-[#7bdcff] hover:text-[#7bdcff] transition font-mono"
          >
            Briefing
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-[#555] border border-[#1a1a1a] px-3 py-1.5 hover:border-[#7bdcff] hover:text-[#7bdcff] transition font-mono"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border border-[#1a1a1a] p-4 bg-[#080808]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Active</p>
            <p className="text-2xl font-mono text-[#d2ff5a]">{activeGoals.length}</p>
          </div>
          <div className="border border-[#1a1a1a] p-4 bg-[#080808]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Avg Progress</p>
            <p className="text-2xl font-mono text-[#7bdcff]">{avgProgress}%</p>
          </div>
          <div className="border border-[#1a1a1a] p-4 bg-[#080808]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Completed</p>
            <p className="text-2xl font-mono text-green-400">{completedGoals.length}</p>
          </div>
          <div className="border border-[#1a1a1a] p-4 bg-[#080808]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Completion Rate</p>
            <p className="text-2xl font-mono text-[#ccc]">{completionRate}%</p>
          </div>
        </div>
      </section>

      {/* Overdue */}
      {overdueGoals.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-[0.3em] text-red-400 font-mono mb-3">
            Overdue
          </h2>
          <div className="space-y-2">
            {overdueGoals.map(goal => {
              const daysOverdue = differenceInDays(now, new Date(goal.target_date!));
              return (
                <Link
                  key={goal.id}
                  href={`/project/${goal.project_id}`}
                  className="border border-red-500/20 p-4 bg-[#080808] flex justify-between items-center hover:border-red-500/40 transition block"
                >
                  <div>
                    <p className="text-sm text-[#ccc]">{goal.title}</p>
                    <p className="text-[11px] text-[#555] font-mono mt-0.5">{goal.projects?.name || "Unknown"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-400 font-mono">{daysOverdue}d overdue</p>
                    <div className="mt-1 w-16 h-[2px] bg-[#1a1a1a] overflow-hidden">
                      <div className="h-full bg-red-400" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Approaching Deadlines */}
      {urgentGoals.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-[0.3em] text-yellow-400 font-mono mb-3">
            Approaching Deadline
          </h2>
          <div className="space-y-2">
            {urgentGoals.map(goal => {
              const daysLeft = differenceInDays(new Date(goal.target_date!), now);
              return (
                <Link
                  key={goal.id}
                  href={`/project/${goal.project_id}`}
                  className="border border-[#1a1a1a] p-4 bg-[#080808] flex justify-between items-center hover:border-[#333] transition block"
                >
                  <div>
                    <p className="text-sm text-[#ccc]">{goal.title}</p>
                    <p className="text-[11px] text-[#555] font-mono mt-0.5">{goal.projects?.name || "Unknown"}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-mono ${daysLeft <= 3 ? "text-orange-400" : "text-yellow-400"}`}>
                      {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`}
                    </p>
                    <div className="mt-1 w-16 h-[2px] bg-[#1a1a1a] overflow-hidden">
                      <div className="h-full bg-[#d2ff5a]" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* All Active Goals by Project */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-[0.3em] text-[#555] font-mono mb-3">
          Active Goals
        </h2>
        {activeGoals.length === 0 ? (
          <div className="border border-[#1a1a1a] p-6 bg-[#080808] text-center">
            <p className="text-sm text-[#555]">No active goals. Set goals on individual project pages.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeGoals.map(goal => {
              const daysLeft = goal.target_date ? differenceInDays(new Date(goal.target_date), now) : null;
              return (
                <Link
                  key={goal.id}
                  href={`/project/${goal.project_id}`}
                  className="border border-[#1a1a1a] p-4 bg-[#080808] hover:border-[#333] transition block"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#ccc]">{goal.title}</p>
                      <p className="text-[11px] text-[#555] font-mono mt-0.5">{goal.projects?.name || "Unknown"}</p>
                      {goal.description && (
                        <p className="text-[11px] text-[#444] mt-1 truncate">{goal.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {goal.target_date && (
                        <p className="text-[11px] font-mono text-[#555]">
                          {format(new Date(goal.target_date), "MMM d")}
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-[#444] mt-0.5">{goal.progress}%</p>
                    </div>
                  </div>
                  <div className="mt-2 h-[2px] bg-[#1a1a1a] overflow-hidden">
                    <div className="h-full bg-[#d2ff5a] transition-all" style={{ width: `${goal.progress}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-[0.3em] text-green-400/60 font-mono mb-3">
            Completed ({completedGoals.length})
          </h2>
          <div className="space-y-1">
            {completedGoals.map(goal => (
              <div key={goal.id} className="border border-[#1a1a1a] p-3 bg-[#080808] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border border-[#d2ff5a] bg-[#d2ff5a]/10 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-[#d2ff5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm text-[#555]">{goal.title}</span>
                    <span className="text-[11px] text-[#333] font-mono ml-2">{goal.projects?.name}</span>
                  </div>
                </div>
                {goal.completed_at && (
                  <span className="text-[10px] font-mono text-[#333]">
                    {format(new Date(goal.completed_at), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] pt-6 text-center">
        <p className="text-[11px] text-[#333] font-mono">
          {goals.length} total goal{goals.length !== 1 ? "s" : ""} across {new Set(goals.map(g => g.project_id)).size} project{new Set(goals.map(g => g.project_id)).size !== 1 ? "s" : ""}
        </p>
      </footer>
    </div>
  );
}
