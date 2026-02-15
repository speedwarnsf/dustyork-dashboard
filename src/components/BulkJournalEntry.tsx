"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";

type Project = {
  id: string;
  name: string;
};

type BulkJournalEntryProps = {
  projects: Project[];
};

export default function BulkJournalEntry({ projects }: BulkJournalEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [entryType, setEntryType] = useState("note");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleProject = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map(p => p.id)));
    }
  };

  const submit = async () => {
    if (!content.trim() || selectedIds.size === 0) {
      toast.error("Write content and select at least one project");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Adding entry to ${selectedIds.size} project${selectedIds.size !== 1 ? "s" : ""}...`);

    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(projectId =>
          fetch(`/api/projects/${projectId}/journal`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.trim(), entry_type: entryType }),
          })
        )
      );

      const succeeded = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      if (failed === 0) {
        toast.success(`Entry added to ${succeeded} project${succeeded !== 1 ? "s" : ""}`, { id: toastId });
        setContent("");
        setSelectedIds(new Set());
        setIsOpen(false);
      } else {
        toast.error(`${succeeded} succeeded, ${failed} failed`, { id: toastId });
      }
    } catch {
      toast.error("Failed to add entries", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="border border-[#1a1a1a] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#555] hover:border-[#7bdcff] hover:text-[#7bdcff] transition"
      >
        Bulk Journal Entry
      </button>
    );
  }

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#888]">Bulk Journal Entry</h3>
        <button onClick={() => setIsOpen(false)} className="text-[#444] hover:text-white transition">
          <X size={16} />
        </button>
      </div>

      {/* Project selector */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-mono">
            Select Projects ({selectedIds.size}/{projects.length})
          </span>
          <button onClick={selectAll} className="text-[10px] text-[#555] hover:text-[#7bdcff] transition font-mono">
            {selectedIds.size === projects.length ? "Deselect All" : "Select All"}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => toggleProject(p.id)}
              className={`text-left px-3 py-2 text-xs border transition ${
                selectedIds.has(p.id)
                  ? "border-[#7bdcff]/40 bg-[#7bdcff]/5 text-[#7bdcff]"
                  : "border-[#1a1a1a] text-[#555] hover:border-[#333]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 border flex items-center justify-center ${
                  selectedIds.has(p.id) ? "border-[#7bdcff] bg-[#7bdcff]/20" : "border-[#333]"
                }`}>
                  {selectedIds.has(p.id) && <Check size={8} />}
                </span>
                <span className="truncate">{p.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Write an update that applies to all selected projects..."
        className="w-full bg-black border border-[#1c1c1c] px-4 py-3 text-sm text-[#ccc] focus:outline-none focus:border-[#7bdcff] resize-y mb-3"
      />

      <div className="flex items-center gap-3">
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value)}
          className="bg-black border border-[#1c1c1c] px-3 py-2 text-xs text-[#888]"
        >
          <option value="note">Note</option>
          <option value="milestone">Milestone</option>
          <option value="commit">Commit</option>
        </select>
        <button
          onClick={submit}
          disabled={isSubmitting || !content.trim() || selectedIds.size === 0}
          className="border border-[#1a1a1a] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#555] hover:border-[#d2ff5a] hover:text-[#d2ff5a] transition disabled:opacity-30"
        >
          {isSubmitting ? "Adding..." : `Add to ${selectedIds.size} Project${selectedIds.size !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
