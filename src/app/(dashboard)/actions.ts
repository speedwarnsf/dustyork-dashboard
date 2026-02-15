"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const parseTags = (value: FormDataEntryValue | null) => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

export const createProject = async (formData: FormData): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const payload = {
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || "") || null,
    github_repo: String(formData.get("github_repo") || "") || null,
    live_url: String(formData.get("live_url") || "") || null,
    status: String(formData.get("status") || "active"),
    priority: String(formData.get("priority") || "medium"),
    tags: parseTags(formData.get("tags")),
    user_id: user.id,
  };

  const { data, error } = await supabase.from("projects").insert(payload).select("id").single();
  if (error) {
    redirect(`/project/new?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${data.id}`);
};

export const updateProject = async (projectId: string, formData: FormData): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const payload = {
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || "") || null,
    github_repo: String(formData.get("github_repo") || "") || null,
    live_url: String(formData.get("live_url") || "") || null,
    status: String(formData.get("status") || "active"),
    priority: String(formData.get("priority") || "medium"),
    tags: parseTags(formData.get("tags")),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId);
  if (error) {
    redirect(`/project/${projectId}/edit?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const archiveProject = async (projectId: string): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/");
};

export const addMilestone = async (projectId: string, formData: FormData): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const payload = {
    project_id: projectId,
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || "") || null,
    target_date: String(formData.get("target_date") || "") || null,
    status: String(formData.get("status") || "not_started"),
    percent_complete: Number(formData.get("percent_complete") || 0),
  };
  const { error } = await supabase.from("milestones").insert(payload);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const updateMilestone = async (
  milestoneId: string,
  projectId: string,
  formData: FormData
): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const payload = {
    status: String(formData.get("status") || "not_started"),
    percent_complete: Number(formData.get("percent_complete") || 0),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("milestones")
    .update(payload)
    .eq("id", milestoneId);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const deleteMilestone = async (milestoneId: string, projectId: string): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("milestones").delete().eq("id", milestoneId);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const addTask = async (milestoneId: string, projectId: string, formData: FormData): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const payload = {
    milestone_id: milestoneId,
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || "") || null,
    status: String(formData.get("status") || "todo"),
  };
  const { error } = await supabase.from("tasks").insert(payload);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const updateTask = async (taskId: string, projectId: string, formData: FormData): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const payload = {
    status: String(formData.get("status") || "todo"),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const deleteTask = async (taskId: string, projectId: string): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const addJournalEntry = async (projectId: string, formData: FormData): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const payload = {
    project_id: projectId,
    content: String(formData.get("content") || ""),
    entry_type: String(formData.get("entry_type") || "note"),
    metadata: formData.get("metadata")
      ? JSON.parse(String(formData.get("metadata")))
      : null,
  };
  const { error } = await supabase.from("journal_entries").insert(payload);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const deleteJournalEntry = async (entryId: string, projectId: string): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("journal_entries").delete().eq("id", entryId);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const addGoal = async (projectId: string, formData: FormData): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = {
    project_id: projectId,
    user_id: user.id,
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || "") || null,
    target_date: String(formData.get("target_date") || "") || null,
    status: "active",
    progress: 0,
  };
  const { error } = await supabase.from("project_goals").insert(payload);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const updateGoal = async (goalId: string, projectId: string, formData: FormData): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const status = String(formData.get("status") || "active");
  const progress = Number(formData.get("progress") || 0);
  const payload: Record<string, unknown> = {
    status,
    progress,
    updated_at: new Date().toISOString(),
  };
  if (status === "completed") {
    payload.completed_at = new Date().toISOString();
    payload.progress = 100;
  }
  const { error } = await supabase.from("project_goals").update(payload).eq("id", goalId);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const deleteGoal = async (goalId: string, projectId: string): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("project_goals").delete().eq("id", goalId);
  if (error) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/project/${projectId}`);
};

export const refreshScreenshot = async (projectId: string, liveUrl: string): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  if (!liveUrl) {
    redirect(`/project/${projectId}?error=${encodeURIComponent("Missing live URL.")}`);
  }

  const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(
    liveUrl
  )}&screenshot=true&meta=false&embed=screenshot.url`;

  const microlinkRes = await fetch(microlinkUrl);
  if (!microlinkRes.ok) {
    redirect(`/project/${projectId}?error=${encodeURIComponent("Microlink capture failed.")}`);
  }
  const microlinkData = await microlinkRes.json();
  const screenshotUrl = microlinkData?.data?.screenshot?.url as string | undefined;
  if (!screenshotUrl) {
    redirect(`/project/${projectId}?error=${encodeURIComponent("Microlink did not return a screenshot.")}`);
  }

  const imageRes = await fetch(screenshotUrl);
  if (!imageRes.ok) {
    redirect(`/project/${projectId}?error=${encodeURIComponent("Could not download screenshot.")}`);
  }
  const buffer = await imageRes.arrayBuffer();
  const filePath = `${projectId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("project-screenshots")
    .upload(filePath, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(uploadError.message)}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("project-screenshots").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("projects")
    .update({ screenshot_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (updateError) {
    redirect(`/project/${projectId}?error=${encodeURIComponent(updateError.message)}`);
  }
  redirect(`/project/${projectId}`);
};
