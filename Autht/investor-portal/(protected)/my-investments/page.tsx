"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Activity, Loader2, ArrowUpRight, Calendar } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

interface Investment {
    id: string;
    tokenAmount: number;
    usdValue: number;
    tokenSymbol: string;
    purchaseDate: string;
    status: string;
}

interface InvestorProfile {
    id: string;
    email: string;
    name: string;
    isVerified: boolean;
    investments: Investment[];
}

export default function PortfolioPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<InvestorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
            </div>
        );
    }

    const totalTokens = profile?.investments?.reduce((sum, inv) => sum + inv.tokenAmount, 0) || 0;
    const totalValue = profile?.investments?.reduce((sum, inv) => sum + inv.usdValue, 0) || 0;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
                <p className="text-brand-slate">Track your tokenized infrastructure investments.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-3xl p-8 border border-white/10"
                >
                    <div className="p-3 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 inline-block mb-4">
                        <Wallet className="w-6 h-6 text-brand-gold" />
                    </div>
                    <p className="text-[10px] font-black text-brand-slate uppercase tracking-[0.2em] mb-1">Total Token Balance</p>
                    <h4 className="text-2xl font-bold text-white mb-1">{totalTokens.toLocaleString()} TBTO</h4>
                    <p className="text-[10px] font-bold text-brand-slate uppercase tracking-widest">≈ ${totalValue.toLocaleString()}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass rounded-3xl p-8 border border-white/10"
                >
                    <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 inline-block mb-4">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-[10px] font-black text-brand-slate uppercase tracking-[0.2em] mb-1">Total Earnings</p>
                    <h4 className="text-2xl font-bold text-white mb-1">$0.00</h4>
                    <p className="text-[10px] font-bold text-brand-slate uppercase tracking-widest">+0.0% vs last mo</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass rounded-3xl p-8 border border-white/10"
                >
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 inline-block mb-4">
                        <Activity className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-[10px] font-black text-brand-slate uppercase tracking-[0.2em] mb-1">Next Distribution</p>
                    <h4 className="text-2xl font-bold text-white mb-1">Jan 15, 2026</h4>
                    <p className="text-[10px] font-bold text-brand-slate uppercase tracking-widest">Estimated: $0.00</p>
                </motion.div>
            </div>

            {/* Investment Details */}
            <div className="glass rounded-3xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Your Investments</h2>
                {!profile?.investments || profile.investments.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-brand-slate mb-4">No investments yet</p>
                        <p className="text-sm text-brand-slate">Start investing in tokenized infrastructure projects.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {profile.investments.map((investment) => (
                            <div key={investment.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-gold/30 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">Turboducto AIJCH</h3>
                                        <p className="text-sm text-brand-slate">Jet-A1 Fuel Pipeline Infrastructure</p>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                        <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div>
                                        <p className="text-[10px] text-brand-slate uppercase tracking-widest mb-1">Tokens Held</p>
                                        <p className="text-lg font-bold text-white">{investment.tokenAmount.toLocaleString()} {investment.tokenSymbol}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-brand-slate uppercase tracking-widest mb-1">USD Value</p>
                                        <p className="text-lg font-bold text-white">${investment.usdValue.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-brand-slate uppercase tracking-widest mb-1">Yield APY</p>
                                        <p className="text-lg font-bold text-brand-gold">8.5%</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-brand-slate uppercase tracking-widest mb-1">Purchase Date</p>
                                        <p className="text-lg font-bold text-white">{new Date(investment.purchaseDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
