export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-[#7bdcff] border-t-transparent mb-4" />
        <p className="text-[#8b8b8b]">Loading dashboard...</p>
      </div>
    </div>
  );
}
