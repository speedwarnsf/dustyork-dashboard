import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return createClient(url, key);
}

function checkApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  // Accept both DASHBOARD_API_KEY and IO_API_KEY for consistency
  const apiKey = process.env.DASHBOARD_API_KEY || process.env.IO_API_KEY;
  if (!apiKey) return false;
  return authHeader === `Bearer ${apiKey}`;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id: projectId } = await params;

  try {
    const body = await request.json();
    const { milestone_id, percent_complete, status } = body;

    if (!milestone_id) {
      return NextResponse.json({ error: "milestone_id is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (percent_complete !== undefined) {
      updateData.percent_complete = percent_complete;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    const { data, error } = await supabase
      .from("milestones")
      .update(updateData)
      .eq("id", milestone_id)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, milestone: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id: projectId } = await params;

  const { data, error } = await supabase
    .from("milestones")
    .select("*, tasks(*)")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ milestones: data });
}
