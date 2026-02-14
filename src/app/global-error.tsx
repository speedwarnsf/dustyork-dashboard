"use client";

// This file handles errors that occur in the root layout
// It MUST include html and body tags as it replaces the entire document

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6 font-mono">!</div>
          <h1 className="text-2xl font-semibold mb-3">Critical Error</h1>
          <p className="text-[#8b8b8b] mb-6">
            Something went seriously wrong. Please try refreshing the page.
          </p>
          {error.digest && (
            <p className="text-xs text-[#555] mb-6 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            className="rounded-none bg-[#7bdcff] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#a5ebff]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
