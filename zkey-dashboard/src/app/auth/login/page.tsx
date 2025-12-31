import { LoginForm } from './login-form';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function LoginFallback() {
    return (
        <div className="glass rounded-3xl p-8 border border-white/10 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-brand-gold mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Loading Login Form</h1>
            <p className="text-brand-slate text-sm">Please wait while we prepare your secure session...</p>
        </div>
    );
}

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ interactionId?: string }>;
}) {
    const { interactionId } = await searchParams;

    if (!interactionId) {
        redirect('/');
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <Suspense fallback={<LoginFallback />}>
                    <LoginForm interactionId={interactionId} />
                </Suspense>
            </div>
        </div>
    );
}
