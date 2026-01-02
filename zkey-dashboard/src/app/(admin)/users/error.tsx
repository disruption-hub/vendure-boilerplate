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
        // Log the error to an error reporting service
        console.error('Users Page Error:', error);
    }, [error]);

    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="bg-red-50 text-red-900 p-6 rounded-2xl border border-red-100 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
                <p className="text-sm text-red-700/80 mb-6">
                    {error.message || 'An unexpected error occurred while rendering the users page.'}
                </p>
                {error.digest && (
                    <div className="text-xs font-mono bg-red-100/50 p-2 rounded mb-6 break-all">
                        Digest: {error.digest}
                    </div>
                )}
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold"
                    >
                        Try again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-white border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition font-semibold"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        </div>
    );
}
