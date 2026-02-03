"use client";

import { useToast } from "./Toast";

type QuickActionsProps = {
  project: {
    id: string;
    name: string;
    description: string | null;
    github_repo: string | null;
    live_url: string | null;
    status: string;
    priority: string;
  };
  milestones?: Array<{
    name: string;
    status: string;
    percent_complete: number;
  }>;
  recentJournalEntries?: Array<{
    content: string;
    entry_type: string;
    created_at: string;
  }>;
};

export default function QuickActions({
  project,
  milestones = [],
  recentJournalEntries = [],
}: QuickActionsProps) {
  const { addToast } = useToast();

  const generateContextPrompt = () => {
    const milestonesText = milestones
      .map(
        (m) =>
          `- ${m.name}: ${m.status} (${m.percent_complete}% complete)`
      )
      .join("\n");

    const journalText = recentJournalEntries
      .slice(0, 5)
      .map(
        (j) =>
          `[${new Date(j.created_at).toLocaleDateString()}] ${j.entry_type}: ${j.content.slice(0, 200)}${j.content.length > 200 ? "..." : ""}`
      )
      .join("\n\n");

    return `# Resume Work: ${project.name}

## Project Overview
**Name:** ${project.name}
**Status:** ${project.status}
**Priority:** ${project.priority}
**Description:** ${project.description || "No description"}

${project.github_repo ? `**GitHub:** https://github.com/${project.github_repo}` : ""}
${project.live_url ? `**Live URL:** ${project.live_url}` : ""}

## Current Milestones
${milestonesText || "No milestones set"}

## Recent Journal Entries
${journalText || "No recent entries"}

---

## Instructions
You are resuming work on this project. Based on the context above:
1. Review the current status and recent progress
2. Identify the most important next steps
3. Help complete the next milestone or task

What would you like to work on?`;
  };

  const handleCopyContext = async () => {
    try {
      await navigator.clipboard.writeText(generateContextPrompt());
      addToast("Context copied to clipboard!", "success");
    } catch {
      addToast("Failed to copy", "error");
    }
  };

  const openInVSCode = () => {
    // This creates a vscode:// URL to open the project
    // Note: Requires VS Code URL handler to be enabled
    const path = `/Users/macster/Projects/${project.github_repo || project.name}`;
    window.open(`vscode://file${path}`, "_blank");
    addToast("Opening in VS Code...", "info");
  };

  const openGitHub = () => {
    if (project.github_repo) {
      window.open(`https://github.com/${project.github_repo}`, "_blank");
    } else {
      addToast("No GitHub repo linked", "error");
    }
  };

  const visitLiveSite = () => {
    if (project.live_url) {
      window.open(project.live_url, "_blank");
    } else {
      addToast("No live site available", "error");
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleCopyContext}
        className="flex items-center gap-2 rounded-xl bg-[#7bdcff] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#a5ebff]"
      >
        <span>🤖</span>
        Resume with AI
      </button>

      <button
        onClick={openInVSCode}
        className="flex items-center gap-2 rounded-xl border border-[#1c1c1c] px-4 py-2 text-sm font-medium text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
      >
        <span>💻</span>
        VS Code
      </button>

      {project.github_repo && (
        <button
          onClick={openGitHub}
          className="flex items-center gap-2 rounded-xl border border-[#1c1c1c] px-4 py-2 text-sm font-medium text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
        >
          <span>🐙</span>
          GitHub
        </button>
      )}

      {project.live_url && (
        <button
          onClick={visitLiveSite}
          className="flex items-center gap-2 rounded-xl border border-[#1c1c1c] px-4 py-2 text-sm font-medium text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
        >
          <span>🌐</span>
          Live Site
        </button>
      )}
    </div>
  );
}
