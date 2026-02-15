import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { differenceInDays, subHours } from "date-fns";

const DEFAULT_API_KEY = "003e91026ee5b01243615147a7fd740e96058bda86e7ea60fd1bc3724e415d1f";

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
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function verifyApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : request.headers.get("x-api-key")?.trim() || null;
  return token === getApiKey();
}

function withCors(response: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
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

  const now = new Date();
  const twentyFourHoursAgo = subHours(now, 24);
  const isoThreshold = twentyFourHoursAgo.toISOString();

  // Fetch projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  // Fetch milestones
  const { data: milestones } = await supabase
    .from("milestones")
    .select("*, projects(name)")
    .order("target_date", { ascending: true });

  // Fetch recent journal entries (last 24h)
  const { data: recentJournal } = await supabase
    .from("journal_entries")
    .select("*, projects(id, name)")
    .gte("created_at", isoThreshold)
    .order("created_at", { ascending: false });

  // Projects changed in last 24h
  const changedProjects = (projects || []).filter(
    (p: any) => new Date(p.updated_at) >= twentyFourHoursAgo
  );

  // Milestones approaching deadline (within 7 days, not completed)
  const approachingMilestones = (milestones || []).filter((m: any) => {
    if (m.status === "completed" || !m.target_date) return false;
    const daysUntil = differenceInDays(new Date(m.target_date), now);
    return daysUntil >= 0 && daysUntil <= 7;
  });

  // Overdue milestones
  const overdueMilestones = (milestones || []).filter((m: any) => {
    if (m.status === "completed" || !m.target_date) return false;
    return new Date(m.target_date) < now;
  });

  // Health changes - compare current health_score to stored
  const healthChanges = (projects || [])
    .filter((p: any) => p.status === "active" && p.health_score !== null && p.health_score !== undefined)
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      healthScore: p.health_score,
      updatedRecently: new Date(p.updated_at) >= twentyFourHoursAgo,
    }));

  // Build summary
  const activeCount = (projects || []).filter((p: any) => p.status === "active").length;
  const summary = {
    date: now.toISOString(),
    activeProjects: activeCount,
    changedInLast24h: changedProjects.length,
    journalEntriesLast24h: (recentJournal || []).length,
    approachingDeadlines: approachingMilestones.length,
    overdueCount: overdueMilestones.length,
  };

  return withCors(NextResponse.json({
    summary,
    changedProjects: changedProjects.map((p: any) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      updatedAt: p.updated_at,
      liveUrl: p.live_url,
      githubRepo: p.github_repo,
    })),
    approachingMilestones: approachingMilestones.map((m: any) => ({
      id: m.id,
      name: m.name,
      projectName: m.projects?.name || "Unknown",
      targetDate: m.target_date,
      percentComplete: m.percent_complete,
      status: m.status,
      daysUntil: differenceInDays(new Date(m.target_date), now),
    })),
    overdueMilestones: overdueMilestones.map((m: any) => ({
      id: m.id,
      name: m.name,
      projectName: m.projects?.name || "Unknown",
      targetDate: m.target_date,
      percentComplete: m.percent_complete,
      daysOverdue: differenceInDays(now, new Date(m.target_date)),
    })),
    recentJournal: (recentJournal || []).map((j: any) => ({
      id: j.id,
      content: j.content,
      entryType: j.entry_type,
      createdAt: j.created_at,
      projectName: j.projects?.name || "Unknown",
    })),
    healthChanges,
    timestamp: now.toISOString(),
  }));
}
