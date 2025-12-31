'use client';

import { use, useActionState } from 'react';
import { resetPasswordAction } from './actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Lock, Loader2, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResetPasswordFormProps {
    searchParams: Promise<{ token?: string }>;
}

export function ResetPasswordForm({ searchParams }: ResetPasswordFormProps) {
    const params = use(searchParams);
    const token = params.token || null;

    const [state, formAction, isPending] = useActionState(resetPasswordAction, undefined);

    if (!token) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl p-8 border border-white/10 text-center"
            >
                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
                <p className="text-brand-slate text-sm mb-8">
                    The password reset link is invalid or has expired.
                </p>
                <Link href="/forgot-password">
                    <Button className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl h-12">
                        Request New Link
                    </Button>
                </Link>
            </motion.div>
        );
    }

    if (state?.success) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl p-8 border border-white/10 text-center"
            >
                <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Password Reset</h1>
                <p className="text-brand-slate text-sm mb-8">
                    Your password has been successfully reset.
                </p>
                <Link href="/sign-in">
                    <Button className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl h-12">
                        Sign In Now
                    </Button>
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 border border-white/10"
        >
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-7 h-7 text-brand-gold" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                <p className="text-brand-slate text-sm">Create a new secure password</p>
            </div>

            <form action={formAction} className="space-y-6">
                <input type="hidden" name="token" value={token} />

                <div className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate" />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="New password"
                            required
                            disabled={isPending}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none text-sm"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate" />
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            required
                            disabled={isPending}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none text-sm"
                        />
                    </div>
                </div>

                {state?.error && (
                    <div className="text-sm text-red-500 text-center">
                        {state.error}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-12 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                </Button>

                <div className="text-center">
                    <Link
                        href="/sign-in"
                        className="inline-flex items-center gap-2 text-sm text-brand-slate hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                    </Link>
                </div>
            </form>
        </motion.div>
    );
}
