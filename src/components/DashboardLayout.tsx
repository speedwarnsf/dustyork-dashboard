"use client";

import { useState, useEffect, useCallback } from "react";
import { GripVertical, Eye, EyeOff, RotateCcw } from "lucide-react";

type Widget = {
  id: string;
  label: string;
  visible: boolean;
};

const DEFAULT_WIDGETS: Widget[] = [
  { id: "pulse", label: "Project Pulse", visible: true },
  { id: "focus", label: "Focus Suggestion", visible: true },
  { id: "stats", label: "Stats Row", visible: true },
  { id: "comparison", label: "Project Comparison", visible: true },
  { id: "projects", label: "Projects Grid", visible: true },
  { id: "intelligence", label: "Intelligence", visible: true },
  { id: "digest-gantt", label: "Weekly Digest + Gantt", visible: true },
  { id: "timeline", label: "Unified Timeline", visible: true },
  { id: "recent", label: "Recent Activity", visible: true },
  { id: "bulk-journal", label: "Bulk Journal", visible: true },
  { id: "activity-attention", label: "Activity + Attention", visible: true },
];

const STORAGE_KEY = "dashboard-widget-layout";

function loadLayout(): Widget[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(saved) as Widget[];
    // Merge with defaults to pick up new widgets
    const ids = new Set(parsed.map((w) => w.id));
    const merged = [
      ...parsed,
      ...DEFAULT_WIDGETS.filter((w) => !ids.has(w.id)),
    ];
    return merged;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

function saveLayout(widgets: Widget[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

type Props = {
  children: Record<string, React.ReactNode>;
};

export default function CustomizableDashboardLayout({ children }: Props) {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [isEditing, setIsEditing] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    setWidgets(loadLayout());
  }, []);

  const updateWidgets = useCallback((updated: Widget[]) => {
    setWidgets(updated);
    saveLayout(updated);
  }, []);

  const toggleVisibility = (id: string) => {
    updateWidgets(widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const resetLayout = () => {
    updateWidgets(DEFAULT_WIDGETS);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...widgets];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setDragIndex(index);
    updateWidgets(updated);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <>
      {/* Edit toggle */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-2 flex justify-end">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`text-[11px] px-3 py-1.5 border transition ${
            isEditing
              ? "border-[#7bdcff]/30 text-[#7bdcff] bg-[#7bdcff]/5"
              : "border-[#1a1a1a] text-[#444] hover:text-[#777] hover:border-[#333]"
          }`}
        >
          {isEditing ? "Done Editing" : "Customize Layout"}
        </button>
      </div>

      {/* Widget editor panel */}
      {isEditing && (
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-3">
          <div className="border border-[#1a1a1a] bg-[#080808] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-[#555] font-mono">
                Drag to reorder -- click eye to toggle
              </span>
              <button
                onClick={resetLayout}
                className="flex items-center gap-1 text-[11px] text-[#444] hover:text-[#999] transition"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>
            <div className="space-y-1">
              {widgets.map((w, i) => (
                <div
                  key={w.id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 px-3 py-2 border border-transparent hover:border-[#1a1a1a] hover:bg-[#0c0c0c] transition cursor-grab active:cursor-grabbing ${
                    dragIndex === i ? "opacity-50" : ""
                  } ${!w.visible ? "opacity-40" : ""}`}
                >
                  <GripVertical size={12} className="text-[#333]" />
                  <span className="flex-1 text-xs text-[#999]">{w.label}</span>
                  <button onClick={() => toggleVisibility(w.id)} className="p-1 text-[#444] hover:text-white transition">
                    {w.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Render widgets in order */}
      {widgets.filter((w) => w.visible && children[w.id]).map((w) => (
        <div key={w.id} className={isEditing ? "relative ring-1 ring-[#1a1a1a] ring-offset-0" : ""}>
          {children[w.id]}
        </div>
      ))}
    </>
  );
}
