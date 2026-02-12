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
