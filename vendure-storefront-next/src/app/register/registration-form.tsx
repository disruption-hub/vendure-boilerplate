'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { registerAction } from './actions';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form';
import Link from 'next/link';
import { User, Mail, Phone, Loader2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import CountryCodeSelect from '@/components/ui/country-code-select';
import { useAutoCountryCode } from '@/hooks/use-auto-country-code';

const registrationSchema = z.object({
    emailAddress: z.string().email('Please enter a valid email address'),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    countryCode: z.string().min(1, 'Required'),
    phoneNumber: z.string().min(6, 'Valid phone number is required'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
    redirectTo?: string;
}

export function RegistrationForm({ redirectTo }: RegistrationFormProps) {
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);
    const [countryCode, setCountryCode] = useAutoCountryCode('+1');

    const form = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            emailAddress: '',
            firstName: '',
            lastName: '',
            countryCode: '+1',
            phoneNumber: '',
        },
    });

    // Update form value when countryCode syncs from hook
    if (form.getValues('countryCode') !== countryCode) {
        form.setValue('countryCode', countryCode);
    }

    const onSubmit = (data: RegistrationFormData) => {
        setServerError(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.append('emailAddress', data.emailAddress);
            formData.append('firstName', data.firstName);
            formData.append('lastName', data.lastName);
            formData.append('countryCode', data.countryCode);
            formData.append('phoneNumber', data.phoneNumber);

            if (redirectTo) {
                formData.append('redirectTo', redirectTo);
            }

            const result = await registerAction(undefined, formData);
            if (result?.error) {
                setServerError(result.error);
            }
        });
    };

    const signInHref = redirectTo
        ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/sign-in';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 border border-white/10"
        >
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-7 h-7 text-brand-gold" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
                <p className="text-brand-slate text-sm">Join us and start shopping</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate" />
                                            <input
                                                type="text"
                                                placeholder="First name"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none text-sm"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate" />
                                            <input
                                                type="text"
                                                placeholder="Last name"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none text-sm"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>

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

                    <div className="flex gap-2">
                        <FormField
                            control={form.control}
                            name="countryCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <CountryCodeSelect
                                            value={field.value}
                                            onChange={(val) => {
                                                field.onChange(val);
                                                setCountryCode(val);
                                            }}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate" />
                                            <input
                                                type="tel"
                                                placeholder="Phone number"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none text-sm"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>

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
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </Button>

                    <div className="text-sm text-center text-brand-slate mt-6">
                        Already have an account?{' '}
                        <Link href={signInHref} className="text-brand-gold hover:underline font-medium">
                            Sign in
                        </Link>
                    </div>
                </form>
            </Form>
        </motion.div>
    );
}
