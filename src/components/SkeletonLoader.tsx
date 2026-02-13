"use client";

import { motion } from "framer-motion";

type SkeletonProps = {
  width?: string;
  height?: string;
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
};

export function Skeleton({ width = "100%", height = "1rem", className = "", variant = "rectangular" }: SkeletonProps) {
  const baseClasses = "shimmer";
  
  const variantClasses = {
    text: "h-4",
    circular: "rounded-none aspect-square",
    rectangular: "rounded-none",
    card: "rounded-none"
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height: variant === "circular" ? width : height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <motion.div 
      className="glass-strong rounded-none p-5 flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Screenshot skeleton */}
      <Skeleton height="176px" className="mb-4 rounded-none" />
      
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Skeleton width="8px" height="8px" variant="circular" />
          <Skeleton width="150px" height="24px" />
        </div>
        <Skeleton width="60px" height="20px" className="rounded-none" />
      </div>
      
      {/* Description skeleton */}
      <div className="space-y-2 mb-4 flex-1">
        <Skeleton width="100%" height="16px" />
        <Skeleton width="80%" height="16px" />
      </div>
      
      {/* Meta info skeleton */}
      <div className="pt-4 border-t border-[#1c1c1c]/50">
        <div className="flex items-center justify-between">
          <Skeleton width="80px" height="12px" />
          <div className="flex items-center gap-3">
            <Skeleton width="40px" height="12px" />
            <Skeleton width="30px" height="12px" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <motion.div 
      className="glass-strong rounded-none p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton width="140px" height="24px" />
        <div className="flex gap-2">
          <Skeleton width="80px" height="32px" className="rounded-none" />
          <Skeleton width="32px" height="32px" className="rounded-none" />
        </div>
      </div>
      
      {/* Activity items skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton width="32px" height="32px" className="rounded-none" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton width="100px" height="16px" />
                <Skeleton width="40px" height="16px" className="rounded-none" />
              </div>
              <Skeleton width="80%" height="16px" />
              <Skeleton width="60px" height="12px" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <motion.div 
      className="glass-strong rounded-none p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Skeleton width="60px" height="12px" className="mb-2" />
      <Skeleton width="40px" height="32px" className="mb-1" />
      <Skeleton width="80px" height="12px" />
    </motion.div>
  );
}