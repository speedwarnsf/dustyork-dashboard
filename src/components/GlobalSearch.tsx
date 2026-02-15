"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";

type SearchResult = {
  id: string;
  type: "journal" | "milestone" | "project";
  title: string;
  snippet: string;
  projectName: string;
  projectId: string;
  date: string;
};

type Props = {
  items: SearchResult[];
};

export default function GlobalSearch({ items }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [typeFilter, setTypeFilter] = useState<"all" | "journal" | "milestone" | "project">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = new Fuse(items, {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "snippet", weight: 0.3 },
      { name: "projectName", weight: 0.3 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  const results = query
    ? fuse.search(query).map((r) => r.item)
    : items.slice(0, 20);

  const filtered = typeFilter === "all" ? results : results.filter((r) => r.type === typeFilter);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        setIsOpen((p) => !p);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    const openHandler = () => setIsOpen(true);
    window.addEventListener("keydown", handler);
    window.addEventListener("open-global-search", openHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-global-search", openHandler);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((p) => (p < filtered.length - 1 ? p + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((p) => (p > 0 ? p - 1 : filtered.length - 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        window.location.href = `/project/${filtered[selectedIndex].projectId}`;
        setIsOpen(false);
      }
    },
    [filtered, selectedIndex]
  );

  const typeColors: Record<string, string> = {
    journal: "text-[#d2ff5a] border-[#d2ff5a]/20",
    milestone: "text-[#7bdcff] border-[#7bdcff]/20",
    project: "text-[#f4b26a] border-[#f4b26a]/20",
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
        <motion.div
          className="relative w-full max-w-2xl bg-[#080808] border border-[#1a1a1a] shadow-2xl overflow-hidden"
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
        >
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-[#1a1a1a] px-6 py-4">
            <Search className="w-4 h-4 text-[#444]" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search journal entries, milestones, projects..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-[#333] focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-[#444] hover:text-white transition">
                <X size={14} />
              </button>
            )}
            <kbd className="hidden sm:block px-2 py-1 text-[10px] bg-[#111] text-[#333] font-mono">ESC</kbd>
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-1 px-6 py-2 border-b border-[#1a1a1a]/50">
            {(["all", "journal", "milestone", "project"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setSelectedIndex(0); }}
                className={`px-2.5 py-1 text-[10px] uppercase tracking-wider transition ${
                  typeFilter === t ? "bg-[#1a1a1a] text-white" : "text-[#444] hover:text-[#777]"
                }`}
              >
                {t}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-[#333] font-mono">{filtered.length} results</span>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-[#333]">
                {query ? `No results for "${query}"` : "No items to search"}
              </div>
            ) : (
              filtered.slice(0, 50).map((item, i) => (
                <a
                  key={item.id}
                  href={`/project/${item.projectId}`}
                  className={`flex items-start gap-3 px-6 py-3 transition-colors ${
                    i === selectedIndex ? "bg-[#111] text-white" : "text-[#666] hover:bg-[#0c0c0c]"
                  }`}
                >
                  <span className={`shrink-0 mt-0.5 text-[9px] uppercase tracking-wider border px-1.5 py-0.5 ${typeColors[item.type]}`}>
                    {item.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{item.title}</div>
                    <div className="text-[11px] text-[#444] truncate mt-0.5">{item.snippet}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[#333]">
                      <span>{item.projectName}</span>
                      <span>--</span>
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {i === selectedIndex && <CornerDownLeft size={12} className="text-[#555] mt-1 shrink-0" />}
                </a>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#1a1a1a] px-6 py-2.5 flex items-center justify-between text-[10px] text-[#333] font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><ArrowUp size={10} /><ArrowDown size={10} /> nav</span>
              <span className="flex items-center gap-1"><CornerDownLeft size={10} /> open</span>
            </div>
            <span>Cmd+Shift+F</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
