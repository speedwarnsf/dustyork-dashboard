"use client";
import { Icon } from "./Icon";

import { Component, ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="rounded-none border border-red-500/30 bg-red-500/5 p-6 text-center">
          <div className="mb-4"><Icon name="warning" size={48} /></div>
          <h2 className="text-lg font-semibold text-red-400 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[#8b8b8b] mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-none border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simpler function component for error display
export function ErrorCard({
  title = "Error",
  message = "Something went wrong",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-none border border-red-500/30 bg-red-500/5 p-6 text-center">
      <div className="mb-4"><Icon name="warning" size={48} /></div>
      <h2 className="text-lg font-semibold text-red-400 mb-2">{title}</h2>
      <p className="text-sm text-[#8b8b8b] mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-none border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
        >
          Try again
        </button>
      )}
    </div>
  );
}
