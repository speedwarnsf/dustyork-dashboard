"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Home, Plus, Activity, Search, User, Menu, X, RefreshCw } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

type MobileLayoutProps = {
  children: React.ReactNode;
};

const bottomNavItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Plus, label: "New", href: "/project/new" },
  { icon: Activity, label: "Activity", href: "#activity" },
  { icon: Search, label: "Search", href: "#search" },
  { icon: User, label: "Profile", href: "#profile" },
];

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("/");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { setActiveTab(pathname); }, [pathname]);

  return (
    <div className="overflow-x-hidden">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-[#1a1a1a] px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 text-[#555]">
            <Menu size={18} />
          </button>
          <span className="text-sm font-medium text-[#777]">Command Center</span>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <div className="pb-20 md:pb-0">
        {children}
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm border-t border-[#1a1a1a] md:hidden">
        <div className="flex items-center justify-around px-2 py-1.5">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.href;
            return (
              <button
                key={item.href}
                onClick={() => {
                  if (item.href.startsWith("#")) {
                    const target = document.querySelector(item.href);
                    if (target instanceof HTMLElement) {
                      target.scrollIntoView({ behavior: "smooth", block: "start" });
                      const input = target.querySelector("input");
                      if (input instanceof HTMLInputElement) setTimeout(() => input.focus(), 300);
                    } else if (item.href === "#search") {
                      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
                    }
                  } else {
                    router.push(item.href);
                    setActiveTab(item.href);
                  }
                }}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${isActive ? "text-white" : "text-[#444]"}`}
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
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-medium">Menu</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-[#555]">
                  <X size={16} />
                </button>
              </div>
              <nav className="space-y-1">
                {[
                  { label: "Dashboard", href: "/" },
                  { label: "New Project", href: "/project/new" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block py-2.5 px-3 text-sm text-[#777] hover:text-white hover:bg-[#111] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
