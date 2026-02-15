import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { calculateProjectHealth } from "@/lib/health";
import type { Project } from "@/lib/types";

const DEFAULT_API_KEY =
  "003e91026ee5b01243615147a7fd740e96058bda86e7ea60fd1bc3724e415d1f";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-KEY",
};

function getApiKey(): string {
  return process.env.IO_API_KEY || process.env.DASHBOARD_API_KEY || DEFAULT_API_KEY;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return withCors(NextResponse.json({ error: "Database not configured" }, { status: 500 }));
  }

  const [projectsRes, alertsRes, journalRes] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("alerts").select("id, level, status").in("status", ["unread", "read"]),
    supabase
      .from("journal_entries")
      .select("created_at, entry_type, metadata")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const projects = (projectsRes.data || []) as Project[];
  const alerts = alertsRes.data || [];
  const lastJournal = journalRes.data?.[0];

  // Io-specific activity (entries with source: "io")
  const { data: lastIoEntry } = await supabase
    .from("journal_entries")
    .select("created_at")
    .contains("metadata", { source: "io" })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Calculate portfolio health
  const activeProjects = projects.filter((p) => p.status === "active");
  const healthScores = activeProjects.map((p) => {
    const h = calculateProjectHealth(p);
    return h.score;
  });
  const avgHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : 0;

  // Projects needing attention: stale (no update in 7+ days) or low health
  const now = Date.now();
  const needsAttention = activeProjects.filter((p) => {
    const daysSinceUpdate = (now - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    const health = calculateProjectHealth(p);
    return daysSinceUpdate > 7 || health.score < 40;
  });

  const criticalAlerts = alerts.filter((a) => a.level === "critical" || a.level === "warning");

  return withCors(
    NextResponse.json({
      activeAlertsCount: alerts.length,
      criticalAlertsCount: criticalAlerts.length,
      projectsNeedingAttention: needsAttention.length,
      projectsNeedingAttentionNames: needsAttention.map((p) => p.name),
      lastIoActivity: lastIoEntry?.created_at || lastJournal?.created_at || null,
      portfolioHealth: {
        averageScore: avgHealth,
        status: avgHealth >= 80 ? "excellent" : avgHealth >= 60 ? "good" : avgHealth >= 40 ? "fair" : "poor",
        totalActive: activeProjects.length,
        totalProjects: projects.length,
      },
      timestamp: new Date().toISOString(),
    })
  );
}
