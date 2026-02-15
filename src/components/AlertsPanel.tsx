"use client";

import { useState } from "react";
import type { Alert } from "@/lib/alerts";
import { alertLevelColor, alertLevelDot } from "@/lib/alerts";
import { formatDistanceToNow } from "date-fns";

type Props = {
  alerts: Alert[];
  showHistory?: boolean;
};

export default function AlertsPanel({ alerts: initialAlerts, showHistory = false }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [view, setView] = useState<"active" | "history">("active");
  const [resolving, setResolving] = useState<Set<string>>(new Set());

  const active = alerts.filter((a) => a.status !== "resolved");
  const resolved = alerts.filter((a) => a.status === "resolved");
  const displayed = view === "active" ? active : resolved;

  const criticalCount = active.filter((a) => a.level === "critical").length;
  const warningCount = active.filter((a) => a.level === "warning").length;

  async function resolveAlert(id: string) {
    setResolving((prev) => new Set(prev).add(id));
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved" }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "resolved" } : a))
        );
      }
    } finally {
      setResolving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function resolveAll() {
    const ids = active.map((a) => a.id);
    if (ids.length === 0) return;
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: "resolved" }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) =>
            ids.includes(a.id) ? { ...a, status: "resolved" } : a
          )
        );
      }
    } catch {}
  }

  if (active.length === 0 && !showHistory) {
    return null;
  }

  return (
    <div className="border border-[#1a1a1a] bg-[#080808]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <h3 className="text-xs uppercase tracking-[0.3em] text-[#555] font-mono">
            Alerts
          </h3>
          {criticalCount > 0 && (
            <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5">
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5">
              {warningCount} warning
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showHistory && (
            <div className="flex text-[10px] font-mono">
              <button
                onClick={() => setView("active")}
                className={`px-2 py-1 border border-[#1a1a1a] ${
                  view === "active"
                    ? "text-white bg-[#1a1a1a]"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                Active ({active.length})
              </button>
              <button
                onClick={() => setView("history")}
                className={`px-2 py-1 border border-[#1a1a1a] border-l-0 ${
                  view === "history"
                    ? "text-white bg-[#1a1a1a]"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                History ({resolved.length})
              </button>
            </div>
          )}
          {view === "active" && active.length > 1 && (
            <button
              onClick={resolveAll}
              className="text-[10px] font-mono text-[#555] hover:text-[#888] px-2 py-1 border border-[#1a1a1a] hover:border-[#333] transition"
            >
              Resolve All
            </button>
          )}
        </div>
      </div>

      {/* Alert List */}
      {displayed.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-[#555]">
            {view === "active" ? "No active alerts" : "No alert history"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#111]">
          {displayed.map((alert) => (
            <div
              key={alert.id}
              className={`px-4 py-3 ${
                alert.status === "resolved" ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`mt-1.5 w-2 h-2 shrink-0 ${alertLevelDot(
                      alert.level as "info" | "warning" | "critical"
                    )}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-[#ccc] leading-tight">
                      {alert.title}
                    </p>
                    <p className="text-[11px] text-[#555] mt-1 leading-relaxed">
                      {alert.message}
                    </p>
                    {alert.action_required && alert.status !== "resolved" && (
                      <p className="text-[10px] text-[#666] mt-1 font-mono">
                        Action: {alert.action_required}
                      </p>
                    )}
                    <p className="text-[10px] text-[#333] mt-1 font-mono">
                      {formatDistanceToNow(new Date(alert.created_at), {
                        addSuffix: true,
                      })}
                      {alert.status === "resolved" && alert.read_at && (
                        <span className="ml-2">
                          -- resolved{" "}
                          {formatDistanceToNow(new Date(alert.read_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {alert.status !== "resolved" && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    disabled={resolving.has(alert.id)}
                    className="text-[10px] font-mono text-[#555] hover:text-[#888] border border-[#1a1a1a] hover:border-[#333] px-2 py-1 shrink-0 transition disabled:opacity-30"
                  >
                    {resolving.has(alert.id) ? "..." : "Resolve"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
