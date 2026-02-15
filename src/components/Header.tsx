"use client";

import Link from "next/link";

export default function Header() {
  const triggerCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  };

  return (
    <div className="flex items-center gap-5">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-7 h-7 bg-white flex items-center justify-center">
          <span className="text-black font-bold text-xs">D</span>
        </div>
        <span className="text-sm font-medium text-[#777] group-hover:text-white transition">
          Command Center
        </span>
      </Link>

      <Link
        href="/roadmap"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a1a] text-[11px] text-[#444] hover:border-[#333] hover:text-[#d2ff5a] transition"
      >
        <span>Roadmap</span>
      </Link>

      <Link
        href="/goals"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a1a] text-[11px] text-[#444] hover:border-[#333] hover:text-[#d2ff5a] transition"
      >
        <span>Goals</span>
      </Link>

      <Link
        href="/io"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a1a] text-[11px] text-[#444] hover:border-[#333] hover:text-[#d2ff5a] transition"
      >
        <span>Io</span>
      </Link>

      <Link
        href="/changelog"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a1a] text-[11px] text-[#444] hover:border-[#333] hover:text-[#d2ff5a] transition"
      >
        <span>What&apos;s New</span>
      </Link>

      <button
        onClick={triggerCommandPalette}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-[#1a1a1a] text-[11px] text-[#444] hover:border-[#333] hover:text-[#666] transition"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search</span>
        <kbd className="px-1 py-0.5 text-[10px] bg-[#111] text-[#333] font-mono">Cmd+K</kbd>
      </button>
    </div>
  );
}
