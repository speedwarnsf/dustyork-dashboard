import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-KEY",
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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

import { createSupabaseServerClient } from "@/lib/supabase/server";

function checkApiKey(request: NextRequest): { valid: boolean; reason?: string } {
  const authHeader = request.headers.get("authorization");
  const apiHeader = request.headers.get("x-api-key");
  // Accept both DASHBOARD_API_KEY and IO_API_KEY for consistency
  const apiKey = process.env.DASHBOARD_API_KEY || process.env.IO_API_KEY;
  
  if (!apiKey) {
    return { valid: false, reason: "API key not configured" };
  }
  if (!authHeader && !apiHeader) {
    return { valid: false, reason: "No authorization header" };
  }
  const token = authHeader?.replace(/^Bearer\\s+/i, "").trim() || apiHeader?.trim();
  if (token !== apiKey) {
    return { valid: false, reason: "Invalid API key" };
  }
  return { valid: true };
}

async function checkSessionAuth(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = checkApiKey(request);
  const sessionAuth = authCheck.valid ? true : await checkSessionAuth();
  if (!authCheck.valid && !sessionAuth) {
    return withCors(
      NextResponse.json(
        { error: "Unauthorized", reason: authCheck.reason },
        { status: 401 }
      )
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
    const { content, entry_type = "note", metadata = null } = body;

    if (!content) {
      return withCors(
        NextResponse.json({ error: "Content is required" }, { status: 400 })
      );
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
      return withCors(
        NextResponse.json({ error: error.message }, { status: 500 })
      );
    }

    return withCors(NextResponse.json({ success: true, entry: data }));
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
    .from("journal_entries")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return withCors(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  return withCors(NextResponse.json({ entries: data }));
}
