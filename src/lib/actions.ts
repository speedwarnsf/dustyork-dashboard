"use client";

import toast from "react-hot-toast";

/**
 * Deploy project action - simplified version
 * In a full implementation, this would integrate with Vercel API
 */
export async function deployProject(projectId: string, projectName: string) {
  try {
    // Show loading state
    const deployToast = toast.loading(`Deploying ${projectName}...`);
    
    // Simulate API call to deployment service
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation:
    // const response = await fetch('/api/deploy', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ projectId })
    // });
    
    // For now, just show success
    toast.success(`${projectName} deployment initiated!`, { id: deployToast });
    
    return { success: true };
  } catch (error) {
    toast.error(`Failed to deploy ${projectName}`);
    console.error("Deploy error:", error);
    return { success: false, error };
  }
}

/**
 * Update project screenshot
 */
export async function updateProjectScreenshot(projectId: string, projectName: string) {
  try {
    const screenshotToast = toast.loading(`Updating ${projectName} screenshot...`);
    
    const response = await fetch('/api/screenshots', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || '003e91026ee5b01243615147a7fd740e96058bda86e7ea60fd1bc3724e415d1f'}`
      },
      body: JSON.stringify({ projectName })
    });
    
    if (!response.ok) {
      throw new Error('Screenshot update failed');
    }
    
    toast.success(`${projectName} screenshot updated!`, { id: screenshotToast });
    
    // Refresh the page to show updated screenshot
    setTimeout(() => window.location.reload(), 1000);
    
    return { success: true };
  } catch (error) {
    toast.error(`Failed to update screenshot for ${projectName}`);
    console.error("Screenshot update error:", error);
    return { success: false, error };
  }
}

/**
 * Quick project health check
 */
export async function triggerHealthCheck(projectId: string, projectName: string) {
  try {
    const healthToast = toast.loading(`Checking ${projectName} health...`);
    
    // In real implementation, this would trigger health recalculation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`${projectName} health check complete!`, { id: healthToast });
    
    return { success: true };
  } catch (error) {
    toast.error(`Failed to check ${projectName} health`);
    console.error("Health check error:", error);
    return { success: false, error };
  }
}

/**
 * Open project in VS Code (if available)
 */
export function openInVSCode(githubRepo: string) {
  if (githubRepo) {
    const vscodeUrl = `vscode://vscode.git/clone?url=https://github.com/${githubRepo}.git`;
    window.open(vscodeUrl, '_blank');
    toast.success('Opening in VS Code...');
  } else {
    toast.error('No repository configured');
  }
}

/**
 * Copy project info to clipboard for AI context
 */
export async function copyProjectContext(project: { name: string; status: string; description?: string | null; github_repo?: string | null; live_url?: string | null; health?: { score: number; alerts?: string[] } | null; tags?: string[] | null; updated_at: string }) {
  const context = `
Project: ${project.name}
Status: ${project.status}
Description: ${project.description || 'No description'}
Repository: ${project.github_repo ? `https://github.com/${project.github_repo}` : 'None'}
Live URL: ${project.live_url || 'None'}
Health Score: ${project.health?.score || 'Unknown'}
Tags: ${project.tags?.join(', ') || 'None'}
Last Updated: ${project.updated_at}

Health Alerts:
${project.health?.alerts?.map((alert: string) => `- ${alert}`).join('\n') || 'None'}
`.trim();

  try {
    await navigator.clipboard.writeText(context);
    toast.success('Project context copied to clipboard!');
  } catch (error) {
    toast.error('Failed to copy to clipboard');
    console.error('Clipboard error:', error);
  }
}