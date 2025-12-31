"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    TrendingUp,
    Activity,
    Droplets,
    ArrowLeft,
    Bell,
    Database,
    History,
    Loader2,
    Box,
    Plane,
    DollarSign,
    FileText,
    ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OpportunityDetails from '@/components/layout/OpportunityDetails';
import ProjectRender from '@/components/layout/ProjectRender';
import AirportPeru from '@/components/layout/AirportPeru';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

type Tab = 'overview' | 'project' | 'airport' | 'assets' | 'transactions' | 'announcements' | 'documents';

export default function TurboductoProjectPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [hasInvested, setHasInvested] = useState(false);
    const [investmentData, setInvestmentData] = useState({ tokens: 0, value: 0 });

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('investor_token');
            if (!token) {
                router.push('/investor-portal/login');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const hasInvestments = data.investments && data.investments.length > 0;
                    setHasInvested(hasInvestments);
                    if (hasInvestments) {
                        const totalTokens = data.investments.reduce((sum: number, inv: any) => sum + inv.tokenAmount, 0);
                        const totalValue = data.investments.reduce((sum: number, inv: any) => sum + inv.usdValue, 0);
                        setInvestmentData({ tokens: totalTokens, value: totalValue });
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [router]);

    const tabs = [
        { id: 'overview', label: 'FINANCIALS', icon: DollarSign },
        { id: 'project', label: 'PROJECT', icon: Box },
        { id: 'airport', label: 'AIRPORT', icon: Plane },
        { id: 'assets', label: 'ASSET', icon: Database },
        { id: 'documents', label: 'DOCUMENTS', icon: FileText },
        { id: 'transactions', label: 'TRANSACTIONS', icon: History },
        { id: 'announcements', label: 'ANNOUNCEMENTS', icon: Bell },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-blue flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link href="/investor-portal/marketplace" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Marketplace</span>
            </Link>

            {/* Project Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">TurboDucto AIJCH</h1>
                        <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-400 uppercase">
                            {hasInvested ? 'Invested' : 'Open'}
                        </span>
                    </div>
                    <p className="text-slate-400">Jet-A1 Fuel Pipeline Infrastructure • Peru</p>
                </div>
                {hasInvested && (
                    <div className="flex items-center gap-4 p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-xl">
                        <div>
                            <p className="text-[10px] text-brand-slate uppercase tracking-widest">Your Position</p>
                            <p className="text-xl font-bold text-brand-gold">{investmentData.tokens.toLocaleString()} TBTO</p>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div>
                            <p className="text-[10px] text-brand-slate uppercase tracking-widest">Value</p>
                            <p className="text-xl font-bold text-white">${investmentData.value.toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs Navigation (Desktop) */}
            <header className="hidden md:block bg-brand-blue/50 backdrop-blur-xl z-50">
                <div className="h-14 flex items-center">
                    <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`
                                        relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all
                                        ${isActive ? 'text-brand-blue' : 'text-brand-slate hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-brand-gold rounded-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Tabs Navigation (Mobile) */}
            <div className="md:hidden bg-brand-blue py-2">
                <nav className="grid grid-cols-3 gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`
                                     flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                     ${isActive
                                        ? 'bg-brand-gold text-brand-blue shadow-lg shadow-brand-gold/20'
                                        : 'bg-white/5 text-brand-slate hover:bg-white/10 hover:text-white'}
                                 `}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-center leading-tight">{tab.label.split(' ')[0]}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {/* Overview Tab - Investment Details */}
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <OpportunityDetails />
                    </motion.div>
                )}

                {/* Project View Tab */}
                {activeTab === 'project' && (
                    <motion.div
                        key="project"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ProjectRender />
                    </motion.div>
                )}

                {/* Airport & Peru Tab */}
                {activeTab === 'airport' && (
                    <motion.div
                        key="airport"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <AirportPeru />
                    </motion.div>
                )}

                {/* Asset Data Tab */}
                {activeTab === 'assets' && (
                    <motion.div
                        key="assets"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        <h2 className="text-2xl font-bold text-white">Asset Performance</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h4 className="font-bold text-xl mb-1 text-white">Real-Time Flow Analytics</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Jet-A1 Fuel Flow • AIJCH Hub</p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Live Oracle</span>
                                    </div>
                                </div>

                                <div className="aspect-[2/1] bg-white/2 rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                        <path d="M0,100 Q100,20 200,80 T400,40 T600,90 T800,20 L800,100 L0,100 Z" fill="rgba(197,160,89,0.1)" />
                                        <path d="M0,100 Q100,20 200,80 T400,40 T600,90 T800,20" fill="none" stroke="#C5A059" strokeWidth="2" />
                                    </svg>
                                    <div className="flex flex-col items-center gap-2 z-10">
                                        <Droplets className="text-brand-gold w-8 h-8" />
                                        <p className="text-4xl font-black text-white">1.2k <span className="text-sm font-medium text-slate-400">bbl/hr</span></p>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap justify-between gap-4">
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Today</p>
                                        <p className="text-lg font-bold text-white">28.4k bbl</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Yield / bbl</p>
                                        <p className="text-lg font-bold text-brand-gold">$0.60</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Daily Revenue</p>
                                        <p className="text-lg font-bold text-white">$17,040</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                    <motion.div
                        key="documents"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-white">Project Documents</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: 'Investment Prospectus', type: 'PDF', size: '2.4 MB' },
                                { name: 'Token Purchase Agreement', type: 'PDF', size: '1.2 MB' },
                                { name: 'Environmental Impact Report', type: 'PDF', size: '5.8 MB' },
                                { name: 'Technical Specifications', type: 'PDF', size: '3.1 MB' },
                                { name: 'Financial Projections', type: 'XLSX', size: '890 KB' },
                                { name: 'Legal Structure Overview', type: 'PDF', size: '1.5 MB' },
                            ].map((doc, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-xl hover:border-brand-gold/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-brand-gold/10 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-brand-gold" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{doc.name}</p>
                                            <p className="text-slate-400 text-sm">{doc.type} • {doc.size}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                    <motion.div
                        key="transactions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-white">Transaction History</h2>
                        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                            <div className="space-y-4">
                                {[
                                    { date: "Dec 15, 2025", amount: "+ $1,050.00", type: "Dividend", hash: "GBR2...4P3Z" },
                                    { date: "Nov 15, 2025", amount: "+ $982.50", type: "Dividend", hash: "GD7S...K9Q2" },
                                    { date: "Oct 15, 2025", amount: "+ $1,120.00", type: "Dividend", hash: "GAKL...7N5X" },
                                    { date: "Oct 02, 2025", amount: "- $50,000.00", type: "Purchase", hash: "GCEW...1M0Y" }
                                ].map((tx, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 rounded-xl bg-white/2 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${tx.type === 'Purchase' ? 'bg-white/5' : 'bg-green-500/10'}`}>
                                                <TrendingUp className={`w-4 h-4 ${tx.type === 'Purchase' ? 'text-slate-400' : 'text-green-400'}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{tx.type}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tx.date} • {tx.hash}</p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-bold ${tx.type === 'Purchase' ? 'text-white' : 'text-green-400'}`}>
                                            {tx.amount}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Announcements Tab */}
                {activeTab === 'announcements' && (
                    <motion.div
                        key="announcements"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Project Announcements</h2>
                            <span className="px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-bold uppercase border border-brand-gold/20">
                                3 New
                            </span>
                        </div>
                        <div className="space-y-4">
                            {[
                                { date: "Dec 24, 2025", title: "Holiday Season Update", type: "general", content: "Construction continues on schedule with Sector A 78% complete." },
                                { date: "Dec 15, 2025", title: "Q4 Dividend Distribution Completed", type: "dividend", content: "Total distributed: $1,050.00 per 10,000 TBTO tokens." },
                                { date: "Dec 10, 2025", title: "Milestone: Phase 1 Pipeline Installation Complete", type: "milestone", content: "120km of pipeline installed - 37.5% of total length." },
                            ].map((a, i) => (
                                <div key={i} className="bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:border-brand-gold/20 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${a.type === 'dividend' ? 'bg-green-500/10' : a.type === 'milestone' ? 'bg-blue-500/10' : 'bg-brand-gold/10'}`}>
                                                <Bell className={`w-4 h-4 ${a.type === 'dividend' ? 'text-green-400' : a.type === 'milestone' ? 'text-blue-400' : 'text-brand-gold'}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{a.title}</h3>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{a.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-sm">{a.content}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
