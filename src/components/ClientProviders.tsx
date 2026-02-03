"use client";

import { ToastProvider } from "./Toast";
import CommandPalette from "./CommandPalette";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      {children}
      <CommandPalette />
    </ToastProvider>
  );
}
