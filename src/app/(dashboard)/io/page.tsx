import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateProjectHealth } from "@/lib/health";
import type { Project } from "@/lib/types";
import IoPanel from "@/components/IoPanel";

export const revalidate = 30;

export const metadata = {
  title: "Io Panel",
};

export default async function IoPage() {
  const supabase = await createSupabaseServerClient();

  const [projectsRes, alertsRes, journalRes] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("alerts").select("*").in("status", ["unread", "read"]).order("created_at", { ascending: false }).limit(50),
    supabase
      .from("journal_entries")
      .select("*, projects(name)")
      .contains("metadata", { source: "io" })
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  // Also get recent non-io journal for context
  const { data: allRecentJournal } = await supabase
    .from("journal_entries")
    .select("*, projects(name)")
    .order("created_at", { ascending: false })
    .limit(30);

  const projects = (projectsRes.data || []) as Project[];
  const alerts = alertsRes.data || [];
  const ioJournal = journalRes.data || [];
  const recentJournal = allRecentJournal || [];

  // Calculate portfolio health
  const activeProjects = projects.filter((p) => p.status === "active");
  const healthScores = activeProjects.map((p) => calculateProjectHealth(p).score);
  const avgHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : 0;

  const now = Date.now();
  const needsAttention = activeProjects.filter((p) => {
    const daysSinceUpdate = (now - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    const health = calculateProjectHealth(p);
    return daysSinceUpdate > 7 || health.score < 40;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
      <IoPanel
        ioJournal={ioJournal}
        recentJournal={recentJournal}
        alerts={alerts}
        projects={projects}
        portfolioHealth={avgHealth}
        needsAttention={needsAttention.map((p) => p.name)}
      />
    </div>
  );
}
