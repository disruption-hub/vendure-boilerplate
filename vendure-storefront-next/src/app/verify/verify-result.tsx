'use client';

import { use } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowLeft, UserPlus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type VerifyResultType = { success: boolean; error?: undefined } | { error: string; success?: undefined };

interface VerifyResultProps {
    resultPromise: Promise<VerifyResultType>;
}

export function VerifyResult({ resultPromise }: VerifyResultProps) {
    const result = use(resultPromise);
    const isSuccess = 'success' in result;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-12 border border-white/10 text-center"
        >
            <AnimatePresence mode="wait">
                {isSuccess ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="space-y-6"
                    >
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-2">Verified!</h1>
                        <p className="text-brand-slate text-base max-w-xs mx-auto mb-8">
                            Your email has been successfully verified. You can now access your account.
                        </p>

                        <Link href="/sign-in">
                            <Button className="w-full h-12 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 group">
                                Sign In Now
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="space-y-6"
                    >
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-2">Failed</h1>
                        <p className="text-brand-slate text-base max-w-xs mx-auto mb-8">
                            {result.error || 'Unable to verify your account at this time.'}
                        </p>

                        <div className="flex flex-col gap-4">
                            <Link href="/register">
                                <Button className="w-full h-12 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    Get a New Link
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
                )}
            </AnimatePresence>
        </motion.div>
    );
}
