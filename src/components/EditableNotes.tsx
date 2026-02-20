"use client";

import { useState, useRef, useCallback } from "react";
import { Pencil, Check, X } from "lucide-react";
import toast from "react-hot-toast";

type EditableNotesProps = {
  projectId: string;
  initialNotes: string;
};

export default function EditableNotes({ projectId, initialNotes }: EditableNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const cancel = useCallback(() => {
    setNotes(savedNotes);
    setIsEditing(false);
  }, [savedNotes]);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSavedNotes(notes);
      setIsEditing(false);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  }, [projectId, notes]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") cancel();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
  }, [cancel, save]);

  // Simple markdown-ish rendering for display mode
  const renderNotes = (text: string) => {
    if (!text) return <p className="text-[#444] text-sm italic">No notes yet. Click edit to add README or project notes.</p>;
    
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <h2 key={i} className="text-lg font-semibold mb-2 mt-4 first:mt-0">{line.slice(2)}</h2>;
      if (line.startsWith("## ")) return <h3 key={i} className="text-base font-semibold mb-1 mt-3">{line.slice(3)}</h3>;
      if (line.startsWith("### ")) return <h4 key={i} className="text-sm font-semibold mb-1 mt-2 text-[#999]">{line.slice(4)}</h4>;
      if (line.startsWith("- ")) return <li key={i} className="text-sm text-[#888] ml-4 list-disc">{line.slice(2)}</li>;
      if (line.trim() === "") return <br key={i} />;
      // Bold
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
      return <p key={i} className="text-sm text-[#888] mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">README / Notes</h3>
        {!isEditing ? (
          <button
            onClick={startEditing}
            className="flex items-center gap-1.5 text-[11px] text-[#555] border border-[#1a1a1a] px-3 py-1.5 hover:border-[#7bdcff] hover:text-[#7bdcff] transition"
          >
            <Pencil size={11} />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#333] font-mono">Cmd+Enter to save</span>
            <button
              onClick={cancel}
              className="flex items-center gap-1 text-[11px] text-[#555] border border-[#1a1a1a] px-2 py-1.5 hover:border-red-400 hover:text-red-400 transition"
            >
              <X size={11} />
            </button>
            <button
              onClick={save}
              disabled={isSaving}
              className="flex items-center gap-1 text-[11px] text-[#555] border border-[#1a1a1a] px-3 py-1.5 hover:border-[#d2ff5a] hover:text-[#d2ff5a] transition disabled:opacity-50"
            >
              <Check size={11} />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[200px] bg-black border border-[#1c1c1c] px-4 py-3 text-sm text-[#ccc] font-mono focus:outline-none focus:border-[#7bdcff] resize-y"
          placeholder="# Project Name&#10;&#10;Write your README or project notes here...&#10;&#10;## Getting Started&#10;- Step one&#10;- Step two"
        />
      ) : (
        <div className="prose-invert min-h-[60px] cursor-pointer" role="button" tabIndex={0} onClick={startEditing} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEditing(); } }} aria-label="Click to edit notes">
          {renderNotes(savedNotes)}
        </div>
      )}
    </div>
  );
}
