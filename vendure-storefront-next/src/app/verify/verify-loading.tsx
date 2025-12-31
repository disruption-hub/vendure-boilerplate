'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function VerifyLoading() {
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
