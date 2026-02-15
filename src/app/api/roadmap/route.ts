import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const [projectsRes, milestonesRes, releasesRes, depsRes] = await Promise.all([
    supabase.from("projects").select("id, name, status, priority").order("name"),
    supabase.from("milestones").select("*, projects(name)").order("target_date", { ascending: true }),
    supabase.from("releases").select("*").order("target_date", { ascending: true }),
    supabase.from("milestone_dependencies").select("*"),
  ]);

  return NextResponse.json({
    projects: projectsRes.data || [],
    milestones: milestonesRes.data || [],
    releases: releasesRes.data || [],
    dependencies: depsRes.data || [],
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();
  const { action } = body;

  if (action === "create_release") {
    const { project_id, name, description, target_date, status } = body;
    const { data, error } = await supabase
      .from("releases")
      .insert({ project_id, name, description, target_date, status: status || "planned" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (action === "update_release") {
    const { id, ...updates } = body;
    delete updates.action;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from("releases").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (action === "delete_release") {
    const { error } = await supabase.from("releases").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "assign_milestone_release") {
    const { milestone_id, release_id } = body;
    const { error } = await supabase.from("milestones").update({ release_id }).eq("id", milestone_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "add_dependency") {
    const { milestone_id, depends_on_id } = body;
    const { data, error } = await supabase
      .from("milestone_dependencies")
      .insert({ milestone_id, depends_on_id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (action === "remove_dependency") {
    const { error } = await supabase.from("milestone_dependencies").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_milestone_date") {
    const { milestone_id, target_date } = body;
    const { error } = await supabase
      .from("milestones")
      .update({ target_date, updated_at: new Date().toISOString() })
      .eq("id", milestone_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_milestone") {
    const { milestone_id, ...updates } = body;
    delete updates.action;
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from("milestones").update(updates).eq("id", milestone_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
