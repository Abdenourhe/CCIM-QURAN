"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center">
                        <p className="text-destructive font-semibold">Une erreur est survenue</p>
                        <p className="text-sm text-muted-foreground">
                            {this.state.error?.message || "Erreur inconnue"}
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="text-sm text-primary underline"
                        >
                            Réessayer
                        </button>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
