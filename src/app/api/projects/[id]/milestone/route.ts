import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-KEY",
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return createClient(url, key);
}

function withCors(response: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

function checkApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const apiHeader = request.headers.get("x-api-key");
  // Accept both DASHBOARD_API_KEY and IO_API_KEY for consistency
  const apiKey = process.env.DASHBOARD_API_KEY || process.env.IO_API_KEY;
  if (!apiKey) return false;
  if (authHeader && authHeader.replace(/^Bearer\\s+/i, "").trim() === apiKey) return true;
  if (apiHeader && apiHeader.trim() === apiKey) return true;
  return false;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkApiKey(request)) {
    return withCors(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return withCors(
      NextResponse.json({ error: "Database not configured" }, { status: 500 })
    );
  }

  const { id: projectId } = await params;

  try {
    const body = await request.json();
    const { milestone_id, percent_complete, status } = body;

    if (!milestone_id) {
      return withCors(
        NextResponse.json({ error: "milestone_id is required" }, { status: 400 })
      );
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
      return withCors(
        NextResponse.json({ error: error.message }, { status: 500 })
      );
    }

    return withCors(NextResponse.json({ success: true, milestone: data }));
  } catch {
    return withCors(
      NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return withCors(
      NextResponse.json({ error: "Database not configured" }, { status: 500 })
    );
  }

  const { id: projectId } = await params;

  const { data, error } = await supabase
    .from("milestones")
    .select("*, tasks(*)")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) {
    return withCors(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  return withCors(NextResponse.json({ milestones: data }));
}
