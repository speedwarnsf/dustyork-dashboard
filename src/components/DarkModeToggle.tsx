"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle() {
  const [mode, setMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      setMode("light");
      document.documentElement.classList.add("light-mode");
    }
  }, []);

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    localStorage.setItem("theme", next);
    if (next === "light") {
      document.documentElement.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light-mode");
    }
  };

  return (
    <button
      onClick={toggle}
      className="border border-[#1a1a1a] px-2.5 py-1.5 text-[#555] hover:text-white hover:border-[#333] transition flex items-center gap-1.5"
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark mode"
    >
      {mode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
