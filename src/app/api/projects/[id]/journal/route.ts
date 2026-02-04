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

function checkApiKey(request: NextRequest): { valid: boolean; reason?: string } {
  const authHeader = request.headers.get("authorization");
  // Accept both DASHBOARD_API_KEY and IO_API_KEY for consistency
  const apiKey = process.env.DASHBOARD_API_KEY || process.env.IO_API_KEY;
  
  if (!apiKey) {
    return { valid: false, reason: "API key not configured" };
  }
  if (!authHeader) {
    return { valid: false, reason: "No authorization header" };
  }
  if (authHeader !== `Bearer ${apiKey}`) {
    return { valid: false, reason: "Invalid API key" };
  }
  return { valid: true };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = checkApiKey(request);
  if (!authCheck.valid) {
    return NextResponse.json({ error: "Unauthorized", reason: authCheck.reason }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id: projectId } = await params;
  
  try {
    const body = await request.json();
    const { content, entry_type = "note", metadata = null } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .insert({
        project_id: projectId,
        content,
        entry_type,
        metadata,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, entry: data });
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
    .from("journal_entries")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data });
}
