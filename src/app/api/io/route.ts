import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// API for Io (AI assistant) to post updates
// Uses API key authentication
// Default key for local dev - in production, set IO_API_KEY or DASHBOARD_API_KEY env var
const DEFAULT_API_KEY = "003e91026ee5b01243615147a7fd740e96058bda86e7ea60fd1bc3724e415d1f";

function getApiKey(): string {
  // Read at runtime to ensure env vars are available
  return process.env.IO_API_KEY || process.env.DASHBOARD_API_KEY || DEFAULT_API_KEY;
}

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return createClient(url, key);
}

function verifyApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  
  const token = authHeader.replace("Bearer ", "");
  return token === getApiKey();
}

// GET /api/io - Get all projects and recent activity
export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  // Fetch all projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  // Fetch recent journal entries
  const { data: recentJournal, error: journalError } = await supabase
    .from("journal_entries")
    .select("*, projects(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (journalError) {
    return NextResponse.json({ error: journalError.message }, { status: 500 });
  }

  // Fetch milestones
  const { data: milestones } = await supabase
    .from("milestones")
    .select("*, projects(name)")
    .order("updated_at", { ascending: false });

  return NextResponse.json({
    projects,
    recentJournal,
    milestones,
    timestamp: new Date().toISOString(),
  });
}

// POST /api/io - Post an update (journal entry, milestone update, etc.)
export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
  
  try {
    const body = await request.json();
    const { action, projectId, projectName, ...data } = body;

    // If projectName is provided but not projectId, look up the project
    let resolvedProjectId = projectId;
    if (!resolvedProjectId && projectName) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .ilike("name", projectName)
        .single();
      
      if (project) {
        resolvedProjectId = project.id;
      }
    }

    switch (action) {
      case "journal": {
        // Add a journal entry
        const { content, entry_type = "io_update", metadata } = data;
        
        if (!resolvedProjectId || !content) {
          return NextResponse.json(
            { error: "Missing projectId/projectName and content" },
            { status: 400 }
          );
        }

        const { data: entry, error } = await supabase
          .from("journal_entries")
          .insert({
            project_id: resolvedProjectId,
            content,
            entry_type,
            metadata: { ...metadata, source: "io" },
          })
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update project's updated_at
        await supabase
          .from("projects")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", resolvedProjectId);

        return NextResponse.json({ success: true, entry });
      }

      case "milestone": {
        // Update or create a milestone
        const { milestoneId, name, status, percent_complete } = data;

        if (milestoneId) {
          // Update existing
          const { data: milestone, error } = await supabase
            .from("milestones")
            .update({
              ...(status && { status }),
              ...(typeof percent_complete === "number" && { percent_complete }),
              updated_at: new Date().toISOString(),
            })
            .eq("id", milestoneId)
            .select()
            .single();

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
          }

          return NextResponse.json({ success: true, milestone });
        } else if (resolvedProjectId && name) {
          // Create new
          const { data: milestone, error } = await supabase
            .from("milestones")
            .insert({
              project_id: resolvedProjectId,
              name,
              status: status || "not_started",
              percent_complete: percent_complete || 0,
            })
            .select()
            .single();

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
          }

          return NextResponse.json({ success: true, milestone });
        }

        return NextResponse.json(
          { error: "Missing milestone data" },
          { status: 400 }
        );
      }

      case "status": {
        // Update project status
        const { status } = data;

        if (!resolvedProjectId || !status) {
          return NextResponse.json(
            { error: "Missing projectId and status" },
            { status: 400 }
          );
        }

        const { data: project, error } = await supabase
          .from("projects")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", resolvedProjectId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, project });
      }

      case "screenshot": {
        // Update project screenshot
        const { screenshot_url } = data;

        if (!resolvedProjectId || !screenshot_url) {
          return NextResponse.json(
            { error: "Missing projectId and screenshot_url" },
            { status: 400 }
          );
        }

        const { data: project, error } = await supabase
          .from("projects")
          .update({
            screenshot_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", resolvedProjectId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, project });
      }

      case "create_project": {
        // Create a new project
        const { name, description, github_repo, live_url, screenshot_url, status = "active", priority = "medium", tags } = data;

        if (!name) {
          return NextResponse.json(
            { error: "Missing project name" },
            { status: 400 }
          );
        }

        // Check if project already exists
        const { data: existing } = await supabase
          .from("projects")
          .select("id")
          .ilike("name", name)
          .single();

        if (existing) {
          return NextResponse.json(
            { error: `Project '${name}' already exists`, projectId: existing.id },
            { status: 409 }
          );
        }

        const { data: project, error } = await supabase
          .from("projects")
          .insert({
            name,
            description,
            github_repo,
            live_url,
            screenshot_url,
            status,
            priority,
            tags,
          })
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, project });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("IO API error:", err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
