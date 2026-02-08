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

  const allActions = [...navigationActions, ...projectActions, ...quickLinks];

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
        {/* Enhanced backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          onClick={() => setIsOpen(false)}
          initial={{ backdropFilter: "blur(0px)" }}
          animate={{ backdropFilter: "blur(20px)" }}
        />

        {/* Enhanced modal */}
        <motion.div 
          className="relative w-full max-w-2xl glass-strong rounded-3xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20 }}
          style={{ boxShadow: 'var(--shadow-premium)' }}
        >
          {/* Enhanced search input */}
          <div className="flex items-center gap-4 border-b border-[#1c1c1c]/50 px-6 py-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Search className="w-5 h-5 text-[#7bdcff]" />
            </motion.div>
            
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
            
            <div className="flex items-center gap-2">
              {query && (
                <motion.button
                  onClick={() => setQuery("")}
                  className="px-2 py-1 text-xs rounded bg-[#1c1c1c] text-[#8b8b8b] hover:text-white transition-colors"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  Clear
                </motion.button>
              )}
              
              <kbd className="hidden sm:block px-2 py-1 text-xs rounded bg-[#1c1c1c] text-[#666] border border-[#333]">
                ESC
              </kbd>
            </div>
          </div>

          {/* Enhanced results */}
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <motion.div 
                className="px-6 py-16 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="inline-block w-8 h-8 border-3 border-[#7bdcff] border-t-transparent rounded-full mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-[#8b8b8b]">Loading projects...</p>
              </motion.div>
            ) : fetchError ? (
              <motion.div 
                className="px-6 py-16 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-red-400 flex items-center justify-center gap-2">
                  <Icon name="warning" size={16} />
                  {fetchError}
                </p>
                <p className="text-sm text-[#555] mt-2">Try refreshing the page</p>
              </motion.div>
            ) : flatActions.length === 0 ? (
              <motion.div 
                className="px-6 py-16 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-[#8b8b8b]">No results for &ldquo;{query}&rdquo;</p>
                <p className="text-sm text-[#555] mt-2">Try a different search term</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {Object.entries(groupedActions).map(([category, actions], categoryIndex) => (
                  <motion.div 
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.05 }}
                  >
                    <div className="px-6 py-3 text-xs uppercase tracking-wider text-[#7bdcff] bg-black/30 sticky top-0 backdrop-blur-sm flex items-center gap-2">
                      {!query && category === "Recent" && <Zap size={12} />}
                      {category}
                      <span className="ml-auto text-[#555]">{actions.length}</span>
                    </div>
                    
                    {actions.map((action, actionIndex) => {
                      const index = currentIndex++;
                      const isRecent = !query && recentActions.includes(action.id);
                      
                      return (
                        <motion.button
                          key={action.id}
                          onClick={() => executeAction(action)}
                          className={`
                            flex w-full items-center gap-4 px-6 py-4 text-left transition-all duration-200
                            ${
                              index === selectedIndex
                                ? "bg-gradient-to-r from-[#7bdcff]/20 to-[#d2ff5a]/20 text-white border-r-2 border-[#7bdcff]"
                                : "text-[#8b8b8b] hover:bg-[#1c1c1c]/50 hover:text-white"
                            }
                          `}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: categoryIndex * 0.05 + actionIndex * 0.02 }}
                          whileHover={{ x: 4 }}
                        >
                          <span className="w-8 flex items-center justify-center text-[#8b8b8b]">
                            <Icon name={action.icon || "file"} size={18} />
                          </span>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate flex items-center gap-2">
                              {action.name}
                              {isRecent && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#7bdcff]/20 text-[#7bdcff]">
                                  Recent
                                </span>
                              )}
                            </div>
                            {action.description && (
                              <div className="text-xs text-[#555] truncate mt-0.5">
                                {action.description}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {action.shortcut && (
                              <kbd className="px-2 py-1 text-xs rounded bg-[#1c1c1c] text-[#666] border border-[#333]">
                                {action.shortcut}
                              </kbd>
                            )}
                            {index === selectedIndex && (
                              <CornerDownLeft size={14} className="text-[#7bdcff]" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Enhanced footer */}
          <motion.div 
            className="border-t border-[#1c1c1c]/50 px-6 py-4 glass flex items-center justify-between text-xs text-[#555]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <ArrowUp size={12} />
                <ArrowDown size={12} />
                <span>navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <CornerDownLeft size={12} />
                <span>select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 text-[10px] rounded bg-[#1c1c1c] border border-[#333]">ESC</kbd>
                <span>close</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span>⌘K to toggle</span>
              {filteredActions.length > 0 && (
                <span className="px-2 py-1 rounded bg-[#1c1c1c] text-[#7bdcff]">
                  {filteredActions.length} results
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
