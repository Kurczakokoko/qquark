"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Minimal error boundary for the canvas area.
 * We don't want a full app crash if tldraw or the bridge has an edge-case failure.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[qquark] Uncaught error in canvas area:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full items-center justify-center bg-zinc-950 text-center p-8">
            <div>
              <div className="text-lg font-medium text-white/80 mb-2">Something went wrong</div>
              <div className="text-sm text-white/50 max-w-xs">
                The canvas encountered an unexpected error. Please refresh the page or load a different board.
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
