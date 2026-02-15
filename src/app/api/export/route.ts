import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const [projects, milestones, journal, checklist] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: true }),
    supabase.from("milestones").select("*").order("created_at", { ascending: true }),
    supabase.from("journal_entries").select("*").order("created_at", { ascending: true }),
    supabase.from("launch_checklist").select("*").order("created_at", { ascending: true }).then(r => r, () => ({ data: null, error: null, count: null, status: 0, statusText: "" })),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    version: "1.0",
    projects: projects.data || [],
    milestones: milestones.data || [],
    journal_entries: journal.data || [],
    launch_checklist: (checklist as any)?.data || [],
  });
}
