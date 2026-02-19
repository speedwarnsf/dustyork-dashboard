import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Hub-Signature-256, X-GitHub-Event",
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return true; // No secret configured = skip verification
  if (!signature) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401, headers: CORS_HEADERS });
  }

  const payload = JSON.parse(body);

  // Only handle push events
  if (event !== "push") {
    return NextResponse.json({ ok: true, skipped: event }, { headers: CORS_HEADERS });
  }

  const repoFullName = payload.repository?.full_name; // e.g. "speedwarnsf/earth-defender"
  const branch = payload.ref?.replace("refs/heads/", "");
  const commits = payload.commits || [];
  const pusher = payload.pusher?.name || "unknown";

  if (!repoFullName || commits.length === 0) {
    return NextResponse.json({ ok: true, skipped: "no commits" }, { headers: CORS_HEADERS });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500, headers: CORS_HEADERS });
  }

  // Find matching project by github_repo
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("github_repo", repoFullName);

  if (!projects || projects.length === 0) {
    // Try matching by repo name only (without org prefix)
    const repoName = repoFullName.split("/")[1];
    const { data: byName } = await supabase
      .from("projects")
      .select("id, name")
      .ilike("github_repo", `%${repoName}`);
    
    if (!byName || byName.length === 0) {
      return NextResponse.json({ ok: true, skipped: "no matching project", repo: repoFullName }, { headers: CORS_HEADERS });
    }
    projects?.push(...byName);
  }

  const project = projects![0];

  // Build commit summary
  const commitMessages = commits
    .slice(0, 5)
    .map((c: { message: string }) => c.message.split("\n")[0])
    .join("; ");
  const summary = `${commits.length} commit${commits.length > 1 ? "s" : ""} on ${branch} by ${pusher}: ${commitMessages}`;

  // Add journal entry
  await supabase.from("journal_entries").insert({
    project_id: project.id,
    content: summary,
    entry_type: "commit",
  });

  // Update project timestamp
  await supabase
    .from("projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", project.id);

  return NextResponse.json(
    { ok: true, project: project.name, commits: commits.length },
    { headers: CORS_HEADERS }
  );
}
