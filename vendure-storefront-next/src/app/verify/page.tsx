import { Suspense } from 'react';
import { VerifyContent } from './verify-content';
import { VerifyLoading } from './verify-loading';


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
