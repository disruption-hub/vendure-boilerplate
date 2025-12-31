import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mail, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

async function VerifyPendingContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const resolvedParams = await searchParams;
    const redirectTo = resolvedParams?.redirectTo as string | undefined;

    const signInHref = redirectTo
        ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/sign-in';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 border border-white/10 text-center"
        >
            <div className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-brand-gold" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-brand-slate text-sm mb-8">
                We&apos;ve sent a verification link to your email address.
                Please check your inbox to activate your account.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left">
                <p className="text-xs text-brand-slate leading-relaxed">
                    Don&apos;t see the email? Check your spam folder or wait a few minutes.
                </p>
            </div>

            <Link href={signInHref}>
                <Button className="w-full h-12 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 group">
                    Go to Sign In
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </Link>
        </motion.div>
    );
}

export default async function VerifyPendingPage({ searchParams }: any) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <Suspense fallback={
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
                    </div>
                }>
                    <VerifyPendingContent searchParams={searchParams} />
                </Suspense>
            </div>
        </div>
    );
}
