'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { requestPasswordResetAction } from './actions';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form';
import Link from 'next/link';
import { Mail, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const forgotPasswordSchema = z.object({
    emailAddress: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            emailAddress: '',
        },
    });

    const onSubmit = (data: ForgotPasswordFormData) => {
        setServerError(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.append('emailAddress', data.emailAddress);

            const result = await requestPasswordResetAction(undefined, formData);
            if (result?.error) {
                setServerError(result.error);
            } else {
                setIsSuccess(true);
            }
        });
    };

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
                <h1 className="text-2xl font-bold text-white mb-2">Forgot Password</h1>
                <p className="text-brand-slate text-sm">Enter your email to reset your password</p>
            </div>

            {isSuccess ? (
                <div className="text-center space-y-6">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                        Check your email for a reset link.
                    </div>
                    <Link href="/sign-in">
                        <Button className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl mt-4">
                            Back to Sign In
                        </Button>
                    </Link>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="emailAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate" />
                                            <input
                                                type="email"
                                                placeholder="Email address"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none text-sm"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {serverError && (
                            <div className="text-sm text-red-500 text-center">
                                {serverError}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
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
                </Form>
            )}
        </motion.div>
    );
}
