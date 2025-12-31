"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    TrendingUp,
    Activity,
    ArrowUpRight,
    Loader2,
    PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInvestmentStore } from '@/store/useInvestmentStore';
import { trackEvent } from '@/lib/analytics-tracker';

export default function InvestorDashboard() {
    const router = useRouter();
    const { profile, isLoading, fetchProfile } = useInvestmentStore();

    useEffect(() => {
        const token = localStorage.getItem('investor_token');
        if (!token) {
            router.push('/investor-portal/login');
            return;
        }

        fetchProfile(token).catch((err) => {
            if (err.message === 'Unauthorized') {
                localStorage.removeItem('investor_token');
                router.push('/investor-portal/login');
            }
        });
    }, [router, fetchProfile]);

    const totalTokens = profile?.investments?.reduce((sum, inv) => sum + inv.tokenAmount, 0) || 0;
    const totalValue = profile?.investments?.reduce((sum, inv) => sum + inv.usdValue, 0) || 0;

    const stats = [
        { label: "Total Portfolio Value", value: `$${totalValue.toLocaleString()}`, sub: `${totalTokens.toLocaleString()} tokens`, icon: <Wallet className="text-brand-gold" />, color: "brand-gold" },
        { label: "Total Earnings", value: "$0.00", sub: "All-time dividends", icon: <TrendingUp className="text-green-400" />, color: "green" },
        { label: "Next Distribution", value: "Jan 15, 2026", sub: "Estimated: $0.00", icon: <Activity className="text-blue-400" />, color: "blue" }
    ];

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-2">Welcome back, {profile?.name || 'Investor'}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                {s.icon}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <h4 className="text-2xl font-bold text-white mb-1">{s.value}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-brand-gold/10 to-amber-500/5 border border-brand-gold/20 rounded-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-white mb-2">Explore Opportunities</h3>
                    <p className="text-slate-400 text-sm mb-4">Browse new investment projects in the marketplace</p>
                    <Link href="/investor-portal/marketplace">
                        <Button
                            onClick={() => trackEvent('dashboard_cta_clicked', 'engagement', { target: 'marketplace' })}
                            className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold"
                        >
                            Visit Marketplace
                            <ArrowUpRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-900/50 border border-white/5 rounded-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-white mb-2">View Your Investments</h3>
                    <p className="text-slate-400 text-sm mb-4">Track performance and details of your portfolio</p>
                    <Link href="/investor-portal/my-investments">
                        <Button
                            onClick={() => trackEvent('dashboard_cta_clicked', 'engagement', { target: 'my-investments' })}
                            variant="outline"
                            className="bg-white text-black border-transparent hover:bg-black hover:text-white hover:border-white/20 transition-colors"
                        >
                            My Investments
                            <PieChart className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Recent Investments */}
            {profile?.investments && profile.investments.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-900/50 border border-white/5 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">Your Investments</h2>
                        <Link href="/investor-portal/my-investments" className="text-brand-gold text-sm hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <Link href="/investor-portal/marketplace/turboducto">
                            <div className="p-4 rounded-xl bg-white/2 border border-white/5 hover:border-brand-gold/30 transition-colors cursor-pointer">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">TurboDucto AIJCH</h3>
                                        <p className="text-sm text-slate-400">Jet-A1 Fuel Pipeline</p>
                                    </div>
                                    <span className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-400">
                                        Active
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Tokens</p>
                                        <p className="text-white font-bold">{totalTokens.toLocaleString()} TBTO</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Value</p>
                                        <p className="text-white font-bold">${totalValue.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">APY</p>
                                        <p className="text-brand-gold font-bold">8.5%</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Next Payout</p>
                                        <p className="text-white font-bold">Jan 15</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* No Investments CTA */}
            {(!profile?.investments || profile.investments.length === 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 text-center"
                >
                    <PieChart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No investments yet</h3>
                    <p className="text-slate-400 mb-6">Start building your portfolio with tokenized infrastructure assets</p>
                    <Link href="/investor-portal/marketplace">
                        <Button className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold">
                            Browse Marketplace
                            <ArrowUpRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            )}
        </div>
    );
}
