import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchGithubActivity, fetchDeployStatus } from "@/lib/github";
import { calculateProjectHealth } from "@/lib/health";
import type { Project, Milestone } from "@/lib/types";
import { differenceInDays, subHours, format } from "date-fns";
import Link from "next/link";

export const revalidate = 60;

export const metadata = {
  title: "Morning Briefing",
};

export default async function BriefingPage() {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const twentyFourHoursAgo = subHours(now, 24);
  const isoThreshold = twentyFourHoursAgo.toISOString();

  // Fetch data
  const [projectsRes, milestonesRes, journalRes] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("milestones").select("*, projects(name)").order("target_date", { ascending: true }),
    supabase.from("journal_entries").select("*, projects(id, name)").gte("created_at", isoThreshold).order("created_at", { ascending: false }),
  ]);

  const projects = (projectsRes.data || []) as Project[];
  const milestones = (milestonesRes.data || []) as Array<Milestone & { projects: { name: string } | null }>;
  const recentJournal = journalRes.data || [];

  // GitHub data for changed projects
  const changedProjects = projects.filter(p => new Date(p.updated_at) >= twentyFourHoursAgo);
  
  const projectsWithGithub = await Promise.all(
    projects.filter(p => p.status === "active").map(async (project) => {
      if (!project.github_repo) return { ...project, github: null, deployStatus: undefined };
      try {
        const [github, deployStatus] = await Promise.all([
          fetchGithubActivity(project.github_repo),
          fetchDeployStatus(project.github_repo),
        ]);
        return { ...project, github, deployStatus };
      } catch {
        return { ...project, github: null, deployStatus: undefined };
      }
    })
  );

  // Health scores
  const projectsWithHealth = projectsWithGithub.map(p => ({
    ...p,
    health: calculateProjectHealth(p),
    previousHealth: p.health_score ?? null,
  }));

  // Health changes
  const healthImproved = projectsWithHealth.filter(p => p.previousHealth !== null && p.health.score > (p.previousHealth ?? 0) + 3);
  const healthDegraded = projectsWithHealth.filter(p => p.previousHealth !== null && p.health.score < (p.previousHealth ?? 0) - 3);

  // Approaching milestones (within 7 days)
  const approachingMilestones = milestones.filter(m => {
    if (m.status === "completed" || !m.target_date) return false;
    const daysUntil = differenceInDays(new Date(m.target_date), now);
    return daysUntil >= 0 && daysUntil <= 7;
  });

  const overdueMilestones = milestones.filter(m => {
    if (m.status === "completed" || !m.target_date) return false;
    return new Date(m.target_date) < now;
  });

  // Recent commits (last 24h)
  const recentCommits = projectsWithGithub
    .filter(p => p.github?.lastCommitDate && new Date(p.github.lastCommitDate) >= twentyFourHoursAgo)
    .map(p => ({
      projectName: p.name,
      message: p.github!.lastCommitMessage || "",
      date: p.github!.lastCommitDate!,
      repo: p.github_repo,
    }));

  // Recent deploys
  const recentDeploys = projectsWithGithub
    .filter(p => p.deployStatus?.timestamp && new Date(p.deployStatus.timestamp) >= twentyFourHoursAgo)
    .map(p => ({
      projectName: p.name,
      status: p.deployStatus!.status,
      timestamp: p.deployStatus!.timestamp!,
      url: p.deployStatus!.url,
    }));

  // Stats
  const activeProjects = projects.filter(p => p.status === "active").length;
  const avgHealth = projectsWithHealth.length > 0
    ? Math.round(projectsWithHealth.reduce((s, p) => s + p.health.score, 0) / projectsWithHealth.length)
    : 0;

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = format(now, "EEEE, MMMM d, yyyy");

  const nothingHappened = changedProjects.length === 0 && recentJournal.length === 0 && recentCommits.length === 0;

  return (
    <main className="briefing-page">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 pt-10 pb-16">
        {/* Header */}
        <header className="mb-10 border-b border-[#1a1a1a] pb-8">
          <p className="text-[11px] uppercase tracking-[0.5em] text-[#555] font-mono mb-2">
            Daily Briefing
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
            {greeting}, Dustin.
          </h1>
          <p className="text-[#555] text-sm font-mono">{dateStr}</p>
          <div className="mt-4 flex gap-4">
            <Link
              href="/dashboard"
              className="text-xs text-[#555] border border-[#1a1a1a] px-3 py-1.5 hover:border-[#7bdcff] hover:text-[#7bdcff] transition font-mono"
            >
              Full Dashboard
            </Link>
          </div>
        </header>

        {/* Overnight Summary */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-[0.3em] text-[#555] font-mono mb-4">
            What happened overnight
          </h2>
          <div className="border border-[#1a1a1a] p-5 bg-[#080808]">
            {nothingHappened ? (
              <p className="text-[#555] text-sm">Quiet night. No project changes in the last 24 hours.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {changedProjects.length > 0 && (
                  <p className="text-[#ccc]">
                    <span className="text-[#d2ff5a] font-mono">{changedProjects.length}</span> project{changedProjects.length !== 1 ? "s" : ""} updated:
                    {" "}{changedProjects.map(p => p.name).join(", ")}
                  </p>
                )}
                {recentCommits.length > 0 && (
                  <p className="text-[#ccc]">
                    <span className="text-[#7bdcff] font-mono">{recentCommits.length}</span> commit{recentCommits.length !== 1 ? "s" : ""} pushed
                  </p>
                )}
                {recentDeploys.length > 0 && (
                  <p className="text-[#ccc]">
                    <span className="text-[#d2ff5a] font-mono">{recentDeploys.length}</span> deploy{recentDeploys.length !== 1 ? "s" : ""} triggered
                  </p>
                )}
                {recentJournal.length > 0 && (
                  <p className="text-[#ccc]">
                    <span className="text-[#7bdcff] font-mono">{recentJournal.length}</span> journal entr{recentJournal.length !== 1 ? "ies" : "y"} added
                  </p>
                )}
                {healthImproved.length > 0 && (
                  <p className="text-green-400">
                    Health improved: {healthImproved.map(p => p.name).join(", ")}
                  </p>
                )}
                {healthDegraded.length > 0 && (
                  <p className="text-orange-400">
                    Health degraded: {healthDegraded.map(p => p.name).join(", ")}
                  </p>
                )}
                {overdueMilestones.length > 0 && (
                  <p className="text-red-400">
                    {overdueMilestones.length} overdue milestone{overdueMilestones.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="mb-10">
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-[#1a1a1a] p-4 bg-[#080808]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Active Projects</p>
              <p className="text-2xl font-mono text-[#d2ff5a]">{activeProjects}</p>
            </div>
            <div className="border border-[#1a1a1a] p-4 bg-[#080808]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Avg Health</p>
              <p className={`text-2xl font-mono ${avgHealth >= 70 ? "text-green-400" : avgHealth >= 50 ? "text-yellow-400" : "text-orange-400"}`}>
                {avgHealth}
              </p>
            </div>
            <div className="border border-[#1a1a1a] p-4 bg-[#080808]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono mb-1">Changes (24h)</p>
              <p className="text-2xl font-mono text-[#7bdcff]">{changedProjects.length}</p>
            </div>
          </div>
        </section>

        {/* Overdue Milestones */}
        {overdueMilestones.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-[0.3em] text-red-400 font-mono mb-4">
              Overdue
            </h2>
            <div className="space-y-2">
              {overdueMilestones.map((m: any) => (
                <div key={m.id} className="border border-red-500/20 p-4 bg-[#080808] flex justify-between items-center">
                  <div>
                    <p className="text-sm text-[#ccc]">{m.name}</p>
                    <p className="text-[11px] text-[#555] font-mono">{m.projects?.name || "Unknown"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-400 font-mono">
                      {differenceInDays(now, new Date(m.target_date))}d overdue
                    </p>
                    <p className="text-[10px] text-[#555] font-mono">{m.percent_complete}% done</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Approaching Deadlines */}
        {approachingMilestones.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-[0.3em] text-yellow-400 font-mono mb-4">
              Approaching Deadlines
            </h2>
            <div className="space-y-2">
              {approachingMilestones.map((m: any) => {
                const daysUntil = differenceInDays(new Date(m.target_date), now);
                return (
                  <div key={m.id} className="border border-[#1a1a1a] p-4 bg-[#080808] flex justify-between items-center">
                    <div>
                      <p className="text-sm text-[#ccc]">{m.name}</p>
                      <p className="text-[11px] text-[#555] font-mono">{m.projects?.name || "Unknown"}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-mono ${daysUntil <= 2 ? "text-orange-400" : "text-yellow-400"}`}>
                        {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d left`}
                      </p>
                      <p className="text-[10px] text-[#555] font-mono">{m.percent_complete}% done</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Commits */}
        {recentCommits.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-[0.3em] text-[#555] font-mono mb-4">
              Commits (last 24h)
            </h2>
            <div className="space-y-2">
              {recentCommits.map((c, i) => (
                <div key={i} className="border border-[#1a1a1a] p-4 bg-[#080808]">
                  <p className="text-sm text-[#ccc] font-mono">{c.message}</p>
                  <p className="text-[11px] text-[#555] font-mono mt-1">{c.projectName}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Deploys */}
        {recentDeploys.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-[0.3em] text-[#555] font-mono mb-4">
              Deploys (last 24h)
            </h2>
            <div className="space-y-2">
              {recentDeploys.map((d, i) => (
                <div key={i} className="border border-[#1a1a1a] p-4 bg-[#080808] flex justify-between items-center">
                  <p className="text-sm text-[#ccc]">{d.projectName}</p>
                  <span className={`text-xs font-mono ${d.status === "success" ? "text-green-400" : d.status === "failed" ? "text-red-400" : "text-yellow-400"}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Health Changes */}
        {(healthImproved.length > 0 || healthDegraded.length > 0) && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-[0.3em] text-[#555] font-mono mb-4">
              Health Score Changes
            </h2>
            <div className="space-y-2">
              {healthImproved.map(p => (
                <div key={p.id} className="border border-[#1a1a1a] p-4 bg-[#080808] flex justify-between items-center">
                  <p className="text-sm text-[#ccc]">{p.name}</p>
                  <span className="text-xs font-mono text-green-400">
                    {p.previousHealth} &rarr; {p.health.score} (improved)
                  </span>
                </div>
              ))}
              {healthDegraded.map(p => (
                <div key={p.id} className="border border-[#1a1a1a] p-4 bg-[#080808] flex justify-between items-center">
                  <p className="text-sm text-[#ccc]">{p.name}</p>
                  <span className="text-xs font-mono text-orange-400">
                    {p.previousHealth} &rarr; {p.health.score} (degraded)
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Journal Entries */}
        {recentJournal.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-[0.3em] text-[#555] font-mono mb-4">
              Journal Entries (last 24h)
            </h2>
            <div className="space-y-3">
              {recentJournal.map((entry: any) => (
                <div key={entry.id} className="border border-[#1a1a1a] p-4 bg-[#080808]">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[11px] text-[#555] font-mono">{entry.projects?.name || "Unknown"}</p>
                    <span className="text-[10px] text-[#333] font-mono">
                      {format(new Date(entry.created_at), "h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Active Projects Overview */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-[0.3em] text-[#555] font-mono mb-4">
            Active Projects
          </h2>
          <div className="space-y-1">
            {projectsWithHealth
              .sort((a, b) => b.health.score - a.health.score)
              .map(p => (
                <Link
                  key={p.id}
                  href={`/project/${p.id}`}
                  className="border border-[#1a1a1a] p-3 bg-[#080808] flex justify-between items-center hover:border-[#333] transition block"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 ${
                      p.health.score >= 80 ? "bg-green-400" :
                      p.health.score >= 60 ? "bg-cyan-400" :
                      p.health.score >= 40 ? "bg-yellow-400" : "bg-orange-400"
                    }`} />
                    <span className="text-sm text-[#ccc]">{p.name}</span>
                  </div>
                  <span className="text-xs font-mono text-[#555]">{p.health.score}</span>
                </Link>
              ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1a1a1a] pt-6 text-center">
          <p className="text-[11px] text-[#333] font-mono">
            Generated {format(now, "h:mm a")} -- <Link href="/dashboard" className="hover:text-[#555] transition">Open Full Dashboard</Link>
          </p>
        </footer>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .briefing-page { color: black !important; }
          .briefing-page * { border-color: #ddd !important; background: white !important; color: black !important; }
          .briefing-page header, .briefing-page footer { break-after: avoid; }
          .briefing-page section { break-inside: avoid; }
          .briefing-page a { text-decoration: none !important; }
          nav, .sticky, [class*="hover:"] { display: none !important; }
          header.sticky { display: none !important; }
          footer.border-t:last-of-type { display: none !important; }
        }
      `}</style>
    </main>
  );
}
