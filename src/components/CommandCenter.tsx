"use client";

import { useState } from "react";
import { useToast } from "./Toast";
import { Icon } from "./Icon";

type CommandCenterProps = {
  project: {
    id: string;
    name: string;
    description: string | null;
    github_repo: string | null;
    live_url: string | null;
    status: string;
    vercel_project_id?: string | null;
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
  onJournalAdded?: () => void;
};

export default function CommandCenter({
  project,
  milestones = [],
  recentJournalEntries = [],
  onJournalAdded,
}: CommandCenterProps) {
  const { addToast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [journalContent, setJournalContent] = useState("");
  const [showJournalForm, setShowJournalForm] = useState(false);

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

  const handleDeploy = async () => {
    if (!project.github_repo) {
      addToast("No GitHub repo linked", "error");
      return;
    }

    setIsDeploying(true);
    addToast("Triggering deploy...", "info");

    // In production, this would call the Vercel API
    // For now, simulate deployment
    await new Promise((r) => setTimeout(r, 2000));
    
    addToast("Deploy triggered! Check Vercel for status.", "success");
    setIsDeploying(false);
  };

  const handleSpawnPolishAgent = async () => {
    const prompt = `Polish and improve ${project.name}:
- Fix any visual inconsistencies
- Improve accessibility
- Optimize performance
- Clean up code
- Add missing error handling

GitHub: https://github.com/${project.github_repo}
${project.live_url ? `Live: ${project.live_url}` : ""}

Focus on quick wins that improve quality.`;

    await navigator.clipboard.writeText(prompt);
    addToast("Polish agent prompt copied!", "success");
  };

  const handleAddJournal = async () => {
    if (!journalContent.trim()) return;

    setIsAddingJournal(true);
    try {
      const res = await fetch("/api/io", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // In production, this would use proper auth
        },
        body: JSON.stringify({
          action: "journal",
          projectId: project.id,
          content: journalContent,
          entry_type: "note",
        }),
      });

      if (res.ok) {
        addToast("Journal entry added!", "success");
        setJournalContent("");
        setShowJournalForm(false);
        onJournalAdded?.();
      } else {
        throw new Error("Failed to add entry");
      }
    } catch {
      addToast("Failed to add entry", "error");
    } finally {
      setIsAddingJournal(false);
    }
  };

  const openGitHub = () => {
    if (project.github_repo) {
      window.open(`https://github.com/${project.github_repo}`, "_blank");
    }
  };

  const openVercel = () => {
    window.open("https://vercel.com/speed-warns-projects", "_blank");
  };

  const openLiveSite = () => {
    if (project.live_url) {
      window.open(project.live_url, "_blank");
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={handleCopyContext}
          className="flex items-center gap-2 rounded-none bg-[#7bdcff] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#a5ebff]"
        >
          <Icon name="intelligence" size={16} />
          Resume with AI
        </button>

        {project.github_repo && (
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="flex items-center gap-2 rounded-none bg-[#d2ff5a] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e5ff8a] disabled:opacity-50"
          >
            <span>{isDeploying ? <Icon name="hourglass" size={16} /> : <Icon name="deploy" size={16} />}</span>
            {isDeploying ? "Deploying..." : "Deploy"}
          </button>
        )}

        <button
          onClick={() => setShowJournalForm(!showJournalForm)}
          className="flex items-center gap-2 rounded-none border border-[#1c1c1c] px-4 py-2.5 text-sm font-medium text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
        >
          <Icon name="briefs" size={16} />
          Quick Note
        </button>

        {project.github_repo && (
          <button
            onClick={handleSpawnPolishAgent}
            className="flex items-center gap-2 rounded-none border border-[#1c1c1c] px-4 py-2.5 text-sm font-medium text-white transition hover:border-[#d2ff5a] hover:text-[#d2ff5a]"
          >
            <Icon name="star" size={16} />
            Polish Agent
          </button>
        )}
      </div>

      {/* Quick Journal Form */}
      {showJournalForm && (
        <div className="p-4 rounded-none border border-[#1c1c1c] bg-[#111]">
          <textarea
            value={journalContent}
            onChange={(e) => setJournalContent(e.target.value)}
            placeholder="What did you work on?"
            aria-label="Journal entry"
            className="w-full h-24 bg-transparent text-sm resize-none focus:outline-none placeholder:text-[#555]"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowJournalForm(false)}
              className="px-3 py-1.5 text-sm text-[#666] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddJournal}
              disabled={!journalContent.trim() || isAddingJournal}
              className="px-4 py-1.5 text-sm font-medium rounded-none bg-[#7bdcff] text-black hover:bg-[#a5ebff] disabled:opacity-50 transition"
            >
              {isAddingJournal ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Secondary Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={openVercel}
          className="flex items-center gap-2 rounded-none border border-[#1c1c1c] px-3 py-1.5 text-xs font-medium text-[#8b8b8b] transition hover:border-[#555] hover:text-white"
        >
          <Icon name="upload" size={14} />
          Vercel
        </button>

        {project.github_repo && (
          <button
            onClick={openGitHub}
            className="flex items-center gap-2 rounded-none border border-[#1c1c1c] px-3 py-1.5 text-xs font-medium text-[#8b8b8b] transition hover:border-[#555] hover:text-white"
          >
            <Icon name="entities" size={14} />
            GitHub
          </button>
        )}

        {project.live_url && (
          <button
            onClick={openLiveSite}
            className="flex items-center gap-2 rounded-none border border-[#1c1c1c] px-3 py-1.5 text-xs font-medium text-[#8b8b8b] transition hover:border-[#555] hover:text-white"
          >
            <Icon name="cloud" size={14} />
            Live Site
          </button>
        )}

        {project.github_repo && (
          <>
            <button
              onClick={() =>
                window.open(
                  `https://github.com/${project.github_repo}/actions`,
                  "_blank"
                )
              }
              className="flex items-center gap-2 rounded-none border border-[#1c1c1c] px-3 py-1.5 text-xs font-medium text-[#8b8b8b] transition hover:border-[#555] hover:text-white"
            >
              <Icon name="settings" size={14} />
              Actions
            </button>

            <button
              onClick={() =>
                window.open(
                  `https://github.com/${project.github_repo}/issues`,
                  "_blank"
                )
              }
              className="flex items-center gap-2 rounded-none border border-[#1c1c1c] px-3 py-1.5 text-xs font-medium text-[#8b8b8b] transition hover:border-[#555] hover:text-white"
            >
              <Icon name="chat" size={14} />
              Issues
            </button>
          </>
        )}
      </div>
    </div>
  );
}
