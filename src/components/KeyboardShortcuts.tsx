"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

type Project = {
  id: string;
  name: string;
};

type Props = {
  projects: Project[];
};

export default function KeyboardShortcuts({ projects }: Props) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalContent, setJournalContent] = useState("");
  const [journalProjectId, setJournalProjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Highlight the selected project card in the DOM
  useEffect(() => {
    const cards = document.querySelectorAll("[data-project-id]");
    cards.forEach((card, i) => {
      if (i === selectedIndex) {
        card.classList.add("ring-2", "ring-[#7bdcff]", "ring-offset-2", "ring-offset-black");
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        card.classList.remove("ring-2", "ring-[#7bdcff]", "ring-offset-2", "ring-offset-black");
      }
    });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when typing in inputs/textareas or when modals are open
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't capture when command palette is open
      if (document.querySelector("[data-command-palette]")) return;

      const cards = document.querySelectorAll("[data-project-id]");
      const maxIndex = cards.length - 1;

      switch (e.key) {
        case "j": // Next project
          e.preventDefault();
          setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
          break;

        case "k": // Previous project
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
          break;

        case "Enter": // Open selected project
          if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
            e.preventDefault();
            const card = cards[selectedIndex];
            const projectId = card.getAttribute("data-project-id");
            if (projectId) router.push(`/project/${projectId}`);
          }
          break;

        case "g": // Go to dashboard
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            router.push("/");
          }
          break;

        case "n": // New journal entry (quick add)
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
              const card = cards[selectedIndex];
              const projectId = card.getAttribute("data-project-id");
              if (projectId) {
                setJournalProjectId(projectId);
                setShowJournalModal(true);
              }
            } else if (projects.length > 0) {
              setJournalProjectId(projects[0].id);
              setShowJournalModal(true);
            }
          }
          break;

        case "?": // Show keyboard shortcuts help
          e.preventDefault();
          setShowHelp((prev) => !prev);
          break;

        case "Escape":
          setSelectedIndex(-1);
          setShowHelp(false);
          setShowJournalModal(false);
          break;
      }
    },
    [selectedIndex, projects, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleJournalSubmit = async () => {
    if (!journalContent.trim() || !journalProjectId) return;
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("content", journalContent);
      form.append("entry_type", "note");
      await fetch(`/api/projects/${journalProjectId}/journal`, {
        method: "POST",
        body: JSON.stringify({ content: journalContent, entry_type: "note" }),
        headers: { "Content-Type": "application/json" },
      });
      setJournalContent("");
      setShowJournalModal(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to add journal entry:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Keyboard shortcuts help overlay */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setShowHelp(false)}
            />
            <motion.div
              className="relative w-full max-w-md rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-8 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Keyboard size={20} className="text-[#7bdcff]" />
                  <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 rounded-lg hover:bg-[#1c1c1c] transition"
                >
                  <X size={18} className="text-[#666]" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "⌘K", desc: "Open command palette" },
                  { key: "j / k", desc: "Navigate between projects" },
                  { key: "Enter", desc: "Open selected project" },
                  { key: "n", desc: "Quick-add journal entry" },
                  { key: "g", desc: "Go to dashboard" },
                  { key: "?", desc: "Toggle this help" },
                  { key: "Esc", desc: "Clear selection / close" },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-[#8b8b8b]">{desc}</span>
                    <kbd className="px-2 py-1 text-xs rounded bg-[#1c1c1c] text-[#7bdcff] border border-[#333] font-mono">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick journal entry modal */}
      <AnimatePresence>
        {showJournalModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setShowJournalModal(false)}
            />
            <motion.div
              className="relative w-full max-w-lg rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Quick Journal Entry</h3>
              <select
                value={journalProjectId}
                onChange={(e) => setJournalProjectId(e.target.value)}
                className="w-full mb-3 rounded-xl border border-[#1c1c1c] bg-black px-4 py-2 text-sm focus:outline-none focus:border-[#7bdcff]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <textarea
                autoFocus
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                rows={4}
                placeholder="Log progress, blockers, or insights..."
                className="w-full rounded-xl border border-[#1c1c1c] bg-black px-4 py-3 text-sm focus:outline-none focus:border-[#7bdcff]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleJournalSubmit();
                  }
                }}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-[#555]">⌘Enter to submit</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowJournalModal(false)}
                    className="px-4 py-2 text-sm rounded-xl border border-[#1c1c1c] text-[#8b8b8b] hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJournalSubmit}
                    disabled={isSubmitting || !journalContent.trim()}
                    className="px-4 py-2 text-sm rounded-xl bg-[#7bdcff] text-black font-medium disabled:opacity-50 hover:bg-[#a5ebff] transition"
                  >
                    {isSubmitting ? "Adding..." : "Add Entry"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating shortcut hint */}
      <div className="fixed bottom-6 right-6 z-30 hidden md:block">
        <button
          onClick={() => setShowHelp(true)}
          className="px-3 py-2 rounded-xl border border-[#1c1c1c] bg-[#0a0a0a]/80 backdrop-blur text-xs text-[#555] hover:text-[#7bdcff] hover:border-[#7bdcff]/30 transition flex items-center gap-2"
        >
          <Keyboard size={14} />
          <span>Press <kbd className="text-[#7bdcff]">?</kbd> for shortcuts</span>
        </button>
      </div>
    </>
  );
}
