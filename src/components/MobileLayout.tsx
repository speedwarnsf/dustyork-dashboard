"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Home, Plus, Activity, Search, User, Menu, X, BarChart3, Download, Cpu } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

type MobileLayoutProps = {
  children: React.ReactNode;
};

const bottomNavItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Search, label: "Search", href: "#global-search" },
  { icon: Plus, label: "New", href: "/project/new" },
  { icon: Activity, label: "Activity", href: "#activity" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
];

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("/");
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => { setActiveTab(pathname); }, [pathname]);

  // Swipe to open sidebar
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    // Swipe right from left edge to open menu
    if (dx > 80 && dy < 60 && touchStartX.current < 30) {
      setIsMenuOpen(true);
    }
    // Swipe left to close menu
    if (dx < -80 && dy < 60 && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return (
    <div className="overflow-x-hidden">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-[#1a1a1a] px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-[#555] min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Menu size={18} />
          </button>
          <span className="text-sm font-medium text-[#777]">Command Center</span>
          <button
            onClick={() => window.dispatchEvent(new Event("open-global-search"))}
            className="p-2 -mr-2 text-[#555] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Search size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="pb-20 md:pb-0">
        {children}
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm border-t border-[#1a1a1a] md:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1.5">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.href;
            return (
              <button
                key={item.href}
                onClick={() => {
                  if (item.href === "#global-search") {
                    window.dispatchEvent(new Event("open-global-search"));
                  } else if (item.href.startsWith("#")) {
                    const target = document.querySelector(item.href);
                    if (target instanceof HTMLElement) {
                      target.scrollIntoView({ behavior: "smooth", block: "start" });
                      const input = target.querySelector("input");
                      if (input instanceof HTMLInputElement) setTimeout(() => input.focus(), 300);
                    }
                  } else {
                    router.push(item.href);
                    setActiveTab(item.href);
                  }
                }}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[44px] transition-colors ${isActive ? "text-white" : "text-[#444]"}`}
              >
                <Icon size={18} />
                <span className="text-[9px] font-mono">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Side menu */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/80 md:hidden" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] z-50 bg-[#080808] border-r border-[#1a1a1a] md:hidden">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-medium">Menu</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-[#555] min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              <nav className="space-y-1 flex-1">
                {[
                  { label: "Dashboard", href: "/", icon: Home },
                  { label: "Analytics", href: "/analytics", icon: BarChart3 },
                  { label: "Io Panel", href: "/io", icon: Cpu },
                  { label: "New Project", href: "/project/new", icon: Plus },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 py-3 px-3 text-sm text-[#777] hover:text-white hover:bg-[#111] transition-colors min-h-[44px]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ItemIcon size={16} />
                      {item.label}
                    </a>
                  );
                })}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.dispatchEvent(new Event("open-global-search"));
                  }}
                  className="flex items-center gap-3 py-3 px-3 text-sm text-[#777] hover:text-white hover:bg-[#111] transition-colors min-h-[44px] w-full text-left"
                >
                  <Search size={16} />
                  Global Search
                  <kbd className="ml-auto text-[10px] text-[#333] font-mono">Cmd+Shift+F</kbd>
                </button>
              </nav>
              <div className="pt-4 border-t border-[#1a1a1a]">
                <p className="text-[10px] text-[#333] font-mono">Swipe right from edge to open</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
