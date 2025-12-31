import { ForgotPasswordForm } from './forgot-password-form';

export default async function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <ForgotPasswordForm />
            </div>
        </div>
    );
}
