"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

type Action = {
  id: string;
  name: string;
  description?: string;
  action: () => void;
  icon?: string;
};

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch projects on mount
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch(console.error);
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
  const staticActions: Action[] = [
    {
      id: "new-project",
      name: "New Project",
      description: "Create a new project",
      icon: "➕",
      action: () => router.push("/project/new"),
    },
    {
      id: "dashboard",
      name: "Dashboard",
      description: "Go to dashboard",
      icon: "🏠",
      action: () => router.push("/"),
    },
  ];

  const projectActions: Action[] = projects.map((project) => ({
    id: `view-${project.id}`,
    name: project.name,
    description: project.description || project.status,
    icon: "📁",
    action: () => router.push(`/project/${project.id}`),
  }));

  const allActions = [...staticActions, ...projectActions];

  // Filter actions by query
  const filteredActions = query
    ? allActions.filter(
        (action) =>
          action.name.toLowerCase().includes(query.toLowerCase()) ||
          action.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allActions;

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredActions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredActions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          setIsOpen(false);
        }
      }
    },
    [filteredActions, selectedIndex]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[#1c1c1c] px-4 py-3">
          <span className="text-[#8b8b8b]">⌘K</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects or actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder:text-[#555] focus:outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#8b8b8b]">
              No results found
            </div>
          ) : (
            filteredActions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
                className={`
                  flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition
                  ${
                    index === selectedIndex
                      ? "bg-[#1c1c1c] text-white"
                      : "text-[#8b8b8b] hover:bg-[#1c1c1c] hover:text-white"
                  }
                `}
              >
                <span className="text-lg">{action.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{action.name}</div>
                  {action.description && (
                    <div className="text-xs text-[#555]">{action.description}</div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[#1c1c1c] px-4 py-2 text-xs text-[#555]">
          ↑↓ navigate • ↵ select • esc close
        </div>
      </div>
    </div>
  );
}
