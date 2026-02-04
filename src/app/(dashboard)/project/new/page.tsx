import Link from "next/link";
import { createProject } from "@/app/(dashboard)/actions";

export default function NewProjectPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-white">
      <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-[#7bdcff]">
          New Project
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Create a project</h2>
        <form action={createProject} className="mt-6 grid gap-4 text-sm">
          <input
            name="name"
            required
            placeholder="Project name"
            className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
          />
          <textarea
            name="description"
            rows={4}
            placeholder="Project description"
            className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
          />
          <input
            name="github_repo"
            placeholder="GitHub repo (owner/name)"
            className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
          />
          <input
            name="live_url"
            placeholder="Live URL"
            className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              name="status"
              defaultValue="active"
              className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <select
              name="priority"
              defaultValue="medium"
              className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <input
            name="tags"
            placeholder="Tags (comma separated)"
            className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
          />
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em]">
            <button
              type="submit"
              className="rounded-full bg-[#7bdcff] px-4 py-2 text-black"
            >
              Create
            </button>
            <Link
              href="/"
              className="rounded-full border border-[#1c1c1c] px-4 py-2 text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
