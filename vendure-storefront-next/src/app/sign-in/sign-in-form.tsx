"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Wallet, Mail, ArrowRight, Loader2, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { requestOtpAction } from './actions';
import CountryCodeSelect from '@/components/ui/country-code-select';
import { useAutoCountryCode } from '@/hooks/use-auto-country-code';
import { WalletLogin } from '@/components/auth/wallet-login';
import Link from 'next/link';

type LoginMethod = 'phone' | 'email' | 'wallet';
type Step = 'choose' | 'input' | 'verify';

export function SignInForm() {
    const { loginWithOtp } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');

    const [method, setMethod] = useState<LoginMethod | null>(null);
    const [step, setStep] = useState<Step>('choose');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [countryCode, setCountryCode] = useAutoCountryCode('+1');
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'verify' && timer > 0) {
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

    const startTimer = () => {
        setTimer(120);
        setCanResend(false);
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const fullIdentifier = method === 'phone' ? `${countryCode}${identifier}` : identifier;
            await requestOtpAction(fullIdentifier, method as 'phone' | 'email');
            setStep('verify');
            startTimer();
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP.');
            toast.error(err.message || 'Failed to send OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent | React.ChangeEvent, otpValue?: string) => {
        if (e) e.preventDefault();
        const codeToVerify = otpValue || otp;
        if (codeToVerify.length !== 6) return;

        setError('');
        setIsLoading(true);
        try {
            const fullIdentifier = method === 'phone' ? `${countryCode}${identifier}` : identifier;
            await loginWithOtp(fullIdentifier, codeToVerify);
            const destination = redirectPath ? decodeURIComponent(redirectPath) : '/';
            router.push(destination);
            toast.success('Login successful!');
        } catch (err: any) {
            setError(err.message || 'Verification failed.');
            toast.error(err.message || 'Verification failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <AnimatePresence mode="wait">
                {/* Step 1: Choose Login Method */}
                {step === 'choose' && (
                    <motion.div
                        key="choose"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass rounded-3xl p-8 border border-white/10"
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                            <p className="text-brand-slate text-sm">Choose how you'd like to sign in</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => {
                                    setMethod('phone');
                                    setStep('input');
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                                    <Phone className="w-6 h-6 text-brand-gold" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-bold">Phone & OTP</p>
                                    <p className="text-brand-slate text-sm">Sign in with verification code</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-brand-slate group-hover:text-brand-gold transition-colors shrink-0" />
                            </button>

                            <button
                                onClick={() => {
                                    setMethod('email');
                                    setStep('input');
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                                    <Mail className="w-6 h-6 text-brand-gold" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-bold">Email</p>
                                    <p className="text-brand-slate text-sm">Sign in with verification code</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-brand-slate group-hover:text-brand-gold transition-colors shrink-0" />
                            </button>

                            <button
                                onClick={() => {
                                    setMethod('wallet');
                                    setStep('input');
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                                    <Wallet className="w-6 h-6 text-brand-gold" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-bold">Stellar Wallet</p>
                                    <p className="text-brand-slate text-sm">Sign in with your wallet</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-brand-slate group-hover:text-brand-gold transition-colors shrink-0" />
                            </button>
                        </div>

                        <p className="text-center text-brand-slate text-xs mt-6">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-brand-gold hover:underline">
                                Register now
                            </Link>
                        </p>
                    </motion.div>
                )}

                {/* Step 2: Input identifier */}
                {step === 'input' && method !== 'wallet' && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass rounded-3xl p-8 border border-white/10"
                    >
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                {method === 'phone' ? <Phone className="w-7 h-7 text-brand-gold" /> : <Mail className="w-7 h-7 text-brand-gold" />}
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
                            <p className="text-brand-slate text-sm">
                                Enter your {method} to receive a code
                            </p>
                        </div>

                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            {method === 'phone' ? (
                                <div className="flex gap-2">
                                    <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                        <input
                                            type="tel"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            placeholder="600 000 000"
                                            required
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none h-full"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                    <input
                                        type="email"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="name@example.com"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none"
                                    />
                                </div>
                            )}

                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('choose');
                                    setMethod(null);
                                    setError('');
                                }}
                                className="w-full text-brand-slate hover:text-white text-sm transition-colors py-2"
                            >
                                Back to options
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Step 2: Wallet Login */}
                {step === 'input' && method === 'wallet' && (
                    <motion.div
                        key="wallet"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass rounded-3xl p-8 border border-white/10"
                    >
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Wallet className="w-7 h-7 text-brand-gold" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Stellar Wallet</h1>
                            <p className="text-brand-slate text-sm">
                                Sign in securely using your Stellar account
                            </p>
                        </div>

                        <WalletLogin />

                        <button
                            type="button"
                            onClick={() => {
                                setStep('choose');
                                setMethod(null);
                                setError('');
                            }}
                            className="w-full text-brand-slate hover:text-white text-sm transition-colors py-2 mt-4"
                        >
                            Back to options
                        </button>
                    </motion.div>
                )}

                {/* Step 3: OTP Verification */}
                {step === 'verify' && (
                    <motion.div
                        key="verify"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass rounded-3xl p-8 border border-white/10"
                    >
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-7 h-7 text-brand-gold" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Enter Code</h1>
                            <p className="text-brand-slate text-sm">
                                We sent a 6-digit code to {method === 'email' ? identifier : `${countryCode} ${identifier}`}
                            </p>
                            <div className="mt-2 text-xs font-mono text-brand-gold">
                                {timer > 0 ? (
                                    <p>Code expires in {formatTime(timer)}</p>
                                ) : (
                                    <p className="text-red-400">Code expired</p>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="space-y-6">
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
                                className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/30 focus:border-brand-gold focus:outline-none"
                            />

                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                            <Button
                                type="submit"
                                disabled={isLoading || otp.length !== 6 || timer === 0}
                                className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 disabled:bg-brand-gold/40 disabled:text-brand-blue/80 disabled:opacity-100 text-brand-blue font-bold rounded-xl"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Sign In'}
                            </Button>

                            <div className="text-center space-y-2">
                                {canResend && (
                                    <button
                                        type="button"
                                        onClick={handleRequestOtp}
                                        disabled={isLoading}
                                        className="text-sm text-brand-gold hover:underline font-bold"
                                    >
                                        Didn't receive code? Resend
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setStep('input')}
                                    className="block w-full text-brand-slate hover:text-white text-sm transition-colors py-2"
                                >
                                    Change {method === 'email' ? 'email' : 'number'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


