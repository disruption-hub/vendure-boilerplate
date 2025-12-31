'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginForm } from './login-form';

export default function SignInPage() {
    const { initiateOIDCLogin } = useAuth();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');
    const [showLocal, setShowLocal] = useState(false);

    useEffect(() => {
        // Automatically redirect to OIDC login after a short delay
        const timer = setTimeout(() => {
            if (!showLocal) {
                initiateOIDCLogin(redirectPath || undefined);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [initiateOIDCLogin, redirectPath, showLocal]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="glass rounded-[2rem] p-10 border border-white/10 text-center shadow-2xl">
                    <div className="mb-8">
                        <div className="w-20 h-20 bg-brand-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-brand-gold/20">
                            <ShieldCheck className="w-10 h-10 text-brand-gold" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">Welcome Back</h1>
                        <p className="text-brand-slate text-base">
                            Secure authentication powered by ZKey
                        </p>
                    </div>

                    {!showLocal ? (
                        <div className="space-y-6">
                            <Button
                                onClick={() => initiateOIDCLogin(redirectPath || undefined)}
                                className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                            >
                                Continue to Secure Sign In
                                <ArrowRight className="w-5 h-5" />
                            </Button>

                            <div className="flex items-center gap-3 py-2">
                                <Loader2 className="w-4 h-4 animate-spin text-brand-gold/50" />
                                <span className="text-brand-slate/60 text-sm">Redirecting automatically...</span>
                            </div>

                            <button
                                onClick={() => setShowLocal(true)}
                                className="text-brand-slate hover:text-white text-sm transition-colors mt-4 block mx-auto underline-offset-4 hover:underline"
                            >
                                Use traditional login instead
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <LoginForm redirectTo={redirectPath || undefined} />

                            <button
                                onClick={() => setShowLocal(false)}
                                className="text-brand-slate hover:text-white text-sm transition-colors block mx-auto py-2"
                            >
                                Back to ZKey Sign In
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}