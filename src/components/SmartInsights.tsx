"use client";

import type { SmartInsight } from "@/lib/types";
import { useRouter } from "next/navigation";

type Props = {
  insights: SmartInsight[];
};

const typeStyles: Record<SmartInsight["type"], { icon: string; border: string; bg: string }> = {
  stale: {
    icon: "⏰",
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
  },
  active: {
    icon: "🔥",
    border: "border-green-500/30",
    bg: "bg-green-500/5",
  },
  completion: {
    icon: "🎯",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
  },
  suggestion: {
    icon: "💡",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
  },
  alert: {
    icon: "⚠️",
    border: "border-red-500/30",
    bg: "bg-red-500/5",
  },
};

const priorityColors: Record<SmartInsight["priority"], string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

export default function SmartInsights({ insights }: Props) {
  const router = useRouter();

  if (insights.length === 0) {
    return (
      <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💡</span>
          <h3 className="text-lg font-semibold">Smart Insights</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl mb-3">✨</span>
          <p className="text-[#8b8b8b]">All caught up!</p>
          <p className="text-sm text-[#555] mt-1">No actionable insights right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <h3 className="text-lg font-semibold">Smart Insights</h3>
        </div>
        <span className="text-xs text-[#666] px-2 py-1 rounded-full bg-[#1c1c1c]">
          {insights.length} insight{insights.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {insights.map((insight) => {
          const style = typeStyles[insight.type];
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border ${style.border} ${style.bg} transition hover:border-[#7bdcff]/30 cursor-pointer`}
              onClick={() => {
                if (insight.projectId) {
                  router.push(`/project/${insight.projectId}`);
                } else if (insight.actionUrl) {
                  window.open(insight.actionUrl, "_blank");
                }
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{insight.title}</p>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        insight.priority === "high"
                          ? "bg-red-400"
                          : insight.priority === "medium"
                          ? "bg-yellow-400"
                          : "bg-green-400"
                      }`}
                      title={`${insight.priority} priority`}
                    />
                  </div>
                  <p className="text-sm text-[#8b8b8b] mt-1">
                    {insight.description}
                  </p>
                  {insight.actionLabel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (insight.actionUrl) {
                          window.open(insight.actionUrl, "_blank");
                        }
                      }}
                      className="mt-2 text-xs text-[#7bdcff] hover:text-white transition"
                    >
                      {insight.actionLabel} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function SmartInsightsCompact({ insights }: Props) {
  if (insights.length === 0) return null;

  const highPriority = insights.filter((i) => i.priority === "high");
  const displayInsights = highPriority.length > 0 ? highPriority : insights.slice(0, 3);

  return (
    <div className="flex flex-wrap gap-2">
      {displayInsights.map((insight) => (
        <div
          key={insight.id}
          className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
            typeStyles[insight.type].bg
          } ${typeStyles[insight.type].border} border`}
        >
          <span>{typeStyles[insight.type].icon}</span>
          <span className="truncate max-w-[200px]">{insight.title}</span>
        </div>
      ))}
      {insights.length > displayInsights.length && (
        <span className="text-xs text-[#666] self-center">
          +{insights.length - displayInsights.length} more
        </span>
      )}
    </div>
  );
}
