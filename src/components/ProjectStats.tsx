type ProjectStatsProps = {
  milestoneCount: number;
  completedMilestones: number;
  journalEntryCount: number;
  lastUpdated: string;
};

export default function ProjectStats({
  milestoneCount,
  completedMilestones,
  journalEntryCount,
  lastUpdated,
}: ProjectStatsProps) {
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
  );

  const progress = milestoneCount > 0
    ? Math.round((completedMilestones / milestoneCount) * 100)
    : 0;

  const activityStatus = daysSinceUpdate <= 7
    ? { label: "Hot", color: "text-[#d2ff5a] bg-[#0f1d12] border-[#20381f]" }
    : daysSinceUpdate <= 30
    ? { label: "Warm", color: "text-[#f4b26a] bg-[#1a1410] border-[#3f2c1f]" }
    : daysSinceUpdate <= 90
    ? { label: "Cold", color: "text-[#7bdcff] bg-[#0c1b24] border-[#1b3b4c]" }
    : { label: "Frozen", color: "text-[#8b8b8b] bg-[#151515] border-[#2a2a2a]" };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {/* Progress */}
      <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
        <div className="text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
          Progress
        </div>
        <div className="mt-2 text-2xl font-semibold text-[#7bdcff]">{progress}%</div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1c1c1c]">
          <div
            className="h-full bg-[#7bdcff] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
        <div className="text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
          Milestones
        </div>
        <div className="mt-2 text-2xl font-semibold">
          {completedMilestones}/{milestoneCount}
        </div>
        <div className="mt-1 text-xs text-[#555]">completed</div>
      </div>

      {/* Journal */}
      <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
        <div className="text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
          Journal
        </div>
        <div className="mt-2 text-2xl font-semibold">{journalEntryCount}</div>
        <div className="mt-1 text-xs text-[#555]">entries</div>
      </div>

      {/* Activity */}
      <div className="rounded-2xl border border-[#1c1c1c] bg-[#0a0a0a] p-4">
        <div className="text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
          Activity
        </div>
        <div className={`mt-2 inline-block rounded-full border px-3 py-1 text-sm font-medium ${activityStatus.color}`}>
          {activityStatus.label}
        </div>
        <div className="mt-1 text-xs text-[#555]">{daysSinceUpdate}d ago</div>
      </div>
    </div>
  );
}
