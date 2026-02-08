import { Icon } from "@/components/Icon";

const statusColors = {
  completed: "bg-[#d2ff5a]",
  in_progress: "bg-[#7bdcff]",
  not_started: "bg-[#444]",
};

const projectStatusColors = {
  active: "bg-[#7bdcff]",
  paused: "bg-[#f4b26a]",
  completed: "bg-[#d2ff5a]",
  archived: "bg-[#555]",
};

type Props = {
  milestoneStats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  projectStats: {
    total: number;
    active: number;
    paused: number;
    completed: number;
    archived: number;
  };
  activityStats: {
    weekly: number;
    monthly: number;
  };
  avgHealthScore: number;
};

export default function ProgressOverview({
  milestoneStats,
  projectStats,
  activityStats,
  avgHealthScore,
}: Props) {
  const milestoneCompletion = milestoneStats.total
    ? Math.round((milestoneStats.completed / milestoneStats.total) * 100)
    : 0;
  const totalMilestones = Math.max(milestoneStats.total, 1);
  const totalProjects = Math.max(projectStats.total, 1);
  const monthlyActivity = Math.max(activityStats.monthly, 1);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-6">
      <div className="rounded-[32px] border border-[#1c1c1c] bg-[#0a0a0a]/90 p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1d12]/40 via-transparent to-[#0c1b24]/40 pointer-events-none" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#7bdcff]">Progress Pulse</p>
              <h2 className="text-2xl font-semibold mt-2">Momentum + Milestone Clarity</h2>
              <p className="text-sm text-[#8b8b8b] mt-2 max-w-xl">
                A quick read on delivery pace, health average, and the project mix.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#8b8b8b]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#d2ff5a]" /> Completed
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#7bdcff]" /> In progress
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#444]" /> Not started
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#1c1c1c] bg-[#080808] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Milestone Progress</p>
                <span className="text-xs text-[#8b8b8b]">{milestoneCompletion}% complete</span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-[#1c1c1c] overflow-hidden flex">
                <div
                  className={statusColors.completed}
                  style={{ width: `${(milestoneStats.completed / totalMilestones) * 100}%` }}
                />
                <div
                  className={statusColors.in_progress}
                  style={{ width: `${(milestoneStats.inProgress / totalMilestones) * 100}%` }}
                />
                <div
                  className={statusColors.not_started}
                  style={{ width: `${(milestoneStats.notStarted / totalMilestones) * 100}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 text-xs text-[#8b8b8b]">
                <div>
                  <p className="text-[#d2ff5a] font-semibold">{milestoneStats.completed}</p>
                  <p>Done</p>
                </div>
                <div>
                  <p className="text-[#7bdcff] font-semibold">{milestoneStats.inProgress}</p>
                  <p>In progress</p>
                </div>
                <div>
                  <p className="text-[#8b8b8b] font-semibold">{milestoneStats.notStarted}</p>
                  <p>Queued</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1c1c1c] bg-[#080808] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Momentum</p>
                <span className="text-xs text-[#8b8b8b]">Last 30 days</span>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#8b8b8b]">
                    <span>Weekly activity</span>
                    <span>{activityStats.weekly} events</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#1c1c1c] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7bdcff] to-[#d2ff5a]"
                      style={{ width: `${Math.min(100, (activityStats.weekly / monthlyActivity) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-[#8b8b8b]">
                    <span>Monthly activity</span>
                    <span>{activityStats.monthly} events</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#1c1c1c] overflow-hidden">
                    <div
                      className="h-full bg-[#7bdcff]/60"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-[#1c1c1c] bg-[#0c0c0c] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8b8b8b]">Avg health</p>
                  <p className="text-lg font-semibold text-[#d2ff5a]">{Math.round(avgHealthScore)}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8b8b8b]">
                  <Icon name="activity" size={16} />
                  <span>Stable cadence</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1c1c1c] bg-[#080808] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Project Mix</p>
                <span className="text-xs text-[#8b8b8b]">{projectStats.total} total</span>
              </div>
              <div className="mt-4 space-y-3">
                {([
                  ["active", projectStats.active],
                  ["paused", projectStats.paused],
                  ["completed", projectStats.completed],
                  ["archived", projectStats.archived],
                ] as Array<[keyof typeof projectStatusColors, number]>).map(([status, value]) => (
                  <div key={status}>
                    <div className="flex items-center justify-between text-xs text-[#8b8b8b]">
                      <span className="capitalize">{status}</span>
                      <span>{value}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[#1c1c1c] overflow-hidden">
                      <div
                        className={`h-full ${projectStatusColors[status]}`}
                        style={{ width: `${(value / totalProjects) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
