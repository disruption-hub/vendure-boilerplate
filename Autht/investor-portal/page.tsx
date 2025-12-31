"use client";
// [DEPLOYMENT TEST] - Verifying GitHub to Vercel Auto-Deployment

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Phone, Mail, Wallet, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CountryCodeSelect from './components/CountryCodeSelect';
import { useWallet } from '@/lib/stellar-wallet-context';
import { useAutoCountryCode } from '@/hooks/useAutoCountryCode';
import { trackEvent } from '@/lib/analytics-tracker';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

type Step = 'register' | 'otp' | 'wallet' | 'success';

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');

    const [step, setStep] = useState<Step>('register');
    const { connectWallet, publicKey, isConnecting } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [connectedWallet, setConnectedWallet] = useState<string | null>(searchParams.get('wallet') || null);

    // Form state
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [name, setName] = useState('');
    const [countryCode, setCountryCode] = useAutoCountryCode(searchParams.get('country') || '+1');
    const [phoneNumber, setPhoneNumber] = useState(searchParams.get('phone') || '');
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);
    const [userId, setUserId] = useState('');
    const [accessToken, setAccessToken] = useState('');

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
        // Trigger registration again to resend OTP
        await handleRegister({ preventDefault: () => { } } as React.FormEvent);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, countryCode, phoneNumber }),
            });

            const data = await res.json();
            if (!res.ok) {
                trackEvent('otp_requested', 'auth', { method: 'registration', success: false, error: data.message });
                throw new Error(data.message || 'Registration failed');
            }

            trackEvent('otp_requested', 'auth', { method: 'registration', success: true });
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
            if (!res.ok) {
                trackEvent('registration_failed', 'auth', { error: data.message });
                throw new Error(data.message || 'Verification failed');
            }

            trackEvent('registration_success', 'auth');
            trackEvent('login_success', 'auth', { method: 'registration' });

            setAccessToken(data.access_token);
            if (data.user?.id) {
                setUserId(data.user.id);
                localStorage.setItem('investor_id', data.user.id);
            }
            if (data.user?.name) localStorage.setItem('investor_name', data.user.name);
            if (data.user?.roles) {
                localStorage.setItem('investor_roles', JSON.stringify(data.user.roles));
                // Store token for each role's portal to enable seamless switching
                const roles = data.user.roles as string[];
                if (roles.includes('PROJECT_OWNER')) {
                    localStorage.setItem('project_owner_token', data.access_token);
                }
                if (roles.includes('SYSTEM_ADMIN')) {
                    localStorage.setItem('admin_token', data.access_token);
                }
            }
            localStorage.setItem('investor_token', data.access_token);
            localStorage.setItem('investor_email', email);
            setStep('wallet'); // Go to wallet connect step
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWalletSync = async (walletPublicKey: string) => {
        setIsLoading(true);
        try {
            setConnectedWallet(walletPublicKey);
            localStorage.setItem('investor_wallet', walletPublicKey);

            // Link wallet to backend profile
            const token = localStorage.getItem('investor_token');
            if (token) {
                console.log('[Registration] Linking wallet to profile during registration...');
                const res = await fetch(`${API_URL}/auth/wallet`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ walletAddress: walletPublicKey })
                });

                if (!res.ok) {
                    const error = await res.json();
                    console.error('[Registration] Linking error:', error);
                    // We don't throw heroically here because they can still finish registration
                }
            }

            trackEvent('wallet_linked', 'wallet', { success: true, context: 'registration' });
            setStep('success');
        } catch (err: any) {
            console.error('[Registration] Sync error:', err);
            toast.error(err.message || 'Failed to sync wallet');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-sync wallet when connected on wallet step
    useEffect(() => {
        if (step === 'wallet' && publicKey && !isLoading && !connectedWallet) {
            console.log('[Registration] Auto-syncing connected wallet:', publicKey);
            handleWalletSync(publicKey);
        }
    }, [step, publicKey, isLoading, connectedWallet]);

    const handleConnectClick = async () => {
        try {
            const address = await connectWallet();
            if (address) {
                await handleWalletSync(address);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to connect wallet');
        }
    };

    const handleSkipWallet = () => {
        setStep('success');
    };

    return (
        <main className="min-h-screen py-24 flex items-center justify-center p-6 bg-brand-blue">
            <div className="max-w-md w-full">
                <div className="flex justify-center mb-8">
                    <div className="h-16 flex items-center justify-center">
                        <img src="/new-logo.png" alt="Infrabricks" className="h-full w-auto object-contain" />
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center gap-2 mb-8">
                    {['register', 'otp', 'wallet'].map((s, i) => (
                        <div
                            key={s}
                            className={`w-3 h-3 rounded-full transition-all ${step === s ? 'bg-brand-gold scale-125' :
                                ['register', 'otp', 'wallet'].indexOf(step) > i ? 'bg-brand-gold/50' : 'bg-white/10'
                                }`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* Registration Form */}
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
                                <h1 className="text-2xl font-bold text-white mb-2">Investor Registration</h1>
                                <p className="text-brand-slate text-sm">Create your account to access the portal</p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                            required
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-slate" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            required
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-brand-slate/50 focus:border-brand-gold focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Phone Number</label>
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
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>Continue <ArrowRight className="w-5 h-5 ml-2" /></>
                                    )}
                                </Button>
                            </form>

                            <p className="text-center text-brand-slate text-xs mt-6">
                                Already registered?{' '}
                                <Link href={`/investor-portal/login${redirectPath ? `?redirect=${redirectPath}` : ''}`} className="text-brand-gold hover:underline">
                                    Sign in
                                </Link>
                            </p>
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
                                <h1 className="text-2xl font-bold text-white mb-2">Verify Your Phone</h1>
                                <p className="text-brand-slate text-sm">
                                    Enter 6-digit code sent to your phone
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
                                        className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-700 focus:border-brand-gold focus:outline-none"
                                    />
                                    <div className="flex flex-col items-center mt-4 space-y-2">
                                        <p className="text-sm text-brand-slate">
                                            Code expires in <span className="text-white font-mono">{formatTime(timer)}</span>
                                        </p>
                                        {canResend && (
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                className="text-brand-gold hover:text-brand-gold/80 text-sm font-bold transition-colors"
                                            >
                                                Resend Code
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || otp.length !== 6}
                                    className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {/* Wallet Connect */}
                    {step === 'wallet' && (
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
                                <h1 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h1>
                                <p className="text-brand-slate text-sm">
                                    Link your Stellar wallet for seamless access
                                </p>
                            </div>

                            <div className="space-y-4">
                                {publicKey || connectedWallet ? (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                                            <p className="text-green-400 text-sm font-bold">Wallet Linked!</p>
                                            <p className="text-brand-slate text-xs mt-1 font-mono">
                                                {(publicKey || connectedWallet || '').slice(0, 8)}...{(publicKey || connectedWallet || '').slice(-8)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 py-4">
                                            <Loader2 className="w-6 h-6 animate-spin text-brand-gold" />
                                            <p className="text-brand-slate text-sm">Finishing registration...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-center text-brand-slate text-sm mb-4">
                                            A Stellar wallet is required to manage your assets securely.
                                        </p>
                                        <Button
                                            onClick={handleConnectClick}
                                            disabled={isConnecting || isLoading}
                                            className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold group relative overflow-hidden"
                                        >
                                            {isConnecting || isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="relative z-10 flex items-center gap-2">
                                                        Connect Stellar Wallet
                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                    </span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                                <button
                                    onClick={handleSkipWallet}
                                    className="w-full text-brand-slate hover:text-white text-sm transition-colors"
                                >
                                    Skip for now
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Success */}
                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-3xl p-8 border border-white/10 text-center"
                        >
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                                <Check className="text-green-400 w-8 h-8" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Registration Complete!</h1>
                            <p className="text-brand-slate text-sm mb-8">
                                Welcome aboard, {name}. Your investor account is ready.
                            </p>
                            <Button
                                onClick={() => router.push(redirectPath ? decodeURIComponent(redirectPath) : '/investor-portal/dashboard')}
                                className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold"
                            >
                                Go to Dashboard
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

export default function InvestorPortal() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-brand-blue flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}
