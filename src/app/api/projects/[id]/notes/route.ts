import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("project_notes")
    .select("notes")
    .eq("project_id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data?.notes || "" });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { notes } = await req.json();

  // Upsert - try update first, insert if not exists
  const { data: existing } = await supabase
    .from("project_notes")
    .select("id")
    .eq("project_id", id)
    .single();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from("project_notes")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("project_id", id));
  } else {
    ({ error } = await supabase
      .from("project_notes")
      .insert({ project_id: id, notes, user_id: user.id }));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
