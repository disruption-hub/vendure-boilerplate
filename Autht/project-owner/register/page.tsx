"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Phone, ArrowRight, Loader2, User, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CountryCodeSelect from '../../investor-portal/components/CountryCodeSelect';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

type Step = 'details' | 'otp';

export default function ProjectOwnerRegister() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('details');
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+1');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);

    const startTimer = () => {
        setTimer(120);
        setCanResend(false);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'otp' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        await handleRegister({ preventDefault: () => { } } as React.FormEvent);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/project-owner/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, contactName, countryCode, phoneNumber }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');

            toast.success('Verification code sent!');
            setStep('otp');
            startTimer();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent | React.ChangeEvent, otpValue?: string) => {
        if (e) e.preventDefault();
        const codeToVerify = otpValue || otp;

        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ countryCode, phoneNumber, otp: codeToVerify }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Verification failed');

            // Store token
            localStorage.setItem('project_owner_token', data.access_token);
            if (data.user?.name) localStorage.setItem('project_owner_name', data.user.name);

            // Redirect based on approval status
            router.push('/project-owner/dashboard');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen py-24 flex items-center justify-center p-6 bg-slate-950">
            <div className="max-w-md w-full">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="h-16 flex items-center justify-center hover:opacity-80 transition-opacity">
                        <img src="/new-logo.png" alt="Infrabricks" className="h-full w-auto object-contain" />
                    </Link>
                </div>

                <AnimatePresence mode="wait">
                    {/* Registration Details */}
                    {step === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-slate-900 rounded-3xl p-8 border border-white/10"
                        >
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-7 h-7 text-purple-500" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Partner Registration</h1>
                                <p className="text-slate-400 text-sm">Join as an Infrastructure Project Owner</p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Company / Legal Entity Name"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
                                    />
                                </div>

                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={contactName}
                                        onChange={(e) => setContactName(e.target.value)}
                                        placeholder="Person in Charge Name"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
                                    />
                                </div>

                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Business Email"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Mobile Number"
                                            required
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                                </Button>

                                <div className="text-center mt-4">
                                    <span className="text-slate-500 text-sm">Already have an account? </span>
                                    <Link href="/project-owner/login" className="text-purple-400 hover:text-purple-300 text-sm font-semibold">
                                        Sign In
                                    </Link>
                                </div>
                            </form >
                        </motion.div >
                    )
                    }

                    {/* OTP Verification */}
                    {
                        step === 'otp' && (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-slate-900 rounded-3xl p-8 border border-white/10"
                            >
                                <div className="text-center mb-8">
                                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck className="w-7 h-7 text-purple-500" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-white mb-2">Verify Phone</h1>
                                    <p className="text-slate-400 text-sm">
                                        Enter 6-digit code sent to {countryCode} {phoneNumber}
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    <div>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setOtp(val);
                                                if (val.length === 6) {
                                                    handleVerifyOtp(e, val);
                                                }
                                            }}
                                            placeholder="000000"
                                            maxLength={6}
                                            required
                                            className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-700 focus:border-purple-500 focus:outline-none"
                                        />
                                        <div className="flex flex-col items-center mt-4 space-y-2">
                                            <p className="text-sm text-slate-400">
                                                Code expires in <span className="text-white font-mono">{formatTime(timer)}</span>
                                            </p>
                                            {canResend && (
                                                <button
                                                    type="button"
                                                    onClick={handleResendOtp}
                                                    className="text-purple-400 hover:text-purple-300 text-sm font-bold transition-colors"
                                                >
                                                    Resend Code
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading || otp.length !== 6}
                                        className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                                    </Button>
                                </form>
                            </motion.div>
                        )
                    }
                </AnimatePresence >
            </div >
        </main >
    );
}
