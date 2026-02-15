"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, AlertTriangle, FileText, Terminal, Send, Camera, Scan, Zap } from "lucide-react";
import toast from "react-hot-toast";

type JournalEntry = {
  id: string;
  content: string;
  entry_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  projects: { name: string } | null;
};

type Alert = {
  id: string;
  level: string;
  category: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
  action_required: string | null;
};

type Project = {
  id: string;
  name: string;
  status: string;
};

type IoPanelProps = {
  ioJournal: JournalEntry[];
  recentJournal: JournalEntry[];
  alerts: Alert[];
  projects: Project[];
  portfolioHealth: number;
  needsAttention: string[];
};

export default function IoPanel({
  ioJournal,
  recentJournal,
  alerts,
  projects,
  portfolioHealth,
  needsAttention,
}: IoPanelProps) {
  const [commandInput, setCommandInput] = useState("");
  const [commandLog, setCommandLog] = useState<Array<{ type: "input" | "output"; text: string; time: string }>>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const criticalAlerts = alerts.filter((a) => a.level === "critical" || a.level === "warning");
  const activeAlerts = alerts.filter((a) => a.status === "unread");

  const healthStatus = portfolioHealth >= 80 ? "EXCELLENT" : portfolioHealth >= 60 ? "GOOD" : portfolioHealth >= 40 ? "FAIR" : "POOR";
  const healthColor = portfolioHealth >= 80 ? "text-green-400" : portfolioHealth >= 60 ? "text-[#d2ff5a]" : portfolioHealth >= 40 ? "text-yellow-400" : "text-red-400";

  async function runAction(action: string) {
    setLoading(action);
    try {
      const apiKey = "003e91026ee5b01243615147a7fd740e96058bda86e7ea60fd1bc3724e415d1f";

      if (action === "screenshots") {
        const res = await fetch("/api/screenshots", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
        });
        const data = await res.json();
        toast.success(`Screenshots: ${data.results?.length || 0} captured`);
        addLog("output", `Screenshot refresh complete. ${data.results?.length || 0} captured.`);
      } else if (action === "scan") {
        const res = await fetch("/api/alerts?scan=true", {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        const data = await res.json();
        toast.success(`Scan complete. ${data.alerts?.length || 0} active alerts.`);
        addLog("output", `Alert scan complete. ${data.alerts?.length || 0} active alerts found.`);
      } else if (action === "briefing") {
        addLog("output", "Redirecting to briefing page...");
        window.location.href = "/briefing";
        return;
      }
    } catch (err) {
      toast.error(`Action failed: ${err}`);
      addLog("output", `ERROR: ${err}`);
    } finally {
      setLoading(null);
    }
  }

  function addLog(type: "input" | "output", text: string) {
    setCommandLog((prev) => [...prev, { type, text, time: new Date().toLocaleTimeString() }]);
  }

  async function handleCommand() {
    const cmd = commandInput.trim();
    if (!cmd) return;

    addLog("input", cmd);
    setCommandInput("");
    setLoading("command");

    try {
      const apiKey = "003e91026ee5b01243615147a7fd740e96058bda86e7ea60fd1bc3724e415d1f";

      // Parse simple commands
      if (cmd.startsWith("status ")) {
        const projectName = cmd.slice(7).trim();
        const res = await fetch("/api/io", {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        const data = await res.json();
        const project = data.projects?.find((p: Project) => p.name.toLowerCase().includes(projectName.toLowerCase()));
        if (project) {
          addLog("output", `${project.name}: status=${project.status}, updated=${project.updated_at}`);
        } else {
          addLog("output", `No project found matching "${projectName}"`);
        }
      } else if (cmd.startsWith("journal ")) {
        // Format: journal ProjectName: message
        const match = cmd.slice(8).match(/^(.+?):\s*(.+)$/);
        if (match) {
          const [, projectName, content] = match;
          const res = await fetch("/api/io", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ action: "journal", projectName: projectName.trim(), content: content.trim() }),
          });
          const data = await res.json();
          if (data.success) {
            addLog("output", `Journal entry added to ${projectName.trim()}`);
            toast.success("Journal entry added");
          } else {
            addLog("output", `Error: ${data.error}`);
          }
        } else {
          addLog("output", "Format: journal ProjectName: your message here");
        }
      } else if (cmd === "health") {
        const res = await fetch("/api/io/status", {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        const data = await res.json();
        addLog("output", `Portfolio: ${data.portfolioHealth?.status?.toUpperCase()} (${data.portfolioHealth?.averageScore}/100) | Active: ${data.portfolioHealth?.totalActive} | Alerts: ${data.activeAlertsCount} | Needs attention: ${data.projectsNeedingAttention}`);
      } else if (cmd === "alerts") {
        const res = await fetch("/api/alerts", {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        const data = await res.json();
        if (data.alerts?.length) {
          data.alerts.slice(0, 5).forEach((a: Alert) => {
            addLog("output", `[${a.level.toUpperCase()}] ${a.title}: ${a.message}`);
          });
        } else {
          addLog("output", "No active alerts.");
        }
      } else if (cmd === "scan") {
        await runAction("scan");
      } else if (cmd === "screenshots") {
        await runAction("screenshots");
      } else if (cmd === "help") {
        addLog("output", "Commands: health | alerts | scan | screenshots | status <project> | journal <project>: <message> | help");
      } else {
        addLog("output", `Unknown command: "${cmd}". Type "help" for available commands.`);
      }
    } catch (err) {
      addLog("output", `ERROR: ${err}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white">Io Panel</h1>
          <p className="text-xs text-[#555] font-mono mt-1">Agent integration and command interface</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#555]">Portfolio:</span>
          <span className={healthColor}>{healthStatus} ({portfolioHealth}/100)</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard label="Active Alerts" value={activeAlerts.length} accent={activeAlerts.length > 0 ? "text-red-400 border-red-500/20" : "text-[#555] border-[#1a1a1a]"} />
        <StatusCard label="Critical" value={criticalAlerts.length} accent={criticalAlerts.length > 0 ? "text-yellow-400 border-yellow-500/20" : "text-[#555] border-[#1a1a1a]"} />
        <StatusCard label="Needs Attention" value={needsAttention.length} accent={needsAttention.length > 0 ? "text-orange-400 border-orange-500/20" : "text-[#555] border-[#1a1a1a]"} />
        <StatusCard label="Io Entries" value={ioJournal.length} accent="text-[#d2ff5a] border-[#d2ff5a]/20" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-mono text-[#555] uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <ActionButton
            icon={<Camera size={14} />}
            label="Refresh Screenshots"
            onClick={() => runAction("screenshots")}
            loading={loading === "screenshots"}
          />
          <ActionButton
            icon={<Scan size={14} />}
            label="Scan Alerts"
            onClick={() => runAction("scan")}
            loading={loading === "scan"}
          />
          <ActionButton
            icon={<FileText size={14} />}
            label="Generate Briefing"
            onClick={() => runAction("briefing")}
            loading={loading === "briefing"}
          />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Command Terminal */}
        <div>
          <h2 className="text-xs font-mono text-[#555] uppercase tracking-wider mb-3">Command Terminal</h2>
          <div className="border border-[#1a1a1a] bg-[#050505]">
            {/* Log output */}
            <div className="h-64 overflow-y-auto p-3 font-mono text-xs space-y-1">
              {commandLog.length === 0 && (
                <p className="text-[#333]">Type &quot;help&quot; for available commands.</p>
              )}
              {commandLog.map((entry, i) => (
                <div key={i} className={entry.type === "input" ? "text-[#d2ff5a]" : "text-[#888]"}>
                  <span className="text-[#333] mr-2">[{entry.time}]</span>
                  {entry.type === "input" && <span className="text-[#555] mr-1">&gt;</span>}
                  {entry.text}
                </div>
              ))}
            </div>
            {/* Input */}
            <div className="border-t border-[#1a1a1a] flex items-center">
              <span className="text-[#d2ff5a] text-xs font-mono pl-3 pr-2">&gt;</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleCommand();
                }}
                placeholder="Enter command..."
                className="flex-1 bg-transparent text-xs font-mono text-[#e8e8e8] py-3 pr-3 outline-none placeholder:text-[#333]"
                disabled={!!loading}
              />
              <button
                onClick={handleCommand}
                disabled={!!loading || !commandInput.trim()}
                className="p-3 text-[#555] hover:text-[#d2ff5a] transition disabled:opacity-30"
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Active Alerts */}
        <div>
          <h2 className="text-xs font-mono text-[#555] uppercase tracking-wider mb-3">
            Active Alerts ({activeAlerts.length})
          </h2>
          <div className="border border-[#1a1a1a] bg-[#050505] h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#333] text-xs font-mono">
                No active alerts
              </div>
            ) : (
              <div className="divide-y divide-[#111]">
                {alerts.slice(0, 15).map((alert) => (
                  <div key={alert.id} className="px-3 py-2.5 hover:bg-[#0a0a0a] transition">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        size={12}
                        className={
                          alert.level === "critical" ? "text-red-400 mt-0.5" :
                          alert.level === "warning" ? "text-yellow-400 mt-0.5" :
                          "text-[#555] mt-0.5"
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#ccc] truncate">{alert.title}</p>
                        <p className="text-[10px] text-[#555] mt-0.5 truncate">{alert.message}</p>
                      </div>
                      <span className="text-[10px] text-[#333] font-mono shrink-0">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div>
          <h2 className="text-xs font-mono text-[#555] uppercase tracking-wider mb-3">Projects Needing Attention</h2>
          <div className="flex flex-wrap gap-2">
            {needsAttention.map((name) => (
              <span key={name} className="px-3 py-1.5 border border-orange-500/20 text-orange-400 text-xs font-mono">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Io Activity */}
      <div>
        <h2 className="text-xs font-mono text-[#555] uppercase tracking-wider mb-3">
          Recent Io Activity ({ioJournal.length})
        </h2>
        <div className="border border-[#1a1a1a] bg-[#050505] divide-y divide-[#111]">
          {ioJournal.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#333] text-xs font-mono">
              No Io activity recorded yet. Use the API or command terminal to post updates.
            </div>
          ) : (
            ioJournal.slice(0, 15).map((entry) => (
              <div key={entry.id} className="px-4 py-3 hover:bg-[#0a0a0a] transition">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={10} className="text-[#d2ff5a]" />
                  <span className="text-[11px] text-[#d2ff5a] font-mono">
                    {entry.projects?.name || "Unknown"}
                  </span>
                  <span className="text-[10px] text-[#333] font-mono ml-auto">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-[#888] pl-4">{entry.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent All Activity */}
      <div>
        <h2 className="text-xs font-mono text-[#555] uppercase tracking-wider mb-3">
          Recent Journal Activity
        </h2>
        <div className="border border-[#1a1a1a] bg-[#050505] divide-y divide-[#111]">
          {recentJournal.slice(0, 10).map((entry) => (
            <div key={entry.id} className="px-4 py-3 hover:bg-[#0a0a0a] transition">
              <div className="flex items-center gap-2 mb-1">
                <Terminal size={10} className="text-[#555]" />
                <span className="text-[11px] text-[#777] font-mono">
                  {entry.projects?.name || "Unknown"}
                </span>
                <span className="text-[10px] text-[#333] font-mono">{entry.entry_type}</span>
                <span className="text-[10px] text-[#333] font-mono ml-auto">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-[#666] pl-4 truncate">{entry.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`border ${accent.includes("border-") ? accent.split(" ").find(c => c.startsWith("border-")) : "border-[#1a1a1a]"} bg-[#050505] px-4 py-3`}>
      <p className="text-[10px] text-[#555] font-mono uppercase">{label}</p>
      <p className={`text-xl font-mono mt-1 ${accent.split(" ").find(c => c.startsWith("text-")) || "text-white"}`}>{value}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick, loading }: { icon: React.ReactNode; label: string; onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-3 border border-[#1a1a1a] bg-[#050505] text-xs font-mono text-[#888] hover:text-white hover:border-[#333] transition disabled:opacity-50"
    >
      {loading ? <RefreshCw size={14} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}
