import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const API_KEY =
  process.env.IO_API_KEY ||
  process.env.DASHBOARD_API_KEY ||
  "003e91026ee5b01243615147a7fd740e96058bda86e7ea60fd1bc3724e415d1f";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-KEY",
};

function withCors(res: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

function auth(req: NextRequest): boolean {
  const h = req.headers.get("authorization");
  const token = h ? h.replace(/^Bearer\s+/i, "").trim() : req.headers.get("x-api-key")?.trim();
  return token === API_KEY;
}

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// Capture screenshot via Microlink API
async function captureScreenshot(url: string): Promise<Buffer> {
  const params = new URLSearchParams({
    url,
    screenshot: "true",
    "screenshot.type": "jpeg",
    "screenshot.quality": "80",
    "meta": "false",
    "screenshot.width": "1280",
    "screenshot.height": "800",
    "screenshot.fullPage": "false",
    waitForTimeout: "3000",
  });

  const res = await fetch(`https://api.microlink.io?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Microlink API failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data.status !== "success" || !data.data?.screenshot?.url) {
    throw new Error(`Microlink returned no screenshot: ${data.status}`);
  }

  // Fetch the actual image
  const imgRes = await fetch(data.data.screenshot.url);
  if (!imgRes.ok) throw new Error("Failed to fetch screenshot image");
  const arrayBuffer = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Upload to Supabase Storage
async function uploadToStorage(
  sb: any,
  projectName: string,
  imageBuffer: Buffer
): Promise<string> {
  const bucket = "screenshots";
  const filename = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;
  const path = filename;

  // Ensure bucket exists (ignore error if already exists)
  await sb.storage.createBucket(bucket, { public: true }).catch(() => {});

  const { error } = await sb.storage
    .from(bucket)
    .upload(path, imageBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
  // Bust cache with timestamp
  return `${urlData.publicUrl}?t=${Date.now()}`;
}

// POST /api/screenshots
// Body: { projectName?: string, projectId?: string, url?: string, all?: boolean }
export async function POST(request: NextRequest) {
  if (!auth(request)) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const sb = supabase();
  if (!sb) {
    return withCors(NextResponse.json({ error: "Database not configured" }, { status: 500 }));
  }

  try {
    const body = await request.json();
    const { projectName, projectId, url, all } = body;

    // Batch mode: capture all projects with live_url
    if (all) {
      const { data: projects, error } = await sb
        .from("projects")
        .select("id, name, live_url")
        .not("live_url", "is", null)
        .neq("status", "archived");

      if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }));

      const results: { name: string; status: string; screenshot_url?: string; error?: string }[] = [];

      for (const project of projects || []) {
        if (!project.live_url) continue;
        try {
          const buf = await captureScreenshot(project.live_url);
          const publicUrl = await uploadToStorage(sb, project.name, buf);
          await sb
            .from("projects")
            .update({ screenshot_url: publicUrl, updated_at: new Date().toISOString() })
            .eq("id", project.id);
          results.push({ name: project.name, status: "ok", screenshot_url: publicUrl });
        } catch (err: any) {
          results.push({ name: project.name, status: "error", error: err.message });
        }
      }

      return withCors(NextResponse.json({ success: true, results }));
    }

    // Single project mode
    let targetProject: any = null;

    if (projectId) {
      const { data } = await sb.from("projects").select("*").eq("id", projectId).single();
      targetProject = data;
    } else if (projectName) {
      const { data } = await sb
        .from("projects")
        .select("*")
        .ilike("name", `%${projectName}%`)
        .limit(1)
        .maybeSingle();
      targetProject = data;
    }

    const captureUrl = url || targetProject?.live_url;
    if (!captureUrl) {
      return withCors(
        NextResponse.json({ error: "No URL to capture. Provide url, or a project with live_url." }, { status: 400 })
      );
    }

    const buf = await captureScreenshot(captureUrl);

    const name = targetProject?.name || new URL(captureUrl).hostname;
    const publicUrl = await uploadToStorage(sb, name, buf);

    // Update project if we have one
    if (targetProject) {
      await sb
        .from("projects")
        .update({ screenshot_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", targetProject.id);
    }

    return withCors(
      NextResponse.json({
        success: true,
        screenshot_url: publicUrl,
        project: targetProject ? { id: targetProject.id, name: targetProject.name } : null,
      })
    );
  } catch (err: any) {
    console.error("Screenshot API error:", err);
    return withCors(NextResponse.json({ error: err.message }, { status: 500 }));
  }
}
