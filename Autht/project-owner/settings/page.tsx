"use client";

import { useState, useEffect } from 'react';
import { Save, Bell, Shield, User, Globe, Wallet, Loader2 } from 'lucide-react';
import { useWallet } from '@/lib/stellar-wallet-context';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

export default function SettingsPage() {
    const { publicKey, connectWallet } = useWallet();
    const [savedWalletAddress, setSavedWalletAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('project_owner_token');
                const res = await fetch(`${API_URL}/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch profile settings');
                const data = await res.json();
                setSavedWalletAddress(data.walletAddress);
            } catch (error: any) {
                console.error('Failed to fetch profile', error);
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleLinkWallet = async () => {
        setIsSaving(true);
        try {
            let addressToSave = publicKey;

            if (!addressToSave) {
                await connectWallet();
                // Wait for state to catch up
                await new Promise(resolve => setTimeout(resolve, 800));
                addressToSave = localStorage.getItem('stellar_public_key');
            }

            if (!addressToSave) {
                toast.error('No wallet connected');
                return;
            }

            const token = localStorage.getItem('project_owner_token');
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
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                <p className="text-slate-400">Manage your profile and preferences</p>
            </div>

            <div className="grid gap-8">
                {/* Profile Section */}
                <section className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <User className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Profile Information</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Full Name</label>
                            <input
                                type="text"
                                defaultValue="Alberto Saco"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Email Address</label>
                            <input
                                type="email"
                                defaultValue="betosaco@gmail.com"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Phone Number</label>
                            <input
                                type="tel"
                                defaultValue="+51 981 281 297"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Company Name</label>
                            <input
                                type="text"
                                defaultValue="InfraDev Corp"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </section>

                {/* Notifications */}
                <section className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: 'New Investor Alerts', desc: 'Receive emails when new investors fund your projects' },
                            { title: 'Project Updates', desc: 'Get weekly summaries of your project performance' },
                            { title: 'Marketing News', desc: 'Receive tips and news about infrastructure tokenization' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5">
                                <div>
                                    <div className="font-medium text-white">{item.title}</div>
                                    <div className="text-sm text-slate-500">{item.desc}</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Security */}
                <section className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Security</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="font-medium text-white">Two-Factor Authentication</div>
                                <div className="text-sm text-slate-500">Secure your account with 2FA</div>
                            </div>
                            <button className="px-4 py-2 border border-purple-500/30 text-purple-400 rounded-xl hover:bg-purple-500/10 transition-colors text-sm font-medium">
                                Enable 2FA
                            </button>
                        </div>

                        <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="font-medium text-white">Change Password</div>
                                <div className="text-sm text-slate-500">Last changed 3 months ago</div>
                            </div>
                            <button className="px-4 py-2 border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 hover:text-white transition-colors text-sm font-medium">
                                Update Password
                            </button>
                        </div>
                    </div>
                </section>

                {/* Wallet Section */}
                <section className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Stellar Wallet</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-950/50 rounded-xl p-6 border border-white/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-400">Linked Wallet Address</p>
                                    {savedWalletAddress ? (
                                        <p className="text-lg font-mono text-white break-all">{savedWalletAddress}</p>
                                    ) : (
                                        <p className="text-slate-500 italic">No wallet linked yet</p>
                                    )}
                                </div>
                                <button
                                    onClick={handleLinkWallet}
                                    disabled={isSaving}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        savedWalletAddress ? 'Update Wallet' : 'Link Wallet'
                                    )}
                                </button>
                            </div>

                            {publicKey && publicKey !== savedWalletAddress && (
                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <p className="text-xs text-purple-400 flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Currently active wallet detected: <span className="font-mono">{publicKey}</span>
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Click 'Update Wallet' to link this connection to your Project Owner account.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
