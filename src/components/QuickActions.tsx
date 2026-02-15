"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, BookOpen, Camera, Moon, Sun, Search, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const actions = [
    {
      icon: BookOpen,
      label: "New Journal",
      color: "text-[#d2ff5a]",
      action: () => {
        const el = document.querySelector("[data-bulk-journal]");
        if (el) el.scrollIntoView({ behavior: "smooth" });
        else window.location.href = "/#bulk-journal";
        setIsOpen(false);
      },
    },
    {
      icon: Camera,
      label: "Refresh Screenshots",
      color: "text-[#7bdcff]",
      action: async () => {
        setIsOpen(false);
        try {
          const res = await fetch("/api/screenshots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ all: true }),
          });
          if (res.ok) {
            const toast = (await import("react-hot-toast")).default;
            toast.success("Screenshots refreshing");
          }
        } catch {
          // silent
        }
      },
    },
    {
      icon: typeof window !== "undefined" && document.documentElement.classList.contains("light-mode") ? Moon : Sun,
      label: "Toggle Dark Mode",
      color: "text-[#f4b26a]",
      action: () => {
        document.documentElement.classList.toggle("light-mode");
        localStorage.setItem(
          "theme",
          document.documentElement.classList.contains("light-mode") ? "light" : "dark"
        );
        setIsOpen(false);
      },
    },
    {
      icon: Search,
      label: "Global Search",
      color: "text-[#999]",
      action: () => {
        window.dispatchEvent(new Event("open-global-search"));
        setIsOpen(false);
      },
    },
    {
      icon: BarChart3,
      label: "Analytics",
      color: "text-[#7bdcff]",
      action: () => {
        window.location.href = "/analytics";
        setIsOpen(false);
      },
    },
  ];

  return (
    <div ref={containerRef} className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-16 right-0 mb-2 w-52"
          >
            <div className="border border-[#1a1a1a] bg-[#080808] shadow-2xl overflow-hidden">
              {actions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <button
                    key={i}
                    onClick={a.action}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#666] hover:bg-[#111] hover:text-white transition text-left"
                  >
                    <Icon size={14} className={a.color} />
                    {a.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 flex items-center justify-center border shadow-lg transition-all ${
          isOpen
            ? "bg-white text-black border-white"
            : "bg-[#080808] text-[#999] border-[#1a1a1a] hover:border-[#333] hover:text-white"
        }`}
      >
        {isOpen ? <X size={18} /> : <Plus size={18} />}
      </button>
    </div>
  );
}
