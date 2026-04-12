'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="p-8 bg-page min-h-screen">
            <div className="max-w-2xl mx-auto text-center py-16">
                <h1 className="text-3xl font-bold text-text-primary mb-4">Something went wrong</h1>
                <p className="text-text-muted mb-8">
                    An error occurred while loading this page. You can try again, or go back to the timeline.
                </p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={reset}
                        className="px-6 py-2.5 rounded-xl bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-bg-hover font-medium transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </div>
        </div>
    );
}
