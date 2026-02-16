/**
 * Standalone script to recalculate and sync all project health scores.
 * Run with: npx tsx scripts/sync-health.ts
 */
import { createClient } from "@supabase/supabase-js";
import { differenceInDays } from "date-fns";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars. Run with: source .env.local && npx tsx scripts/sync-health.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchGithubData(repo: string) {
  if (!GITHUB_TOKEN) return null;
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    };

    const [repoRes, commitsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, { headers }),
    ]);

    if (!repoRes.ok) return null;

    const repoData = await repoRes.json();
    const commits = commitsRes.ok ? await commitsRes.json() : [];
    const lastCommitDate = commits[0]?.commit?.author?.date || null;

    return {
      openIssues: repoData.open_issues_count || 0,
      lastCommitDate,
      ciStatus: null as string | null,
    };
  } catch {
    return null;
  }
}

function calculateHealth(project: any, github: any) {
  if (project.status === "archived") return 50;
  if (project.status === "completed") return 100;

  let score = 0;

  // Commit Activity (30 points)
  if (github?.lastCommitDate) {
    const days = differenceInDays(new Date(), new Date(github.lastCommitDate));
    if (days <= 1) score += 30;
    else if (days <= 3) score += 25;
    else if (days <= 7) score += 20;
    else if (days <= 14) score += 15;
    else if (days <= 30) score += 8;
    else if (days <= 60) score += 5;
    else score += 2;
  } else if (project.github_repo) {
    score += 5;
  } else {
    score += 18;
  }

  // Deployment (25 points)
  if (project.live_url) {
    let deploy = 15;
    if (project.domain) deploy += 5;
    if (project.live_url.startsWith("https://")) deploy += 3;
    if (!project.live_url.includes("localhost") && !project.live_url.includes("staging")) deploy += 2;
    score += Math.min(25, deploy);
  } else if (project.status === "active") {
    score += 5;
  } else {
    score += 12;
  }

  // Issue Health (25 points)
  if (github?.openIssues !== null && github?.openIssues !== undefined) {
    const issues = github.openIssues;
    if (issues === 0) score += 25;
    else if (issues <= 3) score += 20;
    else if (issues <= 10) score += 15;
    else score += 10;
  } else if (project.github_repo) {
    score += 15;
  } else {
    score += 20;
  }

  // CI (15 points)
  if (github?.ciStatus === "success") score += 15;
  else if (github?.ciStatus === "failure") score += 3;
  else score += 10;

  // Freshness (5 points)
  const activityDays = differenceInDays(new Date(), new Date(project.updated_at));
  if (activityDays <= 1) score += 5;
  else if (activityDays <= 7) score += 4;
  else if (activityDays <= 30) score += 3;
  else if (activityDays <= 90) score += 2;
  else score += 1;

  return score;
}

async function main() {
  const { data: projects, error } = await supabase.from("projects").select("*");
  if (error || !projects) {
    console.error("Failed to fetch projects:", error);
    process.exit(1);
  }

  console.log(`Syncing health for ${projects.length} projects...\n`);

  for (const project of projects) {
    const github = project.github_repo ? await fetchGithubData(project.github_repo) : null;
    const score = calculateHealth(project, github);
    const oldScore = project.health_score ?? "null";

    const { error: updateError } = await supabase
      .from("projects")
      .update({ health_score: score })
      .eq("id", project.id);

    const changed = score !== project.health_score;
    console.log(
      `${changed ? "✓" : "·"} ${project.name.padEnd(25)} ${String(oldScore).padStart(3)} → ${String(score).padStart(3)}${changed ? " (updated)" : ""}`
    );

    if (updateError) {
      console.error(`  ✗ Update failed: ${updateError.message}`);
    }
  }

  console.log("\nDone.");
}

main();
