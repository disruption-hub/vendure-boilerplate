'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="glass rounded-3xl p-8 border border-white/10 text-center max-w-md w-full">
                <h2 className="text-2xl font-bold text-white mb-4">Something went wrong!</h2>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                    <p className="text-red-400 text-sm font-mono break-all">{error.message}</p>
                    {error.digest && <p className="text-brand-slate text-xs mt-2">Digest: {error.digest}</p>}
                </div>
                <Button
                    onClick={() => reset()}
                    className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold"
                >
                    Try again
                </Button>
            </div>
        </div>
    );
}
