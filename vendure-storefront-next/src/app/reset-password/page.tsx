import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ResetPasswordForm } from './reset-password-form';

export default function ResetPasswordPage({ searchParams }: any) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <Suspense fallback={
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
                    </div>
                }>
                    <ResetPasswordForm searchParams={searchParams} />
                </Suspense>
            </div>
        </div>
    );
}
