"use client";

import Link from "next/link";

export default function Header() {
  const triggerCommandPalette = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex items-center gap-6">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7bdcff] to-[#d2ff5a] flex items-center justify-center">
          <span className="text-black font-bold text-sm">D</span>
        </div>
        <h1 className="text-lg font-semibold group-hover:text-[#7bdcff] transition">
          Command Center
        </h1>
      </Link>
      
      {/* Quick search hint */}
      <button 
        onClick={triggerCommandPalette}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1c1c1c] text-sm text-[#8b8b8b] hover:border-[#7bdcff] hover:text-[#7bdcff] transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search...</span>
        <kbd className="px-1.5 py-0.5 text-xs rounded bg-[#1c1c1c] text-[#666]">⌘K</kbd>
      </button>
    </div>
  );
}
