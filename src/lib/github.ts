export type GithubActivity = {
  lastCommitSha: string | null;
  lastCommitMessage: string | null;
  lastCommitDate: string | null;
  openIssues: number | null;
  ciStatus: "success" | "failure" | "unknown";
  activityLabel: "Hot" | "Warm" | "Cold" | "Frozen" | "Unknown";
  repoUrl: string | null;
};

const parseRepo = (repo: string) => {
  const trimmed = repo.trim().replace(/^https?:\/\//, "").replace("github.com/", "");
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length >= 2) {
    return { owner: parts[0], name: parts[1] };
  }
  return null;
};

export const getGithubOpenGraphUrl = (repo: string | null) => {
  if (!repo) return null;
  const parsed = parseRepo(repo);
  if (!parsed) return null;
  return `https://opengraph.githubassets.com/1/${parsed.owner}/${parsed.name}`;
};

const computeActivity = (dateIso: string | null) => {
  if (!dateIso) return "Unknown" as const;
  const last = new Date(dateIso).getTime();
  const now = Date.now();
  const days = (now - last) / (1000 * 60 * 60 * 24);
  if (days <= 7) return "Hot" as const;
  if (days <= 30) return "Warm" as const;
  if (days <= 90) return "Cold" as const;
  return "Frozen" as const;
};

export type GithubCommit = {
  sha: string;
  message: string;
  date: string;
  author: string;
  url: string;
};

export const fetchRecentCommits = async (repo: string, count: number = 10): Promise<GithubCommit[]> => {
  const parsed = parseRepo(repo);
  if (!parsed) return [];

  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = token ? { Authorization: `token ${token}` } : {};
    const base = `https://api.github.com/repos/${parsed.owner}/${parsed.name}`;
    const res = await fetch(`${base}/commits?per_page=${count}`, { headers, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((c: any) => ({
      sha: c.sha?.slice(0, 7) || "",
      message: c.commit?.message?.split("\n")[0] || "",
      date: c.commit?.author?.date || "",
      author: c.commit?.author?.name || c.author?.login || "Unknown",
      url: c.html_url || `https://github.com/${parsed.owner}/${parsed.name}/commit/${c.sha}`,
    }));
  } catch {
    return [];
  }
};

export const fetchCommitActivitySparkline = async (repo: string, days: number = 30): Promise<number[]> => {
  const parsed = parseRepo(repo);
  if (!parsed) return [];

  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = token ? { Authorization: `token ${token}` } : {};
    const base = `https://api.github.com/repos/${parsed.owner}/${parsed.name}`;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const res = await fetch(`${base}/commits?per_page=100&since=${since}`, { headers, next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Bucket commits into days
    const buckets = new Array(days).fill(0);
    const now = Date.now();
    for (const c of data) {
      const date = c.commit?.author?.date;
      if (!date) continue;
      const daysAgo = Math.floor((now - new Date(date).getTime()) / 86400000);
      if (daysAgo >= 0 && daysAgo < days) {
        buckets[days - 1 - daysAgo]++;
      }
    }
    return buckets;
  } catch {
    return [];
  }
};

export type DeployStatus = {
  status: "success" | "failed" | "building" | "unknown";
  timestamp: string | null;
  url: string | null;
};

export const fetchDeployStatus = async (repo: string): Promise<DeployStatus> => {
  const parsed = parseRepo(repo);
  if (!parsed) return { status: "unknown", timestamp: null, url: null };

  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = token ? { Authorization: `token ${token}` } : {};
    const base = `https://api.github.com/repos/${parsed.owner}/${parsed.name}`;
    const res = await fetch(`${base}/deployments?per_page=1&environment=production`, { headers, next: { revalidate: 300 } });
    if (!res.ok) return { status: "unknown", timestamp: null, url: null };
    const deployments = await res.json();
    if (!Array.isArray(deployments) || deployments.length === 0) return { status: "unknown", timestamp: null, url: null };

    const deployment = deployments[0];
    const statusRes = await fetch(`${deployment.statuses_url}?per_page=1`, { headers, next: { revalidate: 300 } });
    if (!statusRes.ok) return { status: "unknown", timestamp: deployment.created_at, url: null };
    const statuses = await statusRes.json();
    const latest = Array.isArray(statuses) && statuses.length > 0 ? statuses[0] : null;

    let status: DeployStatus["status"] = "unknown";
    if (latest) {
      if (latest.state === "success") status = "success";
      else if (latest.state === "failure" || latest.state === "error") status = "failed";
      else if (latest.state === "pending" || latest.state === "in_progress") status = "building";
    }

    return {
      status,
      timestamp: latest?.created_at || deployment.created_at,
      url: latest?.target_url || latest?.environment_url || null,
    };
  } catch {
    return { status: "unknown", timestamp: null, url: null };
  }
};

export const fetchGithubActivity = async (repo: string): Promise<GithubActivity> => {
  const parsed = parseRepo(repo);
  if (!parsed) {
    return {
      lastCommitSha: null,
      lastCommitMessage: null,
      lastCommitDate: null,
      openIssues: null,
      ciStatus: "unknown",
      activityLabel: "Unknown",
      repoUrl: null,
    };
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = token
      ? { Authorization: `token ${token}` }
      : {};

    const base = `https://api.github.com/repos/${parsed.owner}/${parsed.name}`;
    const [commitRes, issuesRes, actionsRes] = await Promise.all([
      fetch(`${base}/commits?per_page=1`, { headers, next: { revalidate: 300 } }).catch(() => null),
      fetch(
        `https://api.github.com/search/issues?q=repo:${parsed.owner}/${parsed.name}+type:issue+state:open`,
        { headers, next: { revalidate: 300 } }
      ).catch(() => null),
      fetch(`${base}/actions/runs?per_page=1`, { headers, next: { revalidate: 300 } }).catch(() => null),
    ]);

    const commitData = commitRes?.ok ? await commitRes.json().catch(() => []) : [];
    const issuesData = issuesRes?.ok ? await issuesRes.json().catch(() => null) : null;
    const actionsData = actionsRes?.ok ? await actionsRes.json().catch(() => null) : null;

    const latestCommit = Array.isArray(commitData) && commitData.length > 0 ? commitData[0] : null;
    const lastCommitSha = latestCommit?.sha ?? null;
    const lastCommitMessage = latestCommit?.commit?.message ?? null;
    const lastCommitDate = latestCommit?.commit?.author?.date ?? null;
    const openIssues = typeof issuesData?.total_count === "number" ? issuesData.total_count : null;
    const workflowRun = actionsData?.workflow_runs?.[0];
    const ciStatus =
      workflowRun?.conclusion === "success"
        ? "success"
        : workflowRun?.conclusion
        ? "failure"
        : "unknown";

    return {
      lastCommitSha,
      lastCommitMessage,
      lastCommitDate,
      openIssues,
      ciStatus,
      activityLabel: computeActivity(lastCommitDate),
      repoUrl: `https://github.com/${parsed.owner}/${parsed.name}`,
    };
  } catch (error) {
    console.error(`GitHub fetch error for ${repo}:`, error);
    return {
      lastCommitSha: null,
      lastCommitMessage: null,
      lastCommitDate: null,
      openIssues: null,
      ciStatus: "unknown",
      activityLabel: "Unknown",
      repoUrl: `https://github.com/${parsed.owner}/${parsed.name}`,
    };
  }
};
