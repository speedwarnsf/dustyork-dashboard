"use client";

import { motion } from "framer-motion";
import { useId } from "react";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  strokeWidth?: number;
  showDots?: boolean;
  animated?: boolean;
};

export default function Sparkline({
  data,
  width = 120,
  height = 32,
  color = "#7bdcff",
  gradientFrom,
  gradientTo,
  strokeWidth = 1.5,
  showDots = false,
  animated = true,
}: SparklineProps) {
  const id = useId();
  const gradientId = `sparkline-grad-${id}`;
  const fillGradientId = `sparkline-fill-${id}`;

  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * innerW,
    y: padding + innerH - ((val - min) / range) * innerH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        {(gradientFrom || gradientTo) && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientFrom || color} />
            <stop offset="100%" stopColor={gradientTo || color} />
          </linearGradient>
        )}
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientFrom || color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={gradientFrom || color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill={`url(#${fillGradientId})`}
        initial={animated ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={gradientFrom ? `url(#${gradientId})` : color}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* End dot */}
      {showDots && points.length > 0 && (
        <motion.circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2.5}
          fill={color}
          initial={animated ? { scale: 0 } : undefined}
          animate={{ scale: 1 }}
          transition={{ delay: 1 }}
        />
      )}
    </svg>
  );
}

// Helper to generate fake sparkline data from activity counts
export function generateActivitySparkline(days: number = 7): number[] {
  // This would be replaced with real data in production
  return Array.from({ length: days }, () => Math.floor(Math.random() * 10));
}
