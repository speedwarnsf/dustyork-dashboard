"use client";
import { Icon } from "./Icon";

import type { ProjectHealth } from "@/lib/types";
import { getHealthColor, getHealthLabel } from "@/lib/health";

type Props = {
  health: ProjectHealth;
  size?: "sm" | "md" | "lg";
  showFactors?: boolean;
};

export default function HealthScore({ health, size = "md", showFactors = false }: Props) {
  const sizeClasses = {
    sm: "w-12 h-12 text-sm",
    md: "w-16 h-16 text-lg",
    lg: "w-24 h-24 text-2xl",
  };

  const strokeWidth = size === "sm" ? 3 : size === "md" ? 4 : 5;
  const radius = size === "sm" ? 20 : size === "md" ? 28 : 42;
  const circumference = 2 * Math.PI * radius;
  const progress = (health.score / 100) * circumference;

  const colorClass = getHealthColor(health);
  const label = getHealthLabel(health);

  return (
    <div className={showFactors ? "space-y-4" : ""}>
      {/* Circular Progress */}
      <div className="flex items-center gap-4">
        <div className={`relative ${sizeClasses[size]}`}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-[#1c1c1c]"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              className={colorClass.split(" ")[0]}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          {/* Score number */}
          <div className="absolute inset-0 flex items-center justify-center font-bold">
            {health.score}
          </div>
        </div>

        {/* Label */}
        <div>
          <p className={`font-medium ${colorClass.split(" ")[0]}`}>{label}</p>
          {health.alerts.length > 0 && size !== "sm" && (
            <p className="text-xs text-[#666] mt-1">
              {health.alerts[0]}
            </p>
          )}
        </div>
      </div>

      {/* Factor breakdown */}
      {showFactors && (
        <div className="space-y-2">
          <FactorBar
            label="Commit Activity"
            value={health.factors.commitActivity}
            max={30}
            icon="edit"
          />
          <FactorBar
            label="Deployment"
            value={health.factors.deploymentStatus}
            max={25}
            icon="upload"
          />
          <FactorBar
            label="Issue Health"
            value={health.factors.issueHealth}
            max={25}
            icon="chat"
          />
          <FactorBar
            label="CI/CD"
            value={health.factors.ciStatus}
            max={15}
            icon="settings"
          />
          <FactorBar
            label="Freshness"
            value={health.factors.freshnessScore}
            max={5}
            icon="clock"
          />
        </div>
      )}

      {/* Alerts */}
      {showFactors && health.alerts.length > 0 && (
        <div className="mt-4 p-3 rounded-none bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-xs font-medium text-yellow-400 mb-2"><Icon name="warning" size={16} /> Attention Needed</p>
          <ul className="text-xs text-[#8b8b8b] space-y-1">
            {health.alerts.map((alert, i) => (
              <li key={i}>• {alert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FactorBar({
  label,
  value,
  max,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  icon: string;
}) {
  const percentage = (value / max) * 100;
  const color =
    percentage >= 80
      ? "bg-green-400"
      : percentage >= 60
      ? "bg-cyan-400"
      : percentage >= 40
      ? "bg-yellow-400"
      : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-5"><Icon name={icon} size={14} /></span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[#8b8b8b]">{label}</span>
          <span className="text-[#666]">{value}/{max}</span>
        </div>
        <div className="h-1.5 bg-[#1c1c1c] rounded-none overflow-hidden">
          <div
            className={`h-full ${color} rounded-none transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
