import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VerifyContent } from './verify-content';
import { motion } from 'framer-motion';

function VerifyLoading() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-12 border border-white/10 text-center"
        >
            <div className="flex justify-center mb-6">
                <Loader2 className="w-16 h-16 text-brand-gold animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Your Account</h1>
            <p className="text-brand-slate text-sm">
                Please wait while we verify your email address...
            </p>
        </motion.div>
    );
}

export default function VerifyPage({ searchParams }: any) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <Suspense fallback={<VerifyLoading />}>
                    <VerifyContent searchParams={searchParams} />
                </Suspense>
            </div>
        </div>
    );
}
