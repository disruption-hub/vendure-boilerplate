'use client';

import { Suspense } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OIDCClient } from '@/lib/oidc-client';
import { useAuth } from '@/components/auth/auth-provider';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { handleOIDCCallback } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        async function handleCallback() {
            try {
                const code = searchParams.get('code');
                const state = searchParams.get('state');
                const errorParam = searchParams.get('error');
                const errorDescription = searchParams.get('error_description');

                if (errorParam) {
                    throw new Error(errorDescription || errorParam);
                }

                if (!code || !state) {
                    throw new Error('Missing authorization code or state');
                }

                console.log('Exchanging OIDC code...');
                // Exchange code for tokens
                const tokens = await OIDCClient.exchangeCode(code, state);

                // Complete login in auth provider
                await handleOIDCCallback(tokens);

                // Get redirect path
                const redirectPath = OIDCClient.getAndClearRedirectPath();

                toast.success('Login successful!');
                router.push(redirectPath);
            } catch (err: any) {
                console.error('OAuth callback error:', err);
                setError(err.message || 'Authentication failed');
                toast.error(err.message || 'Authentication failed');

                // Redirect to sign-in after a delay
                setTimeout(() => {
                    router.push('/sign-in');
                }, 3000);
            }
        }

        handleCallback();
    }, [searchParams, router, handleOIDCCallback]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4">
                <div className="glass rounded-3xl p-8 border border-white/10 max-w-md w-full text-center">
                    <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Authentication Failed</h1>
                    <p className="text-brand-slate text-sm mb-4">{error}</p>
                    <p className="text-brand-slate text-xs">Redirecting to sign in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4">
            <div className="glass rounded-3xl p-8 border border-white/10 max-w-md w-full text-center">
                <Loader2 className="w-12 h-12 animate-spin text-brand-gold mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Completing Sign In</h1>
                <p className="text-brand-slate text-sm">Please wait while we authenticate you...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4">
                <div className="glass rounded-3xl p-8 border border-white/10 max-w-md w-full text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-brand-gold mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
