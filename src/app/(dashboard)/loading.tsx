import { Skeleton, ProjectCardSkeleton, StatCardSkeleton } from "@/components/SkeletonLoader";

export default function DashboardLoading() {
  return (
    <main>
      {/* Hero Section Skeleton */}
      <section className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <Skeleton width="120px" height="12px" className="mb-3" />
            <Skeleton width="320px" height="36px" className="mb-2" />
            <Skeleton width="400px" height="16px" />
          </div>
          <Skeleton width="140px" height="40px" className="rounded-none" />
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Projects Section Skeleton */}
      <section className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton width="100px" height="12px" className="mb-2" />
            <Skeleton width="160px" height="28px" />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
