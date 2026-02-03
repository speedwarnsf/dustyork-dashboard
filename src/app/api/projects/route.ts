import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  // Fetch all projects with milestone and journal counts
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(`
      *,
      milestones(id, status, percent_complete),
      journal_entries(id)
    `)
    .order("updated_at", { ascending: false });

  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  // Transform data to include stats
  const projectsWithStats = projects?.map((project) => {
    const milestones = project.milestones || [];
    const journalEntries = project.journal_entries || [];
    
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(
      (m: { status: string }) => m.status === "completed"
    ).length;
    const avgProgress = totalMilestones > 0
      ? Math.round(
          milestones.reduce((sum: number, m: { percent_complete: number }) => sum + (m.percent_complete || 0), 0) /
          totalMilestones
        )
      : 0;

    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      github_repo: project.github_repo,
      live_url: project.live_url,
      screenshot_url: project.screenshot_url,
      tags: project.tags,
      created_at: project.created_at,
      updated_at: project.updated_at,
      stats: {
        totalMilestones,
        completedMilestones,
        journalEntries: journalEntries.length,
        avgProgress,
        daysSinceUpdate,
      },
    };
  });

  return NextResponse.json({ projects: projectsWithStats });
}
