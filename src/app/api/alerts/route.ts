import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { generateAlerts } from "@/lib/alerts";
import { fetchGithubActivity, fetchDeployStatus } from "@/lib/github";
import { calculateProjectHealth } from "@/lib/health";
import type { Project, Milestone } from "@/lib/types";

const DEFAULT_API_KEY =
  "003e91026ee5b01243615147a7fd740e96058bda86e7ea60fd1bc3724e415d1f";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-KEY",
};

function getApiKey(): string {
  return (
    process.env.IO_API_KEY || process.env.DASHBOARD_API_KEY || DEFAULT_API_KEY
  );
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function verifyApiKey(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  const token = auth
    ? auth.replace(/^Bearer\s+/i, "").trim()
    : request.headers.get("x-api-key")?.trim() || null;
  return token === getApiKey();
}

function withCors(res: NextResponse) {
  for (const [k, v] of Object.entries(CORS_HEADERS))
    res.headers.set(k, v);
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/**
 * GET /api/alerts — list alerts, optionally run a scan first
 * Query params:
 *   ?scan=true  — re-scan projects and generate new alerts before returning
 *   ?status=unread|read|resolved|all (default: unread,read — active alerts)
 *   ?limit=50
 */
export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) {
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

  const { searchParams } = new URL(request.url);
  const scan = searchParams.get("scan") === "true";
  const statusFilter = searchParams.get("status") || "active";
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "100", 10),
    500
  );

  // Optionally run a scan
  if (scan) {
    await runAlertScan(supabase);
  }

  // Fetch alerts
  let query = supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statusFilter === "active") {
    query = query.in("status", ["unread", "read"]);
  } else if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: alerts, error } = await query;
  if (error) {
    return withCors(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  return withCors(NextResponse.json({ alerts, timestamp: new Date().toISOString() }));
}

/**
 * POST /api/alerts — trigger a scan, or manually create an alert
 * Body: {} (empty = scan) or { level, category, title, message, ... }
 */
export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
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

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // empty body = trigger scan
  }

  // If body has alert fields, create a manual alert
  if (body.title && body.message) {
    const { data: alert, error } = await supabase
      .from("alerts")
      .insert({
        level: (body.level as string) || "info",
        category: (body.category as string) || "manual",
        title: body.title as string,
        message: body.message as string,
        related_id: (body.related_id as string) || null,
        related_type: (body.related_type as string) || null,
        action_required: (body.action_required as string) || null,
        status: "unread",
      })
      .select()
      .single();

    if (error) {
      return withCors(
        NextResponse.json({ error: error.message }, { status: 500 })
      );
    }
    return withCors(NextResponse.json({ success: true, alert }));
  }

  // Otherwise run a scan
  const created = await runAlertScan(supabase);
  return withCors(
    NextResponse.json({
      success: true,
      scanned: true,
      alertsCreated: created,
      timestamp: new Date().toISOString(),
    })
  );
}

/**
 * PATCH /api/alerts — update alert status (read, resolved)
 * Body: { id, status } or { ids: [...], status }
 */
export async function PATCH(request: NextRequest) {
  if (!verifyApiKey(request)) {
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

  try {
    const body = await request.json();
    const ids: string[] = body.ids || (body.id ? [body.id] : []);
    const newStatus = body.status as string;

    if (ids.length === 0 || !newStatus) {
      return withCors(
        NextResponse.json(
          { error: "Missing id(s) and status" },
          { status: 400 }
        )
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "read") updateData.read_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("alerts")
      .update(updateData)
      .in("id", ids)
      .select();

    if (error) {
      return withCors(
        NextResponse.json({ error: error.message }, { status: 500 })
      );
    }

    return withCors(NextResponse.json({ success: true, updated: data }));
  } catch {
    return withCors(
      NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    );
  }
}

// ─── Scan Logic ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAlertScan(supabase: any): Promise<number> {
  // Fetch projects, milestones, recent journal
  const [projectsRes, milestonesRes, journalRes] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase
      .from("milestones")
      .select("*, projects(name)")
      .order("target_date", { ascending: true }),
    supabase
      .from("journal_entries")
      .select("project_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const projects = (projectsRes.data || []) as Project[];
  const milestones = (milestonesRes.data || []) as Array<
    Milestone & { projects: { name: string } | null }
  >;
  const journal = journalRes.data || [];

  // Enrich with GitHub / health
  const enriched = await Promise.all(
    projects
      .filter((p) => p.status === "active")
      .map(async (project) => {
        if (!project.github_repo)
          return { ...project, github: null, deployStatus: undefined };
        try {
          const [github, deployStatus] = await Promise.all([
            fetchGithubActivity(project.github_repo),
            fetchDeployStatus(project.github_repo),
          ]);
          return { ...project, github, deployStatus };
        } catch {
          return { ...project, github: null, deployStatus: undefined };
        }
      })
  );

  const withHealth = enriched.map((p) => ({
    ...p,
    health: calculateProjectHealth(p),
  }));

  const generated = generateAlerts(withHealth, milestones, journal);
  if (generated.length === 0) return 0;

  // Fetch existing active alerts to deduplicate by fingerprint
  // We use category + related_id + related_type as a composite fingerprint
  const { data: existing } = await supabase
    .from("alerts")
    .select("id, category, related_id, related_type, title")
    .in("status", ["unread", "read"]);

  const existingSet = new Set(
    (existing || []).map(
      (a: { category: string; related_id: string | null; related_type: string | null }) =>
        `${a.category}:${a.related_id}:${a.related_type}`
    )
  );

  const toInsert = generated.filter(
    (a) => !existingSet.has(`${a.category}:${a.related_id}:${a.related_type}`)
  );

  if (toInsert.length === 0) return 0;

  const rows = toInsert.map(({ fingerprint: _fp, ...a }) => ({
    ...a,
    status: "unread",
  }));

  const { error } = await supabase.from("alerts").insert(rows);
  if (error) {
    console.error("Alert insert error:", error);
    return 0;
  }

  return toInsert.length;
}
