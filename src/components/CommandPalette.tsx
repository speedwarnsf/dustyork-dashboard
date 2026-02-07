"use client";
import { Icon } from "./Icon";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  github_repo: string | null;
  live_url: string | null;
};

type Action = {
  id: string;
  name: string;
  description?: string;
  action: () => void;
  icon?: string;
  shortcut?: string;
  category?: string;
};

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    setIsLoading(true);
    setFetchError(null);
    
    fetch("/api/projects")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch projects: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setProjects(data.projects || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("CommandPalette fetch error:", err);
        setFetchError(err.message);
        setIsLoading(false);
      });
  }, []);

  // Handle keyboard shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Build actions list
  const navigationActions: Action[] = [
    {
      id: "dashboard",
      name: "Dashboard",
      description: "Go to main dashboard",
      icon: "🏠",
      category: "Navigation",
      action: () => router.push("/"),
    },
    {
      id: "new-project",
      name: "New Project",
      description: "Create a new project",
      icon: "➕",
      category: "Actions",
      action: () => router.push("/project/new"),
    },
  ];

  // Generate project-specific actions
  const projectActions: Action[] = projects.flatMap((project) => {
    const actions: Action[] = [
      {
        id: `view-${project.id}`,
        name: project.name,
        description: `Open ${project.name}`,
        icon: "📁",
        category: "Projects",
        action: () => router.push(`/project/${project.id}`),
      },
    ];

    if (project.github_repo) {
      actions.push({
        id: `github-${project.id}`,
        name: `${project.name} → GitHub`,
        description: `Open ${project.github_repo} on GitHub`,
        icon: "🐙",
        category: "External",
        action: () => window.open(`https://github.com/${project.github_repo}`, "_blank"),
      });
    }

    if (project.live_url) {
      actions.push({
        id: `live-${project.id}`,
        name: `${project.name} → Live Site`,
        description: `Open ${project.live_url}`,
        icon: "🌐",
        category: "External",
        action: () => window.open(project.live_url!, "_blank"),
      });
    }

    return actions;
  });

  // Quick external links
  const quickLinks: Action[] = [
    {
      id: "github-profile",
      name: "GitHub Profile",
      description: "Open speedwarnsf on GitHub",
      icon: "🐙",
      category: "Quick Links",
      action: () => window.open("https://github.com/speedwarnsf", "_blank"),
    },
    {
      id: "vercel-dashboard",
      name: "Vercel Dashboard",
      description: "Open Vercel deployments",
      icon: "▲",
      category: "Quick Links",
      action: () => window.open("https://vercel.com/dashboard", "_blank"),
    },
    {
      id: "supabase-dashboard",
      name: "Supabase Dashboard",
      description: "Open Supabase project",
      icon: "⚡",
      category: "Quick Links",
      action: () => window.open("https://supabase.com/dashboard/project/vqkoxfenyjomillmxawh", "_blank"),
    },
  ];

  const allActions = [...navigationActions, ...projectActions, ...quickLinks];

  // Filter actions by query
  const filteredActions = query
    ? allActions.filter(
        (action) =>
          action.name.toLowerCase().includes(query.toLowerCase()) ||
          action.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allActions;

  // Group by category for display
  const groupedActions = filteredActions.reduce((acc, action) => {
    const category = action.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(action);
    return acc;
  }, {} as Record<string, Action[]>);

  // Flatten for keyboard navigation
  const flatActions = Object.values(groupedActions).flat();

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < flatActions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : flatActions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatActions[selectedIndex]) {
          flatActions[selectedIndex].action();
          setIsOpen(false);
        }
      }
    },
    [flatActions, selectedIndex]
  );

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[#1c1c1c] px-4 py-4">
          <svg
            className="w-5 h-5 text-[#8b8b8b]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, actions, or jump to..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white text-lg placeholder:text-[#555] focus:outline-none"
          />
          <kbd className="hidden sm:block px-2 py-1 text-xs rounded bg-[#1c1c1c] text-[#666]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#7bdcff] border-t-transparent mb-3" />
              <p className="text-[#8b8b8b]">Loading projects...</p>
            </div>
          ) : fetchError ? (
            <div className="px-4 py-12 text-center">
              <p className="text-red-400"><Icon name="warning" size={16} /> {fetchError}</p>
              <p className="text-sm text-[#555] mt-1">Try refreshing the page</p>
            </div>
          ) : flatActions.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-[#8b8b8b]">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-[#555] mt-1">Try a different search term</p>
            </div>
          ) : (
            Object.entries(groupedActions).map(([category, actions]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs uppercase tracking-wider text-[#555] bg-black/50 sticky top-0">
                  {category}
                </div>
                {actions.map((action) => {
                  const index = currentIndex++;
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        action.action();
                        setIsOpen(false);
                      }}
                      className={`
                        flex w-full items-center gap-3 px-4 py-3 text-left transition
                        ${
                          index === selectedIndex
                            ? "bg-[#7bdcff]/10 text-white"
                            : "text-[#8b8b8b] hover:bg-[#1c1c1c] hover:text-white"
                        }
                      `}
                    >
                      <span className="text-xl w-8 text-center">{action.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{action.name}</div>
                        {action.description && (
                          <div className="text-xs text-[#555] truncate">{action.description}</div>
                        )}
                      </div>
                      {action.shortcut && (
                        <kbd className="px-2 py-1 text-xs rounded bg-[#1c1c1c] text-[#666]">
                          {action.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[#1c1c1c] px-4 py-3 flex items-center justify-between text-xs text-[#555]">
          <div className="flex items-center gap-4">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}
