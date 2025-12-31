"use client";

import { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Save, Loader2, Key, User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useWallet } from '@/lib/stellar-wallet-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

export default function AdminSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [brevoKey, setBrevoKey] = useState('');
    const [maskedKey, setMaskedKey] = useState<string | null>(null);
    const [bccEmail, setBccEmail] = useState('');
    const [senderName, setSenderName] = useState('');
    const [testEmail, setTestEmail] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState('');
    const { publicKey, connectWallet } = useWallet();
    const [savedWalletAddress, setSavedWalletAddress] = useState<string | null>(null);
    const [isLinkingWallet, setIsLinkingWallet] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const res = await fetch(`${API_URL}/admin/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.brevoKeyConfigured) {
                        setMaskedKey(data.brevoKeyMasked);
                    }
                    if (data.bccEmail) {
                        setBccEmail(data.bccEmail);
                    }
                    if (data.senderName) {
                        setSenderName(data.senderName);
                    }
                } else {
                    throw new Error('Failed to fetch platform settings');
                }

                // Fetch real profile for wallet
                const profileRes = await fetch(`${API_URL}/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setSavedWalletAddress(profileData.walletAddress);
                } else {
                    throw new Error('Failed to fetch profile info');
                }
            } catch (error: any) {
                console.error('Failed to fetch settings', error);
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const token = localStorage.getItem('admin_token');
            const payload: any = {};
            if (brevoKey) payload.brevoKey = brevoKey;
            if (bccEmail !== undefined) payload.bccEmail = bccEmail;
            if (senderName !== undefined) payload.senderName = senderName;

            const res = await fetch(`${API_URL}/admin/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update settings');
            }

            const data = await res.json();

            // Update UI
            if (brevoKey) {
                const newMasked = `${brevoKey.substring(0, 8)}...${brevoKey.slice(-4)}`;
                setMaskedKey(newMasked);
                setBrevoKey(''); // Clear input
            }
            toast.success('Settings updated successfully');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestEmail = async () => {
        setIsTesting(true);
        setTestResult('');

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/admin/settings/test-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: testEmail })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to send test email');
            }

            toast.success('Test email sent! Check your inbox.');
            setTestResult('Success! Check your inbox.');
        } catch (error: any) {
            toast.error(error.message);
            setTestResult(`Error: ${error.message}`);
        } finally {
            setIsTesting(false);
        }
    };

    const handleLinkWallet = async () => {
        setIsLinkingWallet(true);
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

            const token = localStorage.getItem('admin_token');
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
            setIsLinkingWallet(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Email Service Configuration */}
                {/* Email Service Configuration */}
                <div className="glass rounded-xl p-6 border border-white/5 space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Email Service (Brevo)</h2>
                            <p className="text-sm text-slate-400">Configure email delivery for magic links and notifications</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        {/* API Key */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    value={brevoKey}
                                    onChange={(e) => setBrevoKey(e.target.value)}
                                    placeholder={maskedKey ? "Enter new key to replace existing" : "Enter Brevo API Key"}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            {maskedKey && !brevoKey && (
                                <p className="text-xs text-green-400 mt-2 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" />
                                    Current configured key: <span className="font-mono bg-white/5 px-2 py-0.5 rounded">{maskedKey}</span>
                                </p>
                            )}
                        </div>

                        {/* BCC Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Blind Copy (BCC) Email</label>
                            <p className="text-xs text-slate-500 mb-2">Optional: Send a copy of contact and mass emails to this address for compliance.</p>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    value={bccEmail}
                                    onChange={(e) => setBccEmail(e.target.value)}
                                    placeholder="compliance@infrabricks.lat"
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        {/* Sender Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Sender Name</label>
                            <p className="text-xs text-slate-500 mb-2">The name that will appear as the sender of the emails (e.g. Infrabricks Team).</p>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    placeholder="Infrabricks Support"
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-500 min-w-[120px]"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
                            </Button>
                        </div>
                    </form>

                    {/* Test Configuration */}
                    <div className="border-t border-white/5 pt-6 mt-6">
                        <h4 className="text-sm font-bold text-white mb-4">Test Configuration</h4>
                        <div className="bg-slate-900/30 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs text-slate-400 mb-1.5">Send test email to:</label>
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="your-email@example.com"
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <Button
                                onClick={handleTestEmail}
                                disabled={isTesting || !testEmail}
                                variant="outline"
                                className="w-full sm:w-auto border-white/10 text-black hover:bg-white/5"
                            >
                                {isTesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                                Send Test
                            </Button>
                        </div>
                        {testResult && (
                            <p className={`text-xs mt-2 ${testResult.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                                {testResult}
                            </p>
                        )}
                    </div>
                </div>

                {/* Wallet Configuration */}
                <div className="glass rounded-xl p-6 border border-white/5 space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Stellar Wallet</h2>
                            <p className="text-sm text-slate-400">Manage the wallet linked to your administrator account</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
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
                                    disabled={isLinkingWallet}
                                    className="bg-red-600 hover:bg-red-700 min-w-[160px]"
                                >
                                    {isLinkingWallet ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        savedWalletAddress ? 'Update Wallet' : 'Connect & Link Wallet'
                                    )}
                                </Button>
                            </div>

                            {publicKey && publicKey !== savedWalletAddress && (
                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <p className="text-xs text-amber-400 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        Currently active wallet detected: <span className="font-mono">{publicKey}</span>
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        This is the wallet you are currently connected with. Click 'Update Wallet' to link it to your account.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
