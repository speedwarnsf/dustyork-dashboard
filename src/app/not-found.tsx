import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-2xl font-semibold mb-3">Page not found</h1>
        <p className="text-[#8b8b8b] mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#7bdcff] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#a5ebff]"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
