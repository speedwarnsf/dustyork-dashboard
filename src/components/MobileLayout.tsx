"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { Menu, X, ChevronUp, Search, Bell, User, Home, Plus, Activity, RefreshCw } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

type MobileLayoutProps = {
  children: React.ReactNode;
};

const bottomNavItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Plus, label: "New Project", href: "/project/new" },
  { icon: Activity, label: "Activity", href: "#activity" },
  { icon: Search, label: "Search", href: "#search" },
  { icon: User, label: "Profile", href: "#profile" },
];

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("/");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const pullOpacity = useTransform(pullY, [0, 60], [0, 1]);
  const pullRotation = useTransform(pullY, [0, 60], [0, 360]);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  // Pull to refresh handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop === 0 && !isRefreshing) {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY > 0) {
        pullY.set(Math.min(deltaY * 0.5, 80));
      }
    }
  }, [isRefreshing, pullY]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY.get() > 50 && !isRefreshing) {
      setIsRefreshing(true);
      pullY.set(60);
      // Actual refresh
      router.refresh();
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsRefreshing(false);
    }
    pullY.set(0);
  }, [pullY, isRefreshing, router]);

  return (
    <div className="overflow-x-hidden">
      {/* Mobile header */}
      <motion.header 
        className="sticky top-0 z-40 glass-strong border-b border-[#1c1c1c]/50 px-4 py-3 md:hidden"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-xl hover:bg-[#1c1c1c] transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={20} />
          </motion.button>
          
          <motion.h1 
            className="text-lg font-semibold"
            layoutId="page-title"
          >
            Command Center
          </motion.h1>
          
          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 rounded-xl hover:bg-[#1c1c1c] transition-colors relative"
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#d2ff5a] rounded-full"></span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Pull to refresh indicator (mobile only) */}
      <motion.div 
        className="flex items-center justify-center py-2 md:hidden overflow-hidden"
        style={{ height: pullY, opacity: pullOpacity }}
      >
        <motion.div style={{ rotate: pullRotation }}>
          <RefreshCw size={20} className={`text-[#7bdcff] ${isRefreshing ? "animate-spin" : ""}`} />
        </motion.div>
      </motion.div>

      {/* Main content */}
      <div 
        ref={contentRef}
        className="pb-20 md:pb-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Bottom navigation (mobile only) */}
      <motion.nav 
        className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-[#1c1c1c]/50 md:hidden"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.href;
            
            return (
              <motion.button
                key={item.href}
                onClick={() => {
                  if (item.href.startsWith("#")) {
                    // Handle special actions
                  if (item.href === "#search") {
                      const target = document.querySelector(item.href);
                      if (target instanceof HTMLElement) {
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                        const input = target.querySelector("input");
                        if (input instanceof HTMLInputElement) {
                          setTimeout(() => input.focus(), 300);
                        }
                      } else {
                        // Trigger command palette fallback
                        const event = new KeyboardEvent("keydown", {
                          key: "k",
                          metaKey: true,
                          bubbles: true,
                        });
                        window.dispatchEvent(event);
                      }
                    } else if (item.href === "#activity") {
                      const target = document.querySelector(item.href);
                      if (target instanceof HTMLElement) {
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                      } else {
                        setIsBottomSheetOpen(true);
                      }
                    }
                  } else {
                    router.push(item.href);
                    setActiveTab(item.href);
                  }
                }}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                  isActive 
                    ? "text-[#7bdcff] bg-[#7bdcff]/10" 
                    : "text-[#8b8b8b] hover:text-white"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <Icon size={20} />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div 
                    className="w-1 h-1 bg-[#7bdcff] rounded-full"
                    layoutId="bottom-nav-indicator"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      {/* Side menu overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-50 glass-strong border-r border-[#1c1c1c]/50 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-semibold">Menu</h2>
                  <motion.button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-[#1c1c1c] transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={20} />
                  </motion.button>
                </div>
                
                {/* Menu items */}
                <nav className="space-y-2">
                  {[
                    { label: "Dashboard", href: "/" },
                    { label: "New Project", href: "/project/new" },
                    { label: "Activity", href: "#activity" },
                  ].map((item) => (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      className="block p-3 rounded-xl hover:bg-[#1c1c1c] transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                      whileHover={{ x: 4 }}
                    >
                      {item.label}
                    </motion.a>
                  ))}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom sheet for quick actions */}
      <AnimatePresence>
        {isBottomSheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBottomSheetOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 glass-strong rounded-t-3xl max-h-[80vh] md:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) {
                  setIsBottomSheetOpen(false);
                }
              }}
            >
              <div className="p-6">
                {/* Handle */}
                <div className="w-12 h-1 bg-[#333] rounded-full mx-auto mb-4" />
                
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ChevronUp size={18} />
                  Quick Actions
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "New Project", icon: Plus, action: () => router.push("/project/new") },
                    { label: "Search", icon: Search, action: () => {/* Trigger search */} },
                    { label: "Activity", icon: Activity, action: () => {/* Show activity */} },
                    { label: "Settings", icon: User, action: () => {/* Show settings */} },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.label}
                        onClick={() => {
                          item.action();
                          setIsBottomSheetOpen(false);
                        }}
                        className="p-4 rounded-2xl bg-[#1c1c1c] hover:bg-[#333] transition-colors flex flex-col items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon size={24} className="text-[#7bdcff]" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
