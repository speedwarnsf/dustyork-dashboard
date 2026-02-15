"use client";

import { useState } from "react";
import { addGoal, updateGoal, deleteGoal } from "@/app/(dashboard)/actions";
import type { Goal } from "@/lib/types";
import { differenceInDays, format } from "date-fns";

type GoalsListProps = {
  goals: Goal[];
  projectId: string;
};

function GoalCountdown({ targetDate }: { targetDate: string }) {
  const now = new Date();
  const target = new Date(targetDate);
  const days = differenceInDays(target, now);

  if (days < 0) {
    return (
      <span className="text-xs font-mono text-red-400">
        {Math.abs(days)}d overdue
      </span>
    );
  }
  if (days === 0) return <span className="text-xs font-mono text-orange-400">Due today</span>;
  if (days === 1) return <span className="text-xs font-mono text-orange-400">Due tomorrow</span>;
  if (days <= 7) return <span className="text-xs font-mono text-yellow-400">{days}d left</span>;
  return <span className="text-xs font-mono text-[#555]">{days}d left</span>;
}

export default function GoalsList({ goals, projectId }: GoalsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");
  const abandonedGoals = goals.filter(g => g.status === "abandoned");

  return (
    <div className="border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Goals</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="border border-[#1c1c1c] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[#555] hover:border-[#7bdcff] hover:text-[#7bdcff] transition"
        >
          {showForm ? "Cancel" : "Add Goal"}
        </button>
      </div>

      {showForm && (
        <form
          action={addGoal.bind(null, projectId)}
          className="mb-6 space-y-3 border border-[#1a1a1a] p-4 bg-black"
        >
          <input
            name="title"
            required
            placeholder="Goal title (e.g., Launch by March 1)"
            className="w-full border border-[#1c1c1c] bg-black px-4 py-2.5 text-sm focus:outline-none focus:border-[#7bdcff]"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Description (optional)"
            className="w-full border border-[#1c1c1c] bg-black px-4 py-2.5 text-sm focus:outline-none focus:border-[#7bdcff]"
          />
          <input
            name="target_date"
            type="date"
            className="w-full border border-[#1c1c1c] bg-black px-4 py-2.5 text-sm focus:outline-none focus:border-[#7bdcff] [color-scheme:dark]"
          />
          <button
            type="submit"
            className="border border-[#1c1c1c] px-4 py-2 text-xs uppercase tracking-[0.3em] transition hover:border-[#d2ff5a] hover:text-[#d2ff5a]"
          >
            Create Goal
          </button>
        </form>
      )}

      {goals.length === 0 && !showForm && (
        <p className="text-sm text-[#555]">No goals set yet. Define what success looks like.</p>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-2">
          {activeGoals.map(goal => (
            <div key={goal.id} className="border border-[#1a1a1a] bg-[#080808]">
              <div
                className="p-4 cursor-pointer hover:bg-[#0c0c0c] transition"
                onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#ccc] font-medium">{goal.title}</p>
                    {goal.description && (
                      <p className="text-[11px] text-[#555] mt-1 truncate">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {goal.target_date && <GoalCountdown targetDate={goal.target_date} />}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-[3px] bg-[#1a1a1a] overflow-hidden">
                    <div
                      className="h-full bg-[#d2ff5a] transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#555] w-8 text-right">{goal.progress}%</span>
                </div>
              </div>

              {expandedGoal === goal.id && (
                <div className="border-t border-[#1a1a1a] p-4 space-y-3">
                  {goal.target_date && (
                    <p className="text-[11px] text-[#555] font-mono">
                      Deadline: {format(new Date(goal.target_date), "MMM d, yyyy")}
                    </p>
                  )}
                  <form action={updateGoal.bind(null, goal.id, projectId)} className="flex flex-wrap gap-2">
                    <input type="hidden" name="status" value="active" />
                    <input
                      name="progress"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={goal.progress}
                      className="w-20 border border-[#1c1c1c] bg-black px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#7bdcff]"
                    />
                    <button
                      type="submit"
                      className="border border-[#1c1c1c] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] hover:border-[#7bdcff] hover:text-[#7bdcff] transition"
                    >
                      Update Progress
                    </button>
                  </form>
                  <div className="flex gap-2">
                    <form action={updateGoal.bind(null, goal.id, projectId)}>
                      <input type="hidden" name="status" value="completed" />
                      <input type="hidden" name="progress" value="100" />
                      <button
                        type="submit"
                        className="border border-[#1c1c1c] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#d2ff5a] hover:border-[#d2ff5a] transition"
                      >
                        Mark Complete
                      </button>
                    </form>
                    <form action={updateGoal.bind(null, goal.id, projectId)}>
                      <input type="hidden" name="status" value="abandoned" />
                      <input type="hidden" name="progress" value={String(goal.progress)} />
                      <button
                        type="submit"
                        className="border border-[#1c1c1c] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#555] hover:border-red-500/30 hover:text-red-400 transition"
                      >
                        Abandon
                      </button>
                    </form>
                    <form action={deleteGoal.bind(null, goal.id, projectId)}>
                      <button
                        type="submit"
                        className="border border-[#1c1c1c] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#333] hover:border-red-500/30 hover:text-red-400 transition"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#555] font-mono mb-2">
            Completed ({completedGoals.length})
          </p>
          <div className="space-y-1">
            {completedGoals.map(goal => (
              <div key={goal.id} className="border border-[#1a1a1a] bg-[#080808] p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border border-[#d2ff5a] bg-[#d2ff5a]/10 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-[#d2ff5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#555] line-through">{goal.title}</span>
                </div>
                {goal.completed_at && (
                  <span className="text-[10px] font-mono text-[#333]">
                    {format(new Date(goal.completed_at), "MMM d")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abandoned Goals */}
      {abandonedGoals.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#333] font-mono mb-2">
            Abandoned ({abandonedGoals.length})
          </p>
          <div className="space-y-1">
            {abandonedGoals.map(goal => (
              <div key={goal.id} className="border border-[#111] bg-[#060606] p-3">
                <span className="text-sm text-[#333] line-through">{goal.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
