'use client';

import { Suspense, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function RegisterContent() {
    const { initiateOIDCLogin } = useAuth();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');

    useEffect(() => {
        // Automatically redirect to OIDC login (registration should be handled there)
        initiateOIDCLogin(redirectPath || undefined);
    }, [initiateOIDCLogin, redirectPath]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <div className="glass rounded-3xl p-8 border border-white/10 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-brand-gold mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Redirecting to Sign Up</h1>
                    <p className="text-brand-slate text-sm">
                        You will be redirected to our secure authentication page...
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4 sm:px-6 lg:px-8">
                <Loader2 className="w-12 h-12 animate-spin text-brand-gold" />
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}