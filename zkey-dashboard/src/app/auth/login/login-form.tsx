"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Wallet, Mail, ArrowRight, Loader2, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { requestOtpAction, loginWithPasswordAction, loginWithOtpAction, loginWithWalletAction, getInteractionDetails, registerAction, loginWithUserIdAction } from '../actions';
import CountryCodeSelect from '@/components/ui/country-code-select';
import { useAutoCountryCode } from '@/hooks/use-auto-country-code';
import { WalletLogin } from '@/components/auth/wallet-login';

type LoginMethod = 'phone' | 'email' | 'wallet' | 'password';
type Step = 'choose' | 'input' | 'verify' | 'register';

interface InteractionDetails {
    clientName: string;
    tenantName: string;
    logo?: string;
    scopes: string;
}

export function LoginForm({ interactionId }: { interactionId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [details, setDetails] = useState<InteractionDetails | null>(null);
    const [method, setMethod] = useState<LoginMethod | null>(null);
    const [step, setStep] = useState<Step>('choose');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [countryCode, setCountryCode] = useAutoCountryCode('+1');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);
    const [isNotFound, setIsNotFound] = useState(false);

    // Registration states
    const [regFirstName, setRegFirstName] = useState('');
    const [regLastName, setRegLastName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regCountryCode, setRegCountryCode] = useState('+1');

    useEffect(() => {
        // Fetch interaction details
        getInteractionDetails(interactionId)
            .then(setDetails)
            .catch(err => {
                toast.error('Invalid or expired login session');
                setError(err.message);
            });
    }, [interactionId]);

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
        setIsNotFound(false);
        setIsLoading(true);
        try {
            const fullIdentifier = method === 'phone' ? `${countryCode}${identifier}` : identifier;
            await requestOtpAction(fullIdentifier, method as 'phone' | 'email', interactionId);
            setStep('verify');
            startTimer();
        } catch (err: any) {
            if (err.message.includes('not found') || err.message.includes('404')) {
                setIsNotFound(true);
            } else {
                setError(err.message || 'Failed to send OTP.');
                toast.error(err.message || 'Failed to send OTP.');
            }
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
            const result = await loginWithOtpAction(interactionId, fullIdentifier, codeToVerify);

            // Redirect to client app
            window.location.href = result.redirectUri;
        } catch (err: any) {
            setError(err.message || 'Verification failed.');
            toast.error(err.message || 'Verification failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const result = await loginWithPasswordAction(interactionId, identifier, password);

            // Redirect to client app
            window.location.href = result.redirectUri;
        } catch (err: any) {
            setError(err.message || 'Login failed.');
            toast.error(err.message || 'Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const fullPhone = `${regCountryCode}${regPhone}`;
            const result = await registerAction(regEmail, regFirstName, regLastName, fullPhone);

            if (result.userId) {
                // Auto-login after registration
                const completeResult = await loginWithUserIdAction(interactionId, result.userId);
                window.location.href = completeResult.redirectUri;
            } else {
                toast.success('Registration successful! Please sign in.');
                setStep('choose');
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed.');
            toast.error(err.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWalletLogin = async (address: string, signature: string) => {
        setIsLoading(true);
        try {
            const result = await loginWithWalletAction(interactionId, address, signature);

            // Redirect to client app
            window.location.href = result.redirectUri;
        } catch (err: any) {
            setError(err.message || 'Wallet login failed.');
            toast.error(err.message || 'Wallet login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!details) {
        return (
            <div className="w-full max-w-md mx-auto glass rounded-3xl p-8 border border-white/10">
                <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
                </div>
            </div>
        );
    }

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
                            <h1 className="text-2xl font-bold text-white mb-2">Sign in to {details.clientName}</h1>
                            <p className="text-brand-slate text-sm">Powered by {details.tenantName}</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => {
                                    setMethod('password');
                                    setStep('input');
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-brand-gold" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-bold">Email & Password</p>
                                    <p className="text-brand-slate text-sm">Sign in with your credentials</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-brand-slate group-hover:text-brand-gold transition-colors shrink-0" />
                            </button>

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
                                    <p className="text-white font-bold">Email OTP</p>
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

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setStep('register')}
                                className="text-brand-slate hover:text-brand-gold text-sm transition-colors"
                            >
                                Don't have an account? <span className="font-bold">Sign up</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Input identifier (Password) */}
                {step === 'input' && method === 'password' && (
                    <motion.div
                        key="password"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass rounded-3xl p-8 border border-white/10"
                    >
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <User className="w-7 h-7 text-brand-gold" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
                            <p className="text-brand-slate text-sm">
                                Enter your email and password
                            </p>
                        </div>

                        <form onSubmit={handlePasswordLogin} className="space-y-4">
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

                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                    className="w-full pl-4 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none"
                                />
                            </div>

                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
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



                {/* Step 2: Register */}
                {step === 'register' && (
                    <motion.div
                        key="register"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass rounded-3xl p-8 border border-white/10"
                    >
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <User className="w-7 h-7 text-brand-gold" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
                            <p className="text-brand-slate text-sm">
                                Join {details.clientName} today
                            </p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                    <input
                                        type="text"
                                        value={regFirstName}
                                        onChange={(e) => setRegFirstName(e.target.value)}
                                        placeholder="First Name"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={regLastName}
                                        onChange={(e) => setRegLastName(e.target.value)}
                                        placeholder="Last Name"
                                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                <input
                                    type="email"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-2">
                                <CountryCodeSelect value={regCountryCode} onChange={setRegCountryCode} />
                                <div className="relative flex-1">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                    <input
                                        type="tel"
                                        value={regPhone}
                                        onChange={(e) => setRegPhone(e.target.value)}
                                        placeholder="600 000 000"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none h-full"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('choose');
                                    setError('');
                                }}
                                className="w-full text-brand-slate hover:text-white text-sm transition-colors py-2"
                            >
                                Already have an account? Sign in
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Step 2: Input identifier (OTP) */}
                {step === 'input' && (method === 'phone' || method === 'email') && (
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
                            <AnimatePresence mode="wait">
                                {isNotFound ? (
                                    <motion.div
                                        key="not-found"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-6 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 text-center space-y-4"
                                    >
                                        <div className="w-12 h-12 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto">
                                            <User className="w-6 h-6 text-brand-gold" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-brand-gold">New to {details.clientName}?</h3>
                                            <p className="text-sm text-brand-slate mt-1">
                                                We couldn't find an account for <span className="text-white font-medium">{identifier}</span>.
                                            </p>
                                        </div>
                                        <div className="pt-2">
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    setStep('register');
                                                    setIsNotFound(false);
                                                }}
                                                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl h-12"
                                            >
                                                Create Account Now
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() => setIsNotFound(false)}
                                                className="mt-3 text-xs text-brand-slate hover:text-white transition-colors"
                                            >
                                                Try a different {method === 'email' ? 'email' : 'number'}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="input-fields"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-4"
                                    >
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
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isNotFound && (
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
                            )}
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

                        <WalletLogin onWalletLogin={handleWalletLogin} />

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
                                className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl"
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
