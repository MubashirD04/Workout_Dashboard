import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Uncaught error in page content:', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Card className="p-8 flex flex-col items-center text-center gap-4 max-w-md mx-auto mt-10">
                    <div className="p-3 rounded-full bg-red-500/10 text-red-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Something went wrong</h3>
                        <p className="text-sm text-slate-400 mt-1">
                            This page hit an unexpected error. This can sometimes happen right after sign-in while your session finishes loading.
                        </p>
                    </div>
                    <Button onClick={this.handleRetry} variant="secondary" className="mt-1">
                        Try Again
                    </Button>
                </Card>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;