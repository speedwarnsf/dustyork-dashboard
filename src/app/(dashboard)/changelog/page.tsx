import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChangelogClient from "./ChangelogClient";

export const metadata = {
  title: "What's New | Command Center",
};

export default async function ChangelogPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch last 30 days of journal entries grouped by date/project
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, content, entry_type, created_at, project_id, projects(id, name, status)")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  // Group by date then project
  const grouped: Record<string, Record<string, {
    projectId: string;
    projectName: string;
    projectStatus: string;
    entries: { id: string; content: string; type: string; created_at: string }[];
  }>> = {};

  for (const entry of entries || []) {
    const date = new Date(entry.created_at).toISOString().split("T")[0];
    const project = entry.projects as unknown as { id: string; name: string; status: string } | null;
    const projectName = project?.name || "General";
    const projectId = project?.id || "general";

    if (!grouped[date]) grouped[date] = {};
    if (!grouped[date][projectName]) {
      grouped[date][projectName] = {
        projectId,
        projectName,
        projectStatus: project?.status || "unknown",
        entries: [],
      };
    }
    grouped[date][projectName].entries.push({
      id: entry.id,
      content: entry.content,
      type: entry.entry_type,
      created_at: entry.created_at,
    });
  }

  const changelog = Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, projects]) => ({
      date,
      projects: Object.values(projects).sort((a, b) => a.projectName.localeCompare(b.projectName)),
    }));

  return <ChangelogClient changelog={changelog} />;
}
