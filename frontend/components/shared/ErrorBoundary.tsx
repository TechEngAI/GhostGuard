"use client";

import React, { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export function ErrorBoundary({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-black text-ink">Something went wrong</h2>
        <p className="mt-2 text-sm text-ink-secondary">{message || "Unable to load data. Please try again."}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-6 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export class ErrorBoundaryWrapper extends React.Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorBoundary message={this.state.error?.message} onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
