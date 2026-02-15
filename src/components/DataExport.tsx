"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export default function DataExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dustyork-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const toast = (await import("react-hot-toast")).default;
      toast.success("Data exported");
    } catch (err) {
      const toast = (await import("react-hot-toast")).default;
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 border border-[#1a1a1a] px-4 py-2 text-[11px] text-[#555] hover:border-[#333] hover:text-[#999] transition disabled:opacity-30"
    >
      <Download size={12} />
      {isExporting ? "Exporting..." : "Export Data"}
    </button>
  );
}
