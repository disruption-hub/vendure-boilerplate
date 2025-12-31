"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Copy, ExternalLink, CheckCircle2, AlertCircle, Loader2, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useWallet } from '@/lib/stellar-wallet-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

interface UserProfile {
    name: string;
    email: string;
    walletAddress?: string;
}

export default function WalletPage() {
    const router = useRouter();
    const { connectWallet: connectStellarWallet, publicKey, isConnecting, linkWalletToProfile, unlinkWalletFromProfile, disconnectWallet } = useWallet();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUnlinking, setIsUnlinking] = useState(false);
    const [showUnlinkModal, setShowUnlinkModal] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('investor_token');
            if (!token) {
                router.push('/investor-portal/login');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    if (res.status === 401) {
                        localStorage.removeItem('investor_token');
                        router.push('/investor-portal/login');
                        return;
                    }
                    throw new Error('Failed to fetch profile');
                }
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load profile');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [router]);



    const connectWallet = async () => {
        setIsLoading(true);
        try {
            // Check for existing connection OR force select
            let address = publicKey || localStorage.getItem('stellar_public_key');

            if (!address) {
                address = await connectStellarWallet();
            }

            if (!address) {
                throw new Error('No address returned from wallet');
            }

            // Link wallet to backend profile using the direct address
            await linkWalletToProfile(address);

            // Update local profile state immediately
            setProfile(prev => prev ? { ...prev, walletAddress: address } : null);

            toast.success('Wallet connected and linked successfully!');
        } catch (err: any) {
            console.error('Wallet connection error:', err);
            toast.error(err.message || 'Failed to connect wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchWallet = async () => {
        setIsLoading(true);
        try {
            console.log('[WalletPage] Switching wallet: disconnecting current...');
            await disconnectWallet();
            // Small delay to ensure state clears
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('[WalletPage] Opening modal for new wallet selection...');
            const address = await connectStellarWallet();
            if (address) {
                await linkWalletToProfile(address);
                setProfile(prev => prev ? { ...prev, walletAddress: address } : null);
                toast.success('Wallet switched and linked successfully!');
            }
        } catch (err: any) {
            console.error('[WalletPage] Switch wallet error:', err);
            toast.error(err.message || 'Failed to switch wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const copyAddress = () => {
        if (profile?.walletAddress) {
            navigator.clipboard.writeText(profile.walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
                <p className="text-brand-slate">Connect and manage your Stellar wallet for tokenized asset transactions.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Wallet Status */}
                <div className="glass rounded-3xl p-8 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-2xl bg-brand-gold/10 border border-brand-gold/20">
                            <Wallet className="w-6 h-6 text-brand-gold" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Connection Status</h2>
                    </div>

                    {/* Main Connection Status */}
                    <div className="space-y-6">
                        {profile?.walletAddress ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-bold">Linked to Profile</span>
                                </div>
                                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                                    <label className="text-xs text-brand-slate uppercase tracking-wider block mb-2">Linked Stellar Address</label>
                                    <p className="font-mono text-sm text-white break-all mb-3">{profile.walletAddress}</p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            onClick={copyAddress}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2 w-full sm:w-auto justify-center"
                                        >
                                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Copied!' : 'Copy'}
                                        </Button>
                                        <Button
                                            onClick={() => window.open(`https://stellar.expert/explorer/public/account/${profile.walletAddress}`, '_blank')}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2 w-full sm:w-auto justify-center"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            View on Explorer
                                        </Button>
                                        <Button
                                            onClick={() => setShowUnlinkModal(true)}
                                            disabled={isUnlinking}
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-2 w-full sm:w-auto justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            {isUnlinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                            Unlink Wallet
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : !publicKey ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-brand-slate">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="font-bold">No Wallet Linked</span>
                                </div>
                                <p className="text-sm text-brand-slate">Your profile has no linked wallet. Connect one to enable direct login and transactions.</p>
                                <Button
                                    onClick={connectWallet}
                                    disabled={isConnecting || isLoading}
                                    className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold"
                                >
                                    {isConnecting || isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Wallet className="w-4 h-4 mr-2" />
                                            Link Stellar Wallet
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : null}

                        {/* Browser Session detection (Only if different from linked address) */}
                        {publicKey && publicKey !== profile?.walletAddress && (
                            <div className="p-6 rounded-2xl bg-brand-gold/5 border border-brand-gold/20 space-y-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-brand-gold mt-1" />
                                    <div>
                                        <p className="text-white font-bold mb-1">
                                            {profile?.walletAddress ? 'Unlinked Wallet Detected' : 'Stellar Wallet Connected'}
                                        </p>
                                        <p className="text-xs text-brand-slate leading-relaxed">
                                            {profile?.walletAddress
                                                ? 'A different wallet is connected in your browser. Would you like to swap the linked account?'
                                                : 'This wallet is connected in your browser. Link it to your profile to enable direct login.'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-brand-slate uppercase tracking-wider block mb-2">Connected Browser Address</label>
                                    <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-xs text-brand-gold break-all">
                                        {publicKey}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        onClick={async () => {
                                            try {
                                                await linkWalletToProfile(publicKey);
                                                setProfile(prev => prev ? { ...prev, walletAddress: publicKey } : null);
                                                toast.success('Wallet linked to profile successfully!');
                                            } catch (err: any) {
                                                toast.error(err.message || 'Failed to link wallet');
                                            }
                                        }}
                                        className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold text-xs h-10"
                                    >
                                        Link this Wallet
                                    </Button>
                                    <Button
                                        onClick={handleSwitchWallet}
                                        variant="outline"
                                        className="border-brand-gold/20 text-brand-gold hover:bg-brand-gold/10 text-xs h-10"
                                    >
                                        Use Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* About Freighter */}
                <div className="glass rounded-3xl p-8 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">About Freighter</h3>
                    <div className="space-y-4 text-brand-slate text-sm leading-relaxed">
                        <p>
                            Freighter is a secure, non-custodial wallet for the Stellar network. It allows you to:
                        </p>
                        <ul className="space-y-2 list-disc list-inside">
                            <li>Hold and manage Stellar (XLM) and custom assets (like TBTO tokens)</li>
                            <li>Sign transactions securely from your browser</li>
                            <li>Maintain full control of your private keys</li>
                        </ul>
                        <p className="pt-4 border-t border-white/5">
                            Don't have Freighter yet?{' '}
                            <a
                                href="https://www.freighter.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-gold hover:underline font-bold"
                            >
                                Download it here →
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-300 leading-relaxed">
                        <p className="font-bold mb-2">Security Reminder</p>
                        <p>
                            Never share your wallet's secret key or seed phrase with anyone. Infrabricks will never ask for your private keys.
                            Always verify the URL and domain before connecting your wallet.
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Unlink Modal */}
            {showUnlinkModal && (
                <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => !isUnlinking && setShowUnlinkModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-md glass rounded-3xl border border-white/10 p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => !isUnlinking && setShowUnlinkModal(false)}
                            className="absolute top-6 right-6 p-2 rounded-xl text-brand-slate hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                                <LogOut className="w-8 h-8 text-red-400" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white">Unlink Wallet?</h3>
                                <p className="text-brand-slate leading-relaxed">
                                    Are you sure you want to disconnect your Stellar wallet? You will need to link it again to enable direct login.
                                </p>
                            </div>

                            <div className="flex flex-col w-full gap-3 pt-2">
                                <Button
                                    onClick={async () => {
                                        setIsUnlinking(true);
                                        try {
                                            await unlinkWalletFromProfile();
                                            setProfile(prev => prev ? { ...prev, walletAddress: undefined } : null);
                                            toast.success('Wallet unlinked successfully!');
                                            setShowUnlinkModal(false);
                                        } catch (err: any) {
                                            toast.error(err.message || 'Failed to unlink wallet');
                                        } finally {
                                            setIsUnlinking(false);
                                        }
                                    }}
                                    disabled={isUnlinking}
                                    className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all active:scale-[0.98]"
                                >
                                    {isUnlinking ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Yes, Unlink Wallet'
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setShowUnlinkModal(false)}
                                    disabled={isUnlinking}
                                    variant="ghost"
                                    className="w-full h-12 text-brand-slate hover:text-white hover:bg-white/5 font-bold rounded-2xl"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
