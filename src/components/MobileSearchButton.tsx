"use client";

import { Search } from "lucide-react";

export default function MobileSearchButton() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <>
      {/* Mobile: icon button */}
      <button
        onClick={handleClick}
        className="sm:hidden flex items-center justify-center border border-[#1a1a1a] w-10 h-10 text-[#555] hover:border-[#333] hover:text-[#999] transition"
        aria-label="Search"
      >
        <Search size={16} />
      </button>
      {/* Desktop: Cmd+K hint */}
      <button
        onClick={handleClick}
        className="hidden sm:flex items-center gap-2 border border-[#1a1a1a] px-3 py-2 text-xs text-[#555] hover:border-[#333] hover:text-[#999] transition"
      >
        <Search size={12} />
        <kbd className="text-[10px] text-[#444] font-mono">Cmd+K</kbd>
      </button>
    </>
  );
}
