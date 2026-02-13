import {
  addMilestone,
  addTask,
  deleteMilestone,
  deleteTask,
  updateMilestone,
  updateTask,
} from "@/app/(dashboard)/actions";
import type { Milestone, Task } from "@/lib/types";

type MilestoneWithTasks = Milestone & { tasks: Task[] };

type MilestoneListProps = {
  milestones: MilestoneWithTasks[];
  projectId: string;
};

export default function MilestoneList({ milestones, projectId }: MilestoneListProps) {
  return (
    <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <h3 className="text-lg font-semibold">Milestones</h3>
      {milestones.length === 0 && (
        <div className="mt-6 rounded-none border border-dashed border-[#1c1c1c] p-8 text-center">
          <p className="text-sm text-[#8b8b8b]">No milestones yet. Add one below to track progress.</p>
        </div>
      )}
      <div className="mt-6 space-y-6">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="rounded-none border border-[#1c1c1c] bg-black p-5"
          >
            <div className="flex flex-col sm:flex-row flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold">{milestone.name}</h4>
                <p className="mt-1 text-sm text-[#8b8b8b]">
                  {milestone.description || "No description."}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
                  Target: {milestone.target_date || "No date"} · {milestone.percent_complete}%
                  complete
                </p>
                <div className="mt-3 h-1.5 bg-[#1c1c1c] rounded-none overflow-hidden max-w-xs">
                  <div
                    className="h-full bg-gradient-to-r from-[#7bdcff] to-[#d2ff5a] rounded-none transition-all duration-500"
                    style={{ width: `${milestone.percent_complete}%` }}
                  />
                </div>
              </div>
              <form
                action={updateMilestone.bind(null, milestone.id, projectId)}
                className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em]"
              >
                <select
                  name="status"
                  defaultValue={milestone.status}
                  className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-xs"
                >
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
                <input
                  name="percent_complete"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={milestone.percent_complete}
                  className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-none border border-[#1c1c1c] px-3 py-2 text-xs transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
                >
                  Update
                </button>
              </form>
              <form
                action={deleteMilestone.bind(null, milestone.id, projectId)}
              >
                <button
                  type="submit"
                  className="text-xs uppercase tracking-[0.3em] text-[#8b8b8b] transition hover:text-[#f4b26a]"
                >
                  Delete
                </button>
              </form>
            </div>

            <div className="mt-4 space-y-3">
              {milestone.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-[#1c1c1c] bg-[#0a0a0a] px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">{task.name}</p>
                    <p className="text-xs text-[#8b8b8b]">
                      {task.description || "No description."}
                    </p>
                  </div>
                  <form
                    action={updateTask.bind(null, task.id, projectId)}
                    className="flex items-center gap-2 text-xs uppercase tracking-[0.3em]"
                  >
                    <select
                      name="status"
                      defaultValue={task.status}
                      className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-xs"
                    >
                      <option value="todo">Todo</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-none border border-[#1c1c1c] px-3 py-2 text-xs transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
                    >
                      Save
                    </button>
                  </form>
                  <form action={deleteTask.bind(null, task.id, projectId)}>
                    <button
                      type="submit"
                      className="text-xs uppercase tracking-[0.3em] text-[#8b8b8b] transition hover:text-[#f4b26a]"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              ))}
            </div>

            <form
              action={addTask.bind(null, milestone.id, projectId)}
              className="mt-4 grid gap-3 rounded-none border border-dashed border-[#1c1c1c] p-4 text-sm"
            >
              <input
                name="name"
                required
                placeholder="New task name"
                className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-sm"
              />
              <input
                name="description"
                placeholder="Task description"
                className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-sm"
              />
              <select
                name="status"
                className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-sm"
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
              <button
                type="submit"
                className="rounded-none border border-[#1c1c1c] px-4 py-2 text-xs uppercase tracking-[0.3em] transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
              >
                Add task
              </button>
            </form>
          </div>
        ))}
      </div>

      <form
        action={addMilestone.bind(null, projectId)}
        className="mt-6 grid gap-3 rounded-none border border-dashed border-[#1c1c1c] p-5 text-sm"
      >
        <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8b8b8b]">
          New milestone
        </h4>
        <input
          name="name"
          required
          placeholder="Milestone name"
          className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-sm"
        />
        <input
          name="description"
          placeholder="Description"
          className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-sm"
        />
        <input
          name="target_date"
          type="date"
          className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-sm"
        />
        <select
          name="status"
          className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-sm"
        >
          <option value="not_started">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <input
          name="percent_complete"
          type="number"
          min={0}
          max={100}
          defaultValue={0}
          className="rounded-none border border-[#1c1c1c] bg-black px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-none border border-[#1c1c1c] px-4 py-2 text-xs uppercase tracking-[0.3em] transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
        >
          Add milestone
        </button>
      </form>
    </div>
  );
}
