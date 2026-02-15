"use client";
import { Icon } from "./Icon";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUp, ArrowDown, CornerDownLeft, Zap } from "lucide-react";
import Fuse from 'fuse.js';

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
  priority?: number; // For ranking in fuzzy search
  keywords?: string[]; // Additional search terms
  lastUsed?: number; // Timestamp for recent actions
};

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load recent actions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('command-palette-recent');
    if (saved) {
      try {
        setRecentActions(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse recent actions');
      }
    }
  }, []);

  // Save recent action
  const addRecentAction = useCallback((actionId: string) => {
    setRecentActions(prev => {
      const updated = [actionId, ...prev.filter(id => id !== actionId)].slice(0, 5);
      localStorage.setItem('command-palette-recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Execute action and track usage
  const executeAction = useCallback((action: Action) => {
    action.action();
    addRecentAction(action.id);
    setIsOpen(false);
  }, [addRecentAction]);

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

  // Handle keyboard shortcut (Cmd+K) and custom open event
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

    const handleOpen = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpen);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Build enhanced actions list with fuzzy search support
  const navigationActions: Action[] = [
    {
      id: "dashboard",
      name: "Dashboard",
      description: "Go to main dashboard",
      icon: "home",
      category: "Navigation",
      priority: 100,
      keywords: ["home", "main", "overview"],
      action: () => router.push("/"),
    },
    {
      id: "new-project",
      name: "New Project",
      description: "Create a new project",
      icon: "add",
      category: "Quick Actions",
      priority: 90,
      keywords: ["create", "add", "start", "build"],
      shortcut: "⌘N",
      action: () => router.push("/project/new"),
    },
    {
      id: "analytics",
      name: "Portfolio Analytics",
      description: "View commit heatmap, activity charts, and project rankings",
      icon: "jobs",
      category: "Navigation",
      priority: 95,
      keywords: ["analytics", "stats", "charts", "heatmap", "commits", "activity", "portfolio"],
      action: () => router.push("/analytics"),
    },
  ];

  // Generate enhanced project-specific actions
  const projectActions: Action[] = projects.flatMap((project) => {
    const actions: Action[] = [
      {
        id: `view-${project.id}`,
        name: project.name,
        description: `Open ${project.name} project details`,
        icon: "folder",
        category: "Projects",
        priority: 80,
        keywords: [project.name.toLowerCase(), "project", "view", "open", ...(project.description?.toLowerCase().split(' ') || [])],
        action: () => router.push(`/project/${project.id}`),
      },
      {
        id: `edit-${project.id}`,
        name: `Edit ${project.name}`,
        description: `Edit project settings and details`,
        icon: "edit",
        category: "Project Actions",
        priority: 70,
        keywords: [project.name.toLowerCase(), "edit", "modify", "settings", "configure"],
        action: () => router.push(`/project/${project.id}/edit`),
      },
    ];

    if (project.github_repo) {
      actions.push({
        id: `github-${project.id}`,
        name: `${project.name} → GitHub`,
        description: `Open ${project.github_repo} repository`,
        icon: "entities",
        category: "External Links",
        priority: 60,
        keywords: [project.name.toLowerCase(), "github", "repo", "code", "source"],
        action: () => window.open(`https://github.com/${project.github_repo}`, "_blank"),
      });
    }

    if (project.live_url) {
      actions.push({
        id: `live-${project.id}`,
        name: `${project.name} → Live Site`,
        description: `Open deployed application`,
        icon: "cloud",
        category: "External Links",
        priority: 60,
        keywords: [project.name.toLowerCase(), "live", "site", "deploy", "production"],
        action: () => window.open(project.live_url!, "_blank"),
      });
    }

    return actions;
  });

  // Enhanced quick external links
  const quickLinks: Action[] = [
    {
      id: "github-profile",
      name: "GitHub Profile",
      description: "Open speedwarnsf organization",
      icon: "entities",
      category: "External Services",
      priority: 50,
      keywords: ["github", "profile", "repos", "code"],
      action: () => window.open("https://github.com/speedwarnsf", "_blank"),
    },
    {
      id: "vercel-dashboard",
      name: "Vercel Dashboard",
      description: "Manage deployments and projects",
      icon: "upload",
      category: "External Services",
      priority: 50,
      keywords: ["vercel", "deploy", "hosting", "production"],
      action: () => window.open("https://vercel.com/dashboard", "_blank"),
    },
    {
      id: "supabase-dashboard",
      name: "Supabase Dashboard",
      description: "Database and authentication management",
      icon: "jobs",
      category: "External Services",
      priority: 50,
      keywords: ["supabase", "database", "auth", "backend"],
      action: () => window.open("https://supabase.com/dashboard/project/vqkoxfenyjomillmxawh", "_blank"),
    },
  ];

  // Quick actions for power users
  const utilityActions: Action[] = [
    {
      id: "scroll-activity",
      name: "Jump to Activity Feed",
      description: "Scroll to activity section",
      icon: "clock",
      category: "Quick Actions",
      priority: 85,
      keywords: ["activity", "feed", "recent", "scroll"],
      action: () => {
        const el = document.getElementById("activity");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      id: "scroll-projects",
      name: "Jump to Projects",
      description: "Scroll to project grid",
      icon: "folder",
      category: "Quick Actions",
      priority: 85,
      keywords: ["projects", "grid", "cards", "scroll"],
      action: () => {
        const el = document.getElementById("search");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      id: "keyboard-shortcuts",
      name: "Keyboard Shortcuts",
      description: "Show all keyboard shortcuts",
      icon: "settings",
      category: "Quick Actions",
      priority: 75,
      keywords: ["keyboard", "shortcuts", "help", "keys"],
      shortcut: "?",
      action: () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
      },
    },
    {
      id: "refresh-page",
      name: "Refresh Dashboard",
      description: "Reload data from GitHub and database",
      icon: "settings",
      category: "Quick Actions",
      priority: 70,
      keywords: ["refresh", "reload", "update", "sync"],
      shortcut: "⌘R",
      action: () => window.location.reload(),
    },
  ];

  const allActions = [...navigationActions, ...utilityActions, ...projectActions, ...quickLinks];

  // Setup fuzzy search
  const fuse = new Fuse(allActions, {
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'description', weight: 0.3 },
      { name: 'keywords', weight: 0.3 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  // Enhanced filtering with fuzzy search and recent actions
  const filteredActions = (() => {
    if (!query) {
      // Show recent actions first when no query
      const recent = recentActions
        .map(id => allActions.find(a => a.id === id))
        .filter(Boolean) as Action[];
      const remaining = allActions.filter(a => !recentActions.includes(a.id));
      return [...recent, ...remaining];
    }
    
    // Use fuzzy search for queries
    const results = fuse.search(query);
    return results.map(result => result.item);
  })();

  // Enhanced grouping with recent actions
  const groupedActions = (() => {
    const groups: Record<string, Action[]> = {};
    
    if (!query) {
      // Show recent actions first when no query
      const recent = recentActions
        .map(id => allActions.find(a => a.id === id))
        .filter(Boolean) as Action[];
      
      if (recent.length > 0) {
        groups["Recent"] = recent;
      }
    }
    
    // Group remaining actions by category
    filteredActions.forEach(action => {
      // Skip if already in recent section
      if (!query && recentActions.includes(action.id)) return;
      
      const category = action.category || "Other";
      if (!groups[category]) groups[category] = [];
      groups[category].push(action);
    });
    
    return groups;
  })();

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
          executeAction(flatActions[selectedIndex]);
        }
      }
    },
    [flatActions, selectedIndex]
  );

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div 
          data-command-palette
          className="relative w-full max-w-2xl bg-[#080808] border border-[#1a1a1a] shadow-2xl overflow-hidden"
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
        >
          {/* Search input */}
          <div className="flex items-center gap-4 border-b border-[#1a1a1a] px-6 py-4">
            <Search className="w-4 h-4 text-[#444]" />
            
            <input
              ref={inputRef}
              type="text"
              placeholder="Search projects, actions, or jump to..."
              aria-label="Command palette search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-[#333] focus:outline-none"
            />
            
            <div className="flex items-center gap-2">
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="px-2 py-1 text-[11px] bg-[#111] text-[#555] hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
              
              <kbd className="hidden sm:block px-2 py-1 text-[10px] bg-[#111] text-[#333] font-mono">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[440px] overflow-y-auto">
            {isLoading ? (
              <div className="px-6 py-16 text-center">
                <p className="text-[#444] text-sm">Loading...</p>
              </div>
            ) : fetchError ? (
              <div className="px-6 py-16 text-center">
                <p className="text-red-400 text-sm">{fetchError}</p>
              </div>
            ) : flatActions.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-[#444] text-sm">No results for &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              <div>
                {Object.entries(groupedActions).map(([category, actions]) => (
                  <div key={category}>
                    <div className="px-6 py-2 text-[10px] uppercase tracking-wider text-[#333] font-mono bg-[#050505] sticky top-0 flex items-center gap-2">
                      {!query && category === "Recent" && <Zap size={10} />}
                      {category}
                    </div>
                    
                    {actions.map((action) => {
                      const index = currentIndex++;
                      const isRecent = !query && recentActions.includes(action.id);
                      
                      return (
                        <button
                          key={action.id}
                          onClick={() => executeAction(action)}
                          className={`flex w-full items-center gap-3 px-6 py-3 text-left transition-colors ${
                            index === selectedIndex
                              ? "bg-[#111] text-white"
                              : "text-[#666] hover:bg-[#0c0c0c] hover:text-[#999]"
                          }`}
                        >
                          <span className="w-6 flex items-center justify-center text-[#444]">
                            <Icon name={action.icon || "file"} size={15} />
                          </span>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate flex items-center gap-2">
                              {action.name}
                              {isRecent && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-[#111] text-[#444] font-mono">recent</span>
                              )}
                            </div>
                            {action.description && (
                              <div className="text-[11px] text-[#333] truncate mt-0.5">{action.description}</div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {action.shortcut && (
                              <kbd className="px-1.5 py-0.5 text-[10px] bg-[#111] text-[#333] font-mono">{action.shortcut}</kbd>
                            )}
                            {index === selectedIndex && (
                              <CornerDownLeft size={12} className="text-[#555]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#1a1a1a] px-6 py-3 flex items-center justify-between text-[10px] text-[#333] font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><ArrowUp size={10} /><ArrowDown size={10} /> nav</span>
              <span className="flex items-center gap-1"><CornerDownLeft size={10} /> select</span>
              <span>esc close</span>
            </div>
            <span>Cmd+K</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
