"use client";

type SkeletonProps = {
  width?: string;
  height?: string;
  className?: string;
};

export function Skeleton({ width = "100%", height = "1rem", className = "" }: SkeletonProps) {
  return <div className={`shimmer ${className}`} style={{ width, height }} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="border border-[#1a1a1a] bg-[#080808] flex flex-col h-full">
      <Skeleton height="192px" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Skeleton width="140px" height="20px" />
          <Skeleton width="50px" height="16px" />
        </div>
        <div className="space-y-2 mb-4">
          <Skeleton width="100%" height="14px" />
          <Skeleton width="75%" height="14px" />
        </div>
        <div className="pt-3 border-t border-[#1a1a1a]/50 flex justify-between">
          <Skeleton width="70px" height="12px" />
          <Skeleton width="50px" height="12px" />
        </div>
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-6">
      <Skeleton width="120px" height="16px" className="mb-5" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <Skeleton width="24px" height="24px" />
            <div className="flex-1 space-y-2">
              <Skeleton width="120px" height="14px" />
              <Skeleton width="80%" height="14px" />
              <Skeleton width="60px" height="10px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-[#080808] p-4">
      <Skeleton width="60px" height="10px" className="mb-2" />
      <Skeleton width="40px" height="28px" className="mb-1" />
      <Skeleton width="70px" height="10px" />
    </div>
  );
}
