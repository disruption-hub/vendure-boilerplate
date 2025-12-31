'use client';

import { use } from 'react';
import { VerifyResult } from './verify-result';
import { verifyAccountAction } from './actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

interface VerifyContentProps {
    searchParams: Promise<{ token?: string }>;
}

export function VerifyContent({ searchParams }: VerifyContentProps) {
    const params = use(searchParams);
    const token = params.token;

    if (!token) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl p-12 border border-white/10 text-center"
            >
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Invalid Verification Link</h1>
                <p className="text-brand-slate text-sm mb-8">
                    The verification link is invalid or missing a token.
                </p>

                <div className="flex flex-col gap-4">
                    <Link href="/register">
                        <Button className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl h-12 flex items-center justify-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Create New Account
                        </Button>
                    </Link>
                    <Link href="/sign-in">
                        <Button variant="ghost" className="w-full text-brand-slate hover:text-white flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sign In
                        </Button>
                    </Link>
                </div>
            </motion.div>
        );
    }

    const verifyPromise = verifyAccountAction(token);

    return <VerifyResult resultPromise={verifyPromise} />;
}
