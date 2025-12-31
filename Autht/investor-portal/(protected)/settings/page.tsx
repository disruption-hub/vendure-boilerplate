"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Globe, Moon, Sun, Smartphone, Mail, Lock, Eye, EyeOff, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/lib/stellar-wallet-context';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

export default function SettingsPage() {
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        dividends: true,
        newProjects: true,
        marketing: false,
    });

    const [twoFactor, setTwoFactor] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const { publicKey, connectWallet } = useWallet();
    const [savedWalletAddress, setSavedWalletAddress] = useState<string | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingWallet, setIsSavingWallet] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('investor_token');
                const res = await fetch(`${API_URL}/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSavedWalletAddress(data.walletAddress);
                } else if (res.status === 401) {
                    // Handle unauthorized
                }
            } catch (error) {
                console.error('Failed to fetch profile', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    const handleLinkWallet = async () => {
        setIsSavingWallet(true);
        try {
            let addressToSave = publicKey;

            if (!addressToSave) {
                await connectWallet();
                await new Promise(resolve => setTimeout(resolve, 800));
                addressToSave = localStorage.getItem('stellar_public_key');
            }

            if (!addressToSave) {
                toast.error('No wallet connected');
                return;
            }

            const token = localStorage.getItem('investor_token');
            const res = await fetch(`${API_URL}/auth/wallet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ walletAddress: addressToSave })
            });

            if (!res.ok) throw new Error('Failed to save wallet');

            setSavedWalletAddress(addressToSave);
            toast.success('Wallet linked successfully');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSavingWallet(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
                <p className="text-slate-400 mt-2">Manage your account preferences</p>
            </div>

            {/* Notifications */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Notifications</h2>
                        <p className="text-slate-400 text-sm">Choose how you want to be notified</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {[
                        { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email', icon: Mail },
                        { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications', icon: Smartphone },
                        { key: 'dividends', label: 'Dividend Alerts', desc: 'Get notified when dividends are paid', icon: Bell },
                        { key: 'newProjects', label: 'New Projects', desc: 'Be the first to know about new opportunities', icon: Bell },
                        { key: 'marketing', label: 'Marketing', desc: 'Occasional updates and promotions', icon: Mail },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-white font-medium">{item.label}</p>
                                    <p className="text-slate-400 text-sm">{item.desc}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                                className={`w-12 h-6 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications] ? 'bg-brand-gold' : 'bg-slate-700'
                                    }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Security */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Security</h2>
                        <p className="text-slate-400 text-sm">Protect your account</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-white font-medium">Two-Factor Authentication</p>
                                <p className="text-slate-400 text-sm">Add an extra layer of security</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setTwoFactor(!twoFactor)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${twoFactor ? 'bg-green-500' : 'bg-slate-700'
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${twoFactor ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>

                    <div className="p-4 bg-slate-800/30 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-white font-medium">Change Password</p>
                                <p className="text-slate-400 text-sm">Update your password regularly</p>
                            </div>
                        </div>
                        <Button variant="outline" className="border-white/10 text-black hover:bg-white/5">
                            Change Password
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Preferences */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Preferences</h2>
                        <p className="text-slate-400 text-sm">Customize your experience</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            {darkMode ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-slate-400" />}
                            <div>
                                <p className="text-white font-medium">Dark Mode</p>
                                <p className="text-slate-400 text-sm">Toggle dark/light theme</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-purple-500' : 'bg-slate-700'
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Wallet Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Stellar Wallet</h2>
                        <p className="text-slate-400 text-sm">Linked wallet for investments and identity</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-white/5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-400">Linked Wallet Address</p>
                                {savedWalletAddress ? (
                                    <p className="text-lg font-mono text-white break-all">{savedWalletAddress}</p>
                                ) : (
                                    <p className="text-slate-500 italic">No wallet linked yet</p>
                                )}
                            </div>
                            <Button
                                onClick={handleLinkWallet}
                                disabled={isSavingWallet}
                                className="bg-orange-500 hover:bg-orange-600 text-white min-w-[160px]"
                            >
                                {isSavingWallet ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    savedWalletAddress ? 'Update Wallet' : 'Connect & Link'
                                )}
                            </Button>
                        </div>

                        {publicKey && publicKey !== savedWalletAddress && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <p className="text-xs text-brand-gold flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Currently active wallet detected: <span className="font-mono">{publicKey}</span>
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Click 'Update Wallet' to link this connection to your account.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold px-8">
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
