"use client";
import { Icon } from "./Icon";
import type { SmartInsight } from "@/lib/types";
import { useRouter } from "next/navigation";

type Props = {
  insights: SmartInsight[];
};

const typeConfig: Record<SmartInsight["type"], { icon: string; accent: string }> = {
  stale: { icon: "clock", accent: "border-l-orange-500/60" },
  active: { icon: "flame", accent: "border-l-green-500/60" },
  completion: { icon: "star", accent: "border-l-cyan-500/60" },
  suggestion: { icon: "info", accent: "border-l-yellow-500/60" },
  alert: { icon: "warning", accent: "border-l-red-500/60" },
};

const priorityDot: Record<SmartInsight["priority"], string> = {
  high: "bg-red-400",
  medium: "bg-yellow-400",
  low: "bg-[#333]",
};

export default function SmartInsights({ insights }: Props) {
  const router = useRouter();

  if (insights.length === 0) {
    return (
      <div className="border border-[#1a1a1a] bg-[#080808] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555] mb-4">Insights</h3>
        <p className="text-sm text-[#444]">Nothing actionable right now.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#555]">
          Insights
          <span className="ml-2 text-[#333] font-mono">{insights.length}</span>
        </h3>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {insights.map((insight) => {
          const config = typeConfig[insight.type];
          return (
            <button
              key={insight.id}
              className={`w-full text-left p-4 border border-[#1a1a1a] border-l-2 ${config.accent} bg-[#0a0a0a] hover:bg-[#0e0e0e] transition-colors`}
              onClick={() => {
                if (insight.projectId) router.push(`/project/${insight.projectId}`);
                else if (insight.actionUrl) window.open(insight.actionUrl, "_blank");
              }}
            >
              <div className="flex items-start gap-3">
                <Icon name={config.icon} size={16} className="text-[#555] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[#ccc]">{insight.title}</p>
                    <span className={`w-1.5 h-1.5 shrink-0 ${priorityDot[insight.priority]}`} title={`${insight.priority} priority`} />
                  </div>
                  <p className="text-xs text-[#555]">{insight.description}</p>
                  {insight.actionLabel && (
                    <span className="inline-block mt-2 text-[11px] text-[#7bdcff] hover:text-white transition-colors">
                      {insight.actionLabel} --&gt;
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SmartInsightsCompact({ insights }: Props) {
  if (insights.length === 0) return null;
  const highPriority = insights.filter((i) => i.priority === "high");
  const display = highPriority.length > 0 ? highPriority : insights.slice(0, 3);

  return (
    <div className="flex flex-wrap gap-2">
      {display.map((insight) => (
        <div
          key={insight.id}
          className="px-3 py-1.5 text-xs flex items-center gap-2 border border-[#1a1a1a] bg-[#0a0a0a]"
        >
          <Icon name={typeConfig[insight.type].icon} size={12} className="text-[#555]" />
          <span className="truncate max-w-[200px] text-[#777]">{insight.title}</span>
        </div>
      ))}
      {insights.length > display.length && (
        <span className="text-[11px] text-[#444] self-center">+{insights.length - display.length} more</span>
      )}
    </div>
  );
}
