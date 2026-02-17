"use client";
import { Icon } from "./Icon";

import { useState } from "react";
import type { CheckType, CheckStatus } from "@/lib/types";

type ChecklistItem = {
  type: CheckType;
  label: string;
  description: string;
  icon: string;
  status: CheckStatus;
  score?: number;
  lastChecked?: string;
};

type Props = {
  projectId: string;
  liveUrl: string | null;
  initialChecks?: ChecklistItem[];
};

const DEFAULT_CHECKS: Omit<ChecklistItem, "status">[] = [
  {
    type: "ssl",
    label: "SSL Certificate",
    description: "HTTPS is enabled and valid",
    icon: "lock",
  },
  {
    type: "mobile",
    label: "Mobile Responsive",
    description: "Works well on mobile devices",
    icon: "layout",
  },
  {
    type: "performance",
    label: "Performance",
    description: "Fast loading times (Lighthouse)",
    icon: "stopwatch",
  },
  {
    type: "seo",
    label: "SEO Basics",
    description: "Meta tags, titles, descriptions",
    icon: "search",
  },
  {
    type: "analytics",
    label: "Analytics",
    description: "Tracking is configured",
    icon: "chart",
  },
  {
    type: "accessibility",
    label: "Accessibility",
    description: "WCAG compliant basics",
    icon: "user",
  },
];

export default function LaunchChecklist({ projectId, liveUrl, initialChecks }: Props) {
  const [checks, setChecks] = useState<ChecklistItem[]>(
    initialChecks ||
      DEFAULT_CHECKS.map((c) => ({ ...c, status: "pending" as const }))
  );
  const [running, setRunning] = useState<string | null>(null);

  const passedCount = checks.filter((c) => c.status === "passed").length;
  const totalCount = checks.length;
  const progress = Math.round((passedCount / totalCount) * 100);

  const runCheck = async (checkType: CheckType) => {
    if (!liveUrl) {
      return;
    }

    setRunning(checkType);

    // Simulate check for now - in production, this would call real APIs
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

    // Mock results based on check type
    const mockResults: Record<CheckType, { status: CheckStatus; score?: number }> = {
      ssl: { status: liveUrl.startsWith("https") ? "passed" : "failed" },
      mobile: { status: "passed", score: 85 + Math.floor(Math.random() * 15) },
      performance: { status: Math.random() > 0.3 ? "passed" : "warning", score: 70 + Math.floor(Math.random() * 30) },
      seo: { status: Math.random() > 0.2 ? "passed" : "warning", score: 80 + Math.floor(Math.random() * 20) },
      analytics: { status: Math.random() > 0.5 ? "passed" : "pending" },
      accessibility: { status: Math.random() > 0.3 ? "passed" : "warning", score: 75 + Math.floor(Math.random() * 25) },
    };

    const result = mockResults[checkType];
    setChecks((prev) =>
      prev.map((c) =>
        c.type === checkType
          ? {
              ...c,
              status: result.status,
              score: result.score,
              lastChecked: new Date().toISOString(),
            }
          : c
      )
    );

    setRunning(null);
  };

  const runAllChecks = async () => {
    for (const check of checks) {
      await runCheck(check.type);
    }
  };

  return (
    <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Icon name="rocket" size={18} /> Launch Readiness
          </h3>
          <p className="text-sm text-[#666] mt-1">
            {passedCount === totalCount
              ? "All checks passed! Ready to launch."
              : `${passedCount}/${totalCount} checks passed`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold">{progress}%</p>
          </div>
          {liveUrl && (
            <button
              onClick={runAllChecks}
              disabled={running !== null}
              className="px-4 py-2 text-sm font-medium rounded-none bg-[#7bdcff] text-black hover:bg-[#a5ebff] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {running ? "Running..." : "Run All"}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#1c1c1c] rounded-none overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-[#7bdcff] to-[#d2ff5a] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* No live URL warning */}
      {!liveUrl && (
        <div className="p-4 rounded-none bg-yellow-500/10 border border-yellow-500/20 mb-4">
          <p className="text-sm text-yellow-400">
            <Icon name="warning" size={16} /> Add a live URL to run automated checks
          </p>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-3">
        {checks.map((check) => (
          <div
            key={check.type}
            className="flex items-center gap-4 p-3 rounded-none border border-[#1c1c1c] hover:border-[#2c2c2c] transition"
          >
            {/* Icon */}
            <span className="text-xl"><Icon name={check.icon} size={20} /></span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{check.label}</p>
              <p className="text-xs text-[#666]">{check.description}</p>
            </div>

            {/* Score (if applicable) */}
            {check.score !== undefined && (
              <span className="text-sm font-medium text-[#8b8b8b]">
                {check.score}
              </span>
            )}

            {/* Status */}
            <div className="flex items-center gap-2">
              {running === check.type ? (
                <div className="w-5 h-5 border-2 border-[#7bdcff] border-t-transparent rounded-none animate-spin" />
              ) : (
                <StatusBadge status={check.status} />
              )}

              {/* Run button */}
              {liveUrl && check.status !== "passed" && running !== check.type && (
                <button
                  onClick={() => runCheck(check.type)}
                  className="text-xs text-[#7bdcff] hover:text-white transition"
                >
                  Check
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Launch Ready CTA */}
      {progress === 100 && (
        <div className="mt-6 p-4 rounded-none bg-gradient-to-r from-[#d2ff5a]/10 to-[#7bdcff]/10 border border-[#d2ff5a]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#d2ff5a] flex items-center gap-2">
                <Icon name="star" size={16} /> Ready for Launch!
              </p>
              <p className="text-sm text-[#8b8b8b] mt-1">
                All checks passed. Time to share with the world.
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium rounded-none bg-[#d2ff5a] text-black hover:bg-[#e5ff8a] transition flex items-center gap-2">
              <Icon name="star" size={14} /> Mark as Launched
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CheckStatus }) {
  const styles: Record<CheckStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-[#2c2c2c]", text: "text-[#8b8b8b]", label: "Pending" },
    passed: { bg: "bg-green-500/10", text: "text-green-400", label: "PASS" },
    failed: { bg: "bg-red-500/10", text: "text-red-400", label: "FAIL" },
    warning: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "!" },
  };

  const style = styles[status];
  return (
    <span
      className={`px-2 py-0.5 rounded-none text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
