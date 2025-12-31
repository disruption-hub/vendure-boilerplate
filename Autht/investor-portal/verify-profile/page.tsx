'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

function VerifyProfileContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your changes...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/verify-profile-change`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Verification failed');
                }

                setStatus('success');
                setMessage('Your profile has been successfully updated. Redirecting...');
                setTimeout(() => {
                    router.push('/investor-portal/profile');
                }, 3000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Failed to verify profile changes.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-8 text-center shadow-2xl"
            >
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-brand-gold animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Verifying...</h2>
                        <p className="text-brand-slate">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Update Confirmed!</h2>
                        <p className="text-brand-slate mb-8">{message}</p>
                        <Button
                            onClick={() => router.push('/investor-portal/profile')}
                            className="w-full bg-brand-gold text-black hover:bg-brand-gold/90 font-bold h-12 rounded-xl"
                        >
                            Back to Profile <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                        <p className="text-brand-slate mb-8">{message}</p>
                        <Button
                            onClick={() => router.push('/investor-portal/profile')}
                            variant="outline"
                            className="w-full h-12 rounded-xl border-white/10 text-black hover:bg-white/5"
                        >
                            Back to Profile
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default function VerifyProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-brand-dark flex items-center justify-center"><Loader2 className="animate-spin text-brand-gold" /></div>}>
            <VerifyProfileContent />
        </Suspense>
    );
}
