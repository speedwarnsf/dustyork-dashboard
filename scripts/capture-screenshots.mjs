#!/usr/bin/env node
/**
 * Screenshot Capture Utility
 *
 * Captures screenshots of all projects with live URLs and uploads them
 * to Supabase Storage, then updates the project records.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs              # all projects
 *   node scripts/capture-screenshots.mjs --project "Nudio"  # single project
 *   node scripts/capture-screenshots.mjs --dry-run    # preview only
 *   node scripts/capture-screenshots.mjs --local      # save to public/screenshots/ only
 *
 * Requires: npx playwright install chromium (one-time setup)
 */

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const localOnly = args.includes("--local");
const projectFilter = args.includes("--project")
  ? args[args.indexOf("--project") + 1]
  : null;

// Load env from .env.local if available
async function loadEnv() {
  try {
    const { readFileSync } = await import("fs");
    const envFile = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of envFile.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const [, key, val] = match;
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, "");
        }
      }
    }
  } catch {}
}

async function main() {
  await loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE key in .env.local");
    process.exit(1);
  }

  const sb = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Fetch projects
  let query = sb
    .from("projects")
    .select("id, name, live_url, screenshot_url, status")
    .not("live_url", "is", null)
    .neq("status", "archived");

  if (projectFilter) {
    query = query.ilike("name", `%${projectFilter}%`);
  }

  const { data: projects, error } = await query;
  if (error) {
    console.error("Failed to fetch projects:", error.message);
    process.exit(1);
  }

  if (!projects || projects.length === 0) {
    console.log("No projects with live URLs found.");
    process.exit(0);
  }

  console.log(`Found ${projects.length} project(s) to capture:\n`);
  for (const p of projects) {
    console.log(`  ${p.name} -> ${p.live_url}`);
  }
  console.log();

  if (dryRun) {
    console.log("[dry-run] Exiting without capturing.");
    process.exit(0);
  }

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });

  // Ensure local dir exists
  const screenshotDir = join(ROOT, "public", "screenshots");
  mkdirSync(screenshotDir, { recursive: true });

  // Ensure storage bucket
  if (!localOnly) {
    await sb.storage.createBucket("screenshots", { public: true }).catch(() => {});
  }

  const results = [];

  for (const project of projects) {
    const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filename = `${slug}.jpg`;
    const localPath = join(screenshotDir, filename);

    console.log(`Capturing: ${project.name} (${project.live_url})`);

    try {
      const page = await context.newPage();
      await page.goto(project.live_url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Wait a bit for animations/lazy content
      await page.waitForTimeout(2000);

      const buffer = await page.screenshot({
        type: "jpeg",
        quality: 85,
        clip: { x: 0, y: 0, width: 1280, height: 800 },
      });

      await page.close();

      // Save locally
      writeFileSync(localPath, buffer);
      console.log(`  Saved: ${localPath}`);

      if (!localOnly) {
        // Upload to Supabase Storage
        const { error: uploadError } = await sb.storage
          .from("screenshots")
          .upload(filename, buffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = sb.storage
          .from("screenshots")
          .getPublicUrl(filename);

        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

        // Update project record
        const { error: updateError } = await sb
          .from("projects")
          .update({
            screenshot_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", project.id);

        if (updateError) {
          throw new Error(`DB update failed: ${updateError.message}`);
        }

        console.log(`  Uploaded: ${publicUrl}`);
        results.push({ name: project.name, status: "ok", url: publicUrl });
      } else {
        const relPath = `/screenshots/${filename}`;
        // Update project record with local path
        const { error: updateError } = await sb
          .from("projects")
          .update({
            screenshot_url: relPath,
            updated_at: new Date().toISOString(),
          })
          .eq("id", project.id);

        if (updateError) {
          throw new Error(`DB update failed: ${updateError.message}`);
        }

        console.log(`  Updated DB: ${relPath}`);
        results.push({ name: project.name, status: "ok", url: relPath });
      }
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      results.push({ name: project.name, status: "error", error: err.message });
    }
  }

  await browser.close();

  console.log("\n--- Results ---");
  const ok = results.filter((r) => r.status === "ok").length;
  const fail = results.filter((r) => r.status === "error").length;
  console.log(`${ok} captured, ${fail} failed out of ${results.length} total.`);

  if (fail > 0) {
    console.log("\nFailed:");
    for (const r of results.filter((r) => r.status === "error")) {
      console.log(`  ${r.name}: ${r.error}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
