import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_KEY =
  "003e91026ee5b01243615147a7fd740e96058bda86e7ea60fd1bc3724e415d1f";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-KEY, X-Webhook-Secret",
};

function getApiKey(): string {
  return process.env.IO_API_KEY || process.env.DASHBOARD_API_KEY || DEFAULT_API_KEY;
}

function getWebhookSecret(): string {
  return process.env.WEBHOOK_SECRET || getApiKey();
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function verifyAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  const token = auth
    ? auth.replace(/^Bearer\s+/i, "").trim()
    : request.headers.get("x-api-key")?.trim() ||
      request.headers.get("x-webhook-secret")?.trim() ||
      null;
  if (!token) return false;
  return token === getApiKey() || token === getWebhookSecret();
}

function withCors(res: NextResponse) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/**
 * POST /api/alerts/webhook
 *
 * Accepts payloads from external services (Vercel deploy hooks, GitHub Actions, etc.)
 *
 * Generic format:
 *   { source, event, level?, title?, message?, project_name?, metadata? }
 *
 * Vercel deploy hook format:
 *   { type: "deployment", payload: { name, url, state, ... } }
 *
 * GitHub Actions format:
 *   { action, workflow_run?: { conclusion, html_url, ... }, repository?: { full_name } }
 */
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return withCors(
      NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    );
  }

  let level = "info";
  let category = "webhook";
  let title = "";
  let message = "";
  let relatedId: string | null = null;
  let relatedType: string | null = null;
  let actionRequired: string | null = null;

  // ── Vercel deploy webhook ──
  if (body.type === "deployment" && body.payload) {
    const payload = body.payload as Record<string, unknown>;
    const state = payload.state as string;
    const name = (payload.name as string) || "Unknown";
    const url = payload.url as string;

    category = "deploy_webhook";
    title = `Deploy ${state}: ${name}`;
    message = `Vercel deployment ${state}${url ? ` — ${url}` : ""}`;
    level = state === "ERROR" || state === "CANCELED" ? "critical" : state === "READY" ? "info" : "warning";
    relatedType = "deploy";

    if (state === "ERROR") {
      actionRequired = "Check Vercel dashboard for deploy errors";
    }

    // Try to resolve project
    if (name) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .or(`name.ilike.%${name}%,domain.ilike.%${name}%,vercel_project_id.eq.${name}`)
        .limit(1)
        .maybeSingle();
      if (project) relatedId = project.id;
    }
  }
  // ── GitHub Actions webhook ──
  else if (body.workflow_run || body.action === "completed") {
    const run = (body.workflow_run || {}) as Record<string, unknown>;
    const conclusion = run.conclusion as string;
    const repo = (body.repository as Record<string, unknown>)?.full_name as string;
    const htmlUrl = run.html_url as string;

    category = "ci_webhook";
    title = `CI ${conclusion}: ${repo || "unknown"}`;
    message = `Workflow ${run.name || "build"} ${conclusion}${htmlUrl ? ` — ${htmlUrl}` : ""}`;
    level = conclusion === "failure" ? "critical" : conclusion === "success" ? "info" : "warning";
    relatedType = "ci";

    if (conclusion === "failure") {
      actionRequired = "Fix failing CI workflow";
    }

    // Resolve project by repo
    if (repo) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .ilike("github_repo", `%${repo}%`)
        .limit(1)
        .maybeSingle();
      if (project) relatedId = project.id;
    }
  }
  // ── Generic webhook ──
  else {
    const source = (body.source as string) || "external";
    category = `webhook_${source}`;
    level = (body.level as string) || "info";
    title = (body.title as string) || `Alert from ${source}`;
    message = (body.message as string) || JSON.stringify(body).slice(0, 500);
    relatedType = (body.related_type as string) || null;
    actionRequired = (body.action_required as string) || null;

    // Try to resolve project by name
    if (body.project_name) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .ilike("name", `%${body.project_name}%`)
        .limit(1)
        .maybeSingle();
      if (project) relatedId = project.id;
    }
  }

  if (!title) {
    return withCors(
      NextResponse.json({ error: "Could not parse webhook payload" }, { status: 400 })
    );
  }

  const { data: alert, error } = await supabase
    .from("alerts")
    .insert({
      level,
      category,
      title,
      message,
      related_id: relatedId,
      related_type: relatedType,
      action_required: actionRequired,
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
