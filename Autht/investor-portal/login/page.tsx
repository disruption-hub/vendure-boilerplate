"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Phone, Wallet, Mail, ArrowRight, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CountryCodeSelect from '../components/CountryCodeSelect';
import { useWallet } from '@/lib/stellar-wallet-context';
import { trackEvent } from '@/lib/analytics-tracker';
import { useAutoCountryCode } from '@/hooks/useAutoCountryCode';
import { identifyV2 } from '@/lib/analytics-tracker-v2';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

type LoginMethod = 'phone' | 'wallet' | 'email';
type Step = 'choose' | 'phone' | 'otp' | 'email' | 'email-sent' | 'register-prompt';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');
    const { connectWallet, isConnecting, publicKey, disconnectWallet } = useWallet();

    const [method, setMethod] = useState<LoginMethod | null>(null);
    const [step, setStep] = useState<Step | 'register-prompt'>('choose');
    const [isLoading, setIsLoading] = useState(false);

    const [countryCode, setCountryCode] = useAutoCountryCode('+1');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [timer, setTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);
    const [registrationData, setRegistrationData] = useState<{ type: 'email' | 'phone' | 'wallet', value: string, countryCode?: string } | null>(null);

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
        if (method === 'email') {
            await handleSendEmailOtp({ preventDefault: () => { } } as React.FormEvent);
        } else if (method === 'phone') {
            await handlePhoneLogin({ preventDefault: () => { } } as React.FormEvent);
        }
    };

    const handleSendEmailOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/email-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.status === 404) {
                setRegistrationData({ type: 'email', value: email });
                setStep('register-prompt');
                setIsLoading(false);
                return;
            }

            if (!res.ok) {
                trackEvent('otp_requested', 'auth', { method: 'email', success: false, error: data.message });
                throw new Error(data.message || 'Failed to send verification code');
            }

            trackEvent('otp_requested', 'auth', { method: 'email', success: true });
            setStep('otp');
            startTimer();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyEmailOtp = async (e?: React.FormEvent | React.ChangeEvent, otpValue?: string) => {
        if (e) e.preventDefault();
        const codeToVerify = otpValue || otp;

        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/email-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: codeToVerify }),
            });

            const data = await res.json();
            if (!res.ok) {
                trackEvent('login_failed', 'auth', { method: 'email', error: data.message });
                throw new Error(data.message || 'Verification failed');
            }

            trackEvent('login_success', 'auth', { method: 'email' });

            localStorage.removeItem('investor_picture');
            localStorage.setItem('investor_token', data.access_token);
            localStorage.setItem('investor_email', email);
            if (data.user?.name) localStorage.setItem('investor_name', data.user.name);
            if (data.user?.id) localStorage.setItem('investor_id', data.user.id);
            if (data.user?.roles) {
                localStorage.setItem('investor_roles', JSON.stringify(data.user.roles));
                const roles = data.user.roles as string[];
                if (roles.includes('PROJECT_OWNER')) {
                    localStorage.setItem('project_owner_token', data.access_token);
                }
                if (roles.includes('SYSTEM_ADMIN')) {
                    localStorage.setItem('admin_token', data.access_token);
                }
            }

            if (data.user?.email) {
                identifyV2(data.user.email, data.user.name);
            }

            const destination = redirectPath ? decodeURIComponent(redirectPath) : '/investor-portal/dashboard';
            router.push(destination);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/login-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ countryCode, phoneNumber }),
            });

            const data = await res.json();

            if (res.status === 404) {
                setRegistrationData({ type: 'phone', value: phoneNumber, countryCode });
                setStep('register-prompt');
                setIsLoading(false);
                return;
            }

            if (!res.ok) {
                trackEvent('otp_requested', 'auth', { method: 'phone', success: false, error: data.message });
                throw new Error(data.message || 'Login failed');
            }

            trackEvent('otp_requested', 'auth', { method: 'phone', success: true });
            setStep('otp');
            startTimer();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent | React.ChangeEvent, otpValue?: string) => {
        if (method === 'email') {
            return handleVerifyEmailOtp(e, otpValue);
        }
        if (e) e.preventDefault();
        const codeToVerify = otpValue || otp;

        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ countryCode, phoneNumber, otp: codeToVerify }),
            });

            const data = await res.json();
            if (!res.ok) {
                trackEvent('login_failed', 'auth', { method: 'phone', error: data.message });
                throw new Error(data.message || 'Verification failed');
            }

            trackEvent('login_success', 'auth', { method: 'phone' });

            localStorage.removeItem('investor_picture');
            localStorage.setItem('investor_token', data.access_token);
            localStorage.setItem('investor_phone', `${countryCode}${phoneNumber}`);
            if (data.user?.name) localStorage.setItem('investor_name', data.user.name);
            if (data.user?.id) localStorage.setItem('investor_id', data.user.id);
            if (data.user?.email) localStorage.setItem('investor_email', data.user.email);
            if (data.user?.roles) {
                localStorage.setItem('investor_roles', JSON.stringify(data.user.roles));
                const roles = data.user.roles as string[];
                if (roles.includes('PROJECT_OWNER')) {
                    localStorage.setItem('project_owner_token', data.access_token);
                }
                if (roles.includes('SYSTEM_ADMIN')) {
                    localStorage.setItem('admin_token', data.access_token);
                }
            }

            if (data.user?.email) {
                identifyV2(data.user.email, data.user.name);
            }

            const destination = redirectPath ? decodeURIComponent(redirectPath) : '/investor-portal/dashboard';
            router.push(destination);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackendWalletLogin = async (connectedAddress: string) => {
        setIsLoading(true);
        setMethod(null); // Reset method early to prevent useEffect re-triggering while loading
        try {
            console.log('[Login] Attempting backend login for:', connectedAddress);
            const res = await fetch(`${API_URL}/auth/wallet-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: connectedAddress })
            });

            const data = await res.json();

            if (res.status === 404) {
                setRegistrationData({ type: 'wallet', value: connectedAddress });
                setStep('register-prompt');
                setIsLoading(false);
                return;
            }

            if (!res.ok) {
                trackEvent('login_failed', 'auth', { method: 'wallet', error: data.message });
                throw new Error(data.message || 'Failed to login with wallet');
            }

            trackEvent('login_success', 'auth', { method: 'wallet' });

            const token = data.access_token;
            const roles = data.user?.roles || [];

            // Standardized storage
            localStorage.removeItem('investor_picture');
            localStorage.setItem('investor_token', token);
            localStorage.setItem('investor_roles', JSON.stringify(roles));
            localStorage.setItem('investor_name', data.user?.name || '');
            localStorage.setItem('investor_email', data.user?.email || '');
            localStorage.setItem('investor_id', data.user?.id || '');

            if (roles.includes('PROJECT_OWNER')) {
                localStorage.setItem('project_owner_token', token);
                localStorage.setItem('project_owner_name', data.user.name || '');
            }
            if (roles.includes('SYSTEM_ADMIN')) {
                localStorage.setItem('admin_token', token);
            }

            if (data.user?.email) {
                identifyV2(data.user.email, data.user.name);
            }

            toast.success('Login successful!');
            const destination = redirectPath ? decodeURIComponent(redirectPath) : '/investor-portal/dashboard';
            router.push(destination);
        } catch (err: any) {
            console.error('[Login] Wallet backend error:', err);
            toast.error(err.message || 'Failed to login with wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWalletLogin = async () => {
        setMethod('wallet');
        try {
            // If already connected, the useEffect will handle it
            // If not, we open the modal
            if (!publicKey && !localStorage.getItem('stellar_public_key')) {
                console.log('[Login] No wallet detected, opening modal...');
                const address = await connectWallet();
                if (address) {
                    console.log('[Login] Wallet connected via modal, auto-finalizing login for:', address);
                    await handleBackendWalletLogin(address);
                }
            } else {
                console.log('[Login] Wallet already detected, auto-triggering...');
                const address = publicKey || localStorage.getItem('stellar_public_key');
                if (address) handleBackendWalletLogin(address);
            }
        } catch (err: any) {
            console.error('[Login] Wallet connection error:', err);
            toast.error(err.message || 'Failed to connect wallet');
        }
    };

    const handleSwitchWallet = async () => {
        setIsLoading(true);
        try {
            console.log('[Login] Switching wallet: disconnecting current...');
            await disconnectWallet();
            // Small delay to ensure state clears
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('[Login] Opening modal for new wallet selection...');
            const address = await connectWallet();
            if (address) {
                setMethod('wallet');
                await handleBackendWalletLogin(address);
            }
        } catch (err: any) {
            console.error('[Login] Switch wallet error:', err);
            toast.error(err.message || 'Failed to switch wallet');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-login when wallet is connected and method is 'wallet'
    useEffect(() => {
        if (method === 'wallet' && publicKey && !isLoading && step !== 'register-prompt') {
            handleBackendWalletLogin(publicKey);
        }
    }, [method, publicKey, isLoading, step]);


    return (
        <main className="min-h-screen py-24 flex items-center justify-center p-6 bg-brand-blue">
            <div className="max-w-md w-full">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="h-16 flex items-center justify-center hover:opacity-80 transition-opacity">
                        <img src="/new-logo.png" alt="Infrabricks" className="h-full w-auto object-contain" />
                    </Link>
                </div>

                <AnimatePresence mode="wait">
                    {/* Choose Login Method */}
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
                                        setStep('phone');
                                        trackEvent('login_method_selected', 'auth', { method: 'phone' });
                                    }}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                                        <Phone className="w-6 h-6 text-brand-gold" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-white font-bold">Phone & OTP</p>
                                        <p className="text-brand-slate text-sm">Sign in with verification code</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-brand-slate group-hover:text-brand-gold transition-colors" />
                                </button>

                                <button
                                    onClick={() => {
                                        setMethod('email');
                                        setStep('email');
                                        trackEvent('login_method_selected', 'auth', { method: 'email' });
                                    }}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-brand-gold" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-white font-bold">Email</p>
                                        <p className="text-brand-slate text-sm">Sign in with verification code</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-brand-slate group-hover:text-brand-gold transition-colors" />
                                </button>

                                <button
                                    onClick={() => {
                                        trackEvent('login_method_selected', 'auth', { method: 'wallet' });
                                        handleWalletLogin();
                                    }}
                                    disabled={isConnecting}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                                        <Wallet className="w-6 h-6 text-brand-gold" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-white font-bold">Stellar Wallet</p>
                                        <p className="text-brand-slate text-sm">Select and connect wallet</p>
                                    </div>
                                    {isConnecting ? (
                                        <Loader2 className="w-5 h-5 text-brand-gold animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-5 h-5 text-brand-slate group-hover:text-brand-gold transition-colors" />
                                    )}
                                </button>
                                {(publicKey || (typeof window !== 'undefined' && localStorage.getItem('stellar_public_key'))) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSwitchWallet();
                                        }}
                                        disabled={isLoading || isConnecting}
                                        className="w-full text-center text-brand-gold text-xs mt-2 hover:underline disabled:opacity-50"
                                    >
                                        Use a different wallet
                                    </button>
                                )}
                            </div>

                            <p className="text-center text-brand-slate text-xs mt-6">
                                Don't have an account?{' '}
                                <Link
                                    href={`/investor-portal${redirectPath ? `?redirect=${redirectPath}` : ''}`}
                                    className="text-brand-gold hover:underline"
                                    onClick={() => trackEvent('registration_link_clicked', 'engagement')}
                                >
                                    Register now
                                </Link>
                            </p>
                        </motion.div>
                    )}

                    {/* Register Prompt */}
                    {step === 'register-prompt' && registrationData && (
                        <motion.div
                            key="register-prompt"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass rounded-3xl p-8 border border-white/10 text-center"
                        >
                            <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <User className="w-8 h-8 text-brand-gold" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Account Not Found</h2>
                            <div className="text-brand-slate mb-8 space-y-2 text-sm leading-relaxed px-4">
                                <p>We couldn't find an account for:</p>
                                <p className="text-white font-mono text-xs bg-white/5 p-3 rounded-xl border border-white/10 break-all select-all">
                                    {registrationData.value}
                                </p>
                                <p>Would you like to create one?</p>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    href={`/investor-portal?${registrationData.type === 'phone'
                                        ? `phone=${registrationData.value}&country=${encodeURIComponent(registrationData.countryCode || '')}`
                                        : registrationData.type === 'email'
                                            ? `email=${registrationData.value}`
                                            : registrationData.type === 'wallet'
                                                ? `wallet=${registrationData.value}`
                                                : ''
                                        }${redirectPath ? `&redirect=${redirectPath}` : ''}`}
                                    className="block w-full"
                                >
                                    <Button className="w-full h-12 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold">
                                        Create Account
                                    </Button>
                                </Link>
                                {registrationData.type === 'wallet' && (
                                    <button
                                        onClick={handleSwitchWallet}
                                        disabled={isLoading || isConnecting}
                                        className="w-full h-12 rounded-xl bg-white/5 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/10 transition-colors font-bold"
                                    >
                                        Use a different wallet
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setRegistrationData(null);
                                        setStep('choose');
                                        setMethod(null);
                                    }}
                                    className="w-full h-12 rounded-xl text-brand-slate hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    Try a different method
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Phone Login */}
                    {step === 'phone' && (
                        <motion.div
                            key="phone"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass rounded-3xl p-8 border border-white/10"
                        >
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Phone className="w-7 h-7 text-brand-gold" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
                                <p className="text-brand-slate text-sm">Enter your phone number to receive a code</p>
                            </div>

                            <form onSubmit={handlePhoneLogin} className="space-y-4">
                                <div className="flex gap-2">
                                    <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="600 000 000"
                                            required
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('choose');
                                        setMethod(null);
                                    }}
                                    className="w-full text-brand-slate hover:text-white text-sm transition-colors"
                                >
                                    Back to options
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* Email Login */}
                    {step === 'email' && (
                        <motion.div
                            key="email"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass rounded-3xl p-8 border border-white/10"
                        >
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-7 h-7 text-brand-gold" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Sign in with Email</h1>
                                <p className="text-brand-slate text-sm">Enter your email to receive a code</p>
                            </div>

                            <form onSubmit={handleSendEmailOtp} className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('choose');
                                        setMethod(null);
                                    }}
                                    className="w-full text-brand-slate hover:text-white text-sm transition-colors"
                                >
                                    Back to options
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* OTP Verification */}
                    {step === 'otp' && (
                        <motion.div
                            key="otp"
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
                                    We sent a 6-digit code to {method === 'email' ? email : `${countryCode} ${phoneNumber}`}
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

                                <Button
                                    type="submit"
                                    disabled={isLoading || otp.length !== 6 || timer === 0}
                                    className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                                </Button>

                                <div className="text-center">
                                    {canResend && (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={isLoading}
                                            className="text-sm text-brand-gold hover:underline font-bold"
                                        >
                                            Didn't receive code? Resend
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

export default function InvestorLogin() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-brand-blue flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
