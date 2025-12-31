"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Phone, Loader2, Building2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CountryCodeSelect from '../../investor-portal/components/CountryCodeSelect';
import { useWallet } from '@/lib/stellar-wallet-context';
import { useAutoCountryCode } from '@/hooks/useAutoCountryCode';
import { identifyV2 } from '@/lib/analytics-tracker-v2';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

type Step = 'method' | 'phone' | 'otp';

export default function ProjectOwnerLogin() {
    const router = useRouter();
    const { connectWallet, publicKey, isConnecting, disconnectWallet } = useWallet();
    const [step, setStep] = useState<Step>('method');
    const [isLoading, setIsLoading] = useState(false);

    const [countryCode, setCountryCode] = useAutoCountryCode('+1');
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
        await handlePhoneLogin({ preventDefault: () => { } } as React.FormEvent);
    };

    const [isWalletAttempt, setIsWalletAttempt] = useState(false);

    // Auto-login when wallet is connected and it's a wallet login attempt
    useEffect(() => {
        if (isWalletAttempt && publicKey && !isLoading) {
            handleBackendWalletLogin(publicKey);
        }
    }, [isWalletAttempt, publicKey, isLoading]);

    const handleBackendWalletLogin = async (connectedAddress: string) => {
        setIsLoading(true);
        setIsWalletAttempt(false); // Reset attempt early to prevent useEffect re-triggering
        try {
            console.log('[ProjectOwnerLogin] Attempting backend login for:', connectedAddress);
            // Call wallet-login API
            const res = await fetch(`${API_URL}/auth/wallet-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: connectedAddress }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Wallet login failed');

            // Check if user has PROJECT_OWNER role
            if (!data.user?.roles?.includes('PROJECT_OWNER')) {
                throw new Error('You do not have Project Owner privileges');
            }

            // Store token and roles in a standardized way
            const token = data.access_token;
            const roles = data.user.roles || [];

            localStorage.setItem('project_owner_token', token);
            localStorage.removeItem('investor_picture');
            localStorage.setItem('investor_token', token);
            localStorage.setItem('investor_roles', JSON.stringify(roles));
            localStorage.setItem('investor_name', data.user.name || '');
            localStorage.setItem('investor_email', data.user.email || '');
            localStorage.setItem('project_owner_name', data.user.name || '');

            if (roles.includes('SYSTEM_ADMIN')) {
                localStorage.setItem('admin_token', token);
            }

            if (data.user?.email) {
                identifyV2(data.user.email, data.user.name);
            }

            toast.success('Welcome, Project Owner!');
            router.push('/project-owner/dashboard');
        } catch (err: any) {
            console.error('[ProjectOwnerLogin] Backend error:', err);
            toast.error(err.message);
            setIsWalletAttempt(false); // Reset attempt on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleWalletLogin = async () => {
        setIsWalletAttempt(true);
        try {
            let connectedAddress = publicKey || localStorage.getItem('stellar_public_key');

            if (!connectedAddress) {
                console.log('[ProjectOwnerLogin] No wallet detected, opening modal...');
                const address = await connectWallet();
                if (address) {
                    console.log('[ProjectOwnerLogin] Wallet connected in modal, finalizing login for:', address);
                    await handleBackendWalletLogin(address);
                }
            } else {
                console.log('[ProjectOwnerLogin] Wallet already connected, triggering backend...');
                handleBackendWalletLogin(connectedAddress);
            }
        } catch (err: any) {
            console.error('[ProjectOwnerLogin] Connection error:', err);
            toast.error(err.message || 'Failed to connect wallet');
            setIsWalletAttempt(false);
        }
    };

    const handleSwitchWallet = async () => {
        setIsLoading(true);
        try {
            console.log('[ProjectOwnerLogin] Switching wallet: disconnecting current...');
            await disconnectWallet();
            // Small delay to ensure state clears
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('[ProjectOwnerLogin] Opening modal for new wallet selection...');
            const address = await connectWallet();
            if (address) {
                setIsWalletAttempt(true);
                await handleBackendWalletLogin(address);
            }
        } catch (err: any) {
            console.error('[ProjectOwnerLogin] Switch wallet error:', err);
            toast.error(err.message || 'Failed to switch wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/project-owner/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ countryCode, phoneNumber }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed');

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

            // Store token and roles in a standardized way
            const token = data.access_token;
            const roles = data.user?.roles || [];

            localStorage.setItem('project_owner_token', token);
            localStorage.removeItem('investor_picture');
            localStorage.setItem('investor_token', token);
            localStorage.setItem('investor_roles', JSON.stringify(roles));
            localStorage.setItem('investor_name', data.user?.name || '');
            localStorage.setItem('investor_email', data.user?.email || '');

            if (data.user?.name) localStorage.setItem('project_owner_name', data.user.name);

            if (roles.includes('SYSTEM_ADMIN')) {
                localStorage.setItem('admin_token', token);
            }

            if (data.user?.email) {
                identifyV2(data.user.email, data.user.name);
            }

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
                    {/* Method Selection */}
                    {step === 'method' && (
                        <motion.div
                            key="method"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-slate-900 rounded-3xl p-8 border border-white/10"
                        >
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-7 h-7 text-purple-500" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Project Owner Access</h1>
                                <p className="text-slate-400 text-sm">Manage your infrastructure projects</p>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    onClick={handleWalletLogin}
                                    disabled={isLoading}
                                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <Wallet className="w-5 h-5 mr-2" />
                                            Login with Stellar Wallet
                                        </>
                                    )}
                                </Button>
                                {(publicKey || (typeof window !== 'undefined' && localStorage.getItem('stellar_public_key'))) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSwitchWallet();
                                        }}
                                        disabled={isLoading}
                                        className="w-full text-center text-purple-400 text-xs mt-2 hover:underline disabled:opacity-50"
                                    >
                                        Use a different wallet
                                    </button>
                                )}

                                <div className="flex items-center gap-4 my-4">
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="text-slate-500 text-xs uppercase">or</span>
                                    <div className="flex-1 h-px bg-white/10" />
                                </div>

                                <Button
                                    onClick={() => setStep('phone')}
                                    className="w-full h-14 bg-white text-black hover:bg-gray-200 font-bold"
                                >
                                    <Phone className="w-5 h-5 mr-2" />
                                    Login with Phone
                                </Button>

                                <div className="text-center mt-4">
                                    <span className="text-slate-500 text-sm">New Partner? </span>
                                    <Link href="/project-owner/register" className="text-purple-400 hover:text-purple-300 text-sm font-semibold">
                                        Register Here
                                    </Link>
                                </div>
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
                            className="bg-slate-900 rounded-3xl p-8 border border-white/10"
                        >
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Phone className="w-7 h-7 text-purple-500" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Phone Verification</h1>
                                <p className="text-slate-400 text-sm">Enter your registered phone number</p>
                            </div>

                            <form onSubmit={handlePhoneLogin} className="space-y-4">
                                <div className="flex gap-2">
                                    <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="600 000 000"
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
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Access Code'}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('method');
                                        setIsWalletAttempt(false);
                                    }}
                                    className="w-full text-center text-slate-500 text-sm hover:text-white transition-colors"
                                >
                                    ← Back to login options
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
                            className="bg-slate-900 rounded-3xl p-8 border border-white/10"
                        >
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-7 h-7 text-purple-500" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Verify Identity</h1>
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
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
                                </Button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main >
    );
}
