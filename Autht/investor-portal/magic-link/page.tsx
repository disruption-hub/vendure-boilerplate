"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

function MagicLinkVerification() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your magic link...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            const msg = 'Invalid verification link. Token is missing.';
            setMessage(msg);
            toast.error(msg);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/magic-link/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, email }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Verification failed');
                }

                // Store auth data
                localStorage.setItem('investor_token', data.access_token);
                if (data.user?.name) localStorage.setItem('investor_name', data.user.name);
                if (data.user?.id) localStorage.setItem('investor_id', data.user.id);
                if (data.user?.email) localStorage.setItem('investor_email', data.user.email);
                if (data.user?.roles) {
                    localStorage.setItem('investor_roles', JSON.stringify(data.user.roles));

                    const roles = data.user.roles as string[];
                    if (roles.includes('PROJECT_OWNER')) {
                        localStorage.setItem('project_owner_token', data.access_token);
                    }
                    if (roles.includes('SYSTEM_ADMIN')) {
                        localStorage.setItem('admin_token', data.access_token);
                    }
                }

                setStatus('success');
                const msg = 'Successfully verified! Redirecting to dashboard...';
                setMessage(msg);
                toast.success(msg);

                // Redirect after a short delay
                setTimeout(() => {
                    router.push('/investor-portal/dashboard');
                }, 2000);
            } catch (err: any) {
                setStatus('error');
                const msg = err.message || 'Failed to verify magic link. It may have expired.';
                setMessage(msg);
                toast.error(msg);
            }
        };

        verifyToken();
    }, [token, router]);

    return (
        <div className="min-h-screen bg-brand-blue flex items-center justify-center p-6">
            <div className="glass max-w-md w-full p-8 rounded-3xl border border-white/10 text-center">

                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-brand-gold animate-spin mb-6" />
                        <h2 className="text-xl font-bold text-white mb-2">Verifying...</h2>
                        <p className="text-brand-slate">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
                        <p className="text-brand-slate">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                        <div className="mb-8" />
                        <Button
                            onClick={() => router.push('/investor-portal/login')}
                            className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-bold"
                        >
                            Back to Login
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-brand-blue flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
            </div>
        }>
            <MagicLinkVerification />
        </Suspense>
    );
}
