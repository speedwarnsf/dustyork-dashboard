"use client";

import { formatDistanceToNow } from "date-fns";
import { useSyncExternalStore } from "react";

// Use useSyncExternalStore to safely handle client-only rendering
// This pattern avoids the hydration mismatch issue without useState in useEffect
function subscribe() {
  // No actual subscription needed - we just want to trigger re-render on mount
  return () => {};
}

function getSnapshot() {
  return true; // Client is mounted
}

function getServerSnapshot() {
  return false; // Server is not mounted
}

function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

type TimeAgoProps = {
  date: string | null;
  prefix?: string;
  fallback?: string;
};

export default function TimeAgo({ date, prefix = "", fallback = "..." }: TimeAgoProps) {
  const isMounted = useIsMounted();
  
  if (!isMounted || !date) {
    return <span>{fallback}</span>;
  }
  
  const text = formatDistanceToNow(new Date(date), { addSuffix: true });
  
  return (
    <span suppressHydrationWarning>
      {prefix}{text}
    </span>
  );
}

// Hook to get current timestamp only on client
function useNow() {
  return useSyncExternalStore(
    () => () => {},
    () => Date.now(),
    () => 0
  );
}

// Variant that shows days since update
export function DaysSince({ date, fallback = "..." }: { date: string; fallback?: string }) {
  const isMounted = useIsMounted();
  const now = useNow();
  
  if (!isMounted || now === 0) {
    return <span>{fallback}</span>;
  }
  
  const days = Math.floor(
    (now - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return <span suppressHydrationWarning>{days}d ago</span>;
}
