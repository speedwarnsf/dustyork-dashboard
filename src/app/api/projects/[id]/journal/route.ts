import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function checkApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.DASHBOARD_API_KEY;
  if (!apiKey) return false;
  return authHeader === `Bearer ${apiKey}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
