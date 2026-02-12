import { updateProject } from "@/app/(dashboard)/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("projects").select("*").eq("id", id).single();

  const project = data as Project | null;
  if (!project) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-white">
        Project not found.
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12 text-white">
      <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-5 sm:p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-[#7bdcff]">
          Edit Project
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{project.name}</h2>
        <form
          action={updateProject.bind(null, project.id)}
          className="mt-6 grid gap-4 text-sm"
        >
          <input
            name="name"
            required
            defaultValue={project.name}
            className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
          />
          <textarea
            name="description"
            rows={4}
            defaultValue={project.description || ""}
            className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
          />
          <input
            name="github_repo"
            defaultValue={project.github_repo || ""}
            className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
          />
          <input
            name="live_url"
            defaultValue={project.live_url || ""}
            className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              name="status"
              defaultValue={project.status}
              className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <select
              name="priority"
              defaultValue={project.priority}
              className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <input
            name="tags"
            defaultValue={(project.tags || []).join(", ")}
            className="rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3"
          />
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em]">
            <button
              type="submit"
              className="rounded-full bg-[#7bdcff] px-4 py-2 text-black"
            >
              Save changes
            </button>
            <a
              href={`/project/${project.id}`}
              className="rounded-full border border-[#1c1c1c] px-4 py-2 text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
