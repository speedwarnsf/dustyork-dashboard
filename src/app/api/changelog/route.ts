import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Fetch recent journal entries with project info
  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("id, content, entry_type, created_at, project_id, projects(id, name, status)")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by date then project
  const grouped: Record<string, Record<string, { projectId: string; projectName: string; projectStatus: string; entries: { id: string; content: string; type: string; created_at: string }[] }>> = {};

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

  // Convert to sorted array
  const changelog = Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, projects]) => ({
      date,
      projects: Object.values(projects).sort((a, b) => a.projectName.localeCompare(b.projectName)),
    }));

  return NextResponse.json({ changelog, total: entries?.length || 0 });
}
