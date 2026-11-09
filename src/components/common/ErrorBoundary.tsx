import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled runtime error in UI component:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[var(--bg)]">
          <div className="max-w-md w-full p-8 rounded-[24px] bg-[var(--s1)] border border-[var(--bd)] text-center flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="font-semibold text-lg text-[var(--t1)]">
              An unexpected display issue occurred
            </div>
            <p className="text-xs text-[var(--t3)] leading-relaxed">
              We encountered a glitch displaying this showroom section. Your session and bag are safe.
            </p>
            {this.state.error?.message && (
              <div className="p-3 rounded-[12px] bg-[var(--s0)] border border-[var(--bd)] text-[11px] font-mono text-neutral-400 max-w-full overflow-hidden text-ellipsis text-left">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-full bg-[var(--sw)] border border-[var(--bdw)] text-[var(--tw)] text-xs font-semibold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                Go to Storefront
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
