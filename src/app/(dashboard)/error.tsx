"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">!</div>
        <h1 className="text-2xl font-semibold mb-3">Something went wrong</h1>
        <p className="text-[#8b8b8b] mb-6">
          {error.message || "An unexpected error occurred while loading the dashboard."}
        </p>
        {error.digest && (
          <p className="text-xs text-[#555] mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-[#7bdcff] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#a5ebff]"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="rounded-xl border border-[#1c1c1c] px-6 py-3 text-sm font-medium transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
