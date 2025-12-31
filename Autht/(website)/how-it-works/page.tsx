'use client';

import Container from '@/components/ui/Container';
import Section from '@/components/ui/Section';
import { motion } from 'framer-motion';
import { Layers, RefreshCw, Wallet, ShieldCheck, Zap, Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import LifecycleAnimation from '@/components/layout/LifecycleAnimation';
import PayoutAnimation from '@/components/layout/PayoutAnimation';

export default function HowItWorksPage() {
    return (
        <main className="min-h-screen bg-brand-blue font-sans text-white pt-24">

            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />
                <Container>
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-brand-slate to-brand-gold bg-clip-text text-transparent"
                        >
                            How Tokenization Works
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-brand-slate leading-relaxed"
                        >
                            Democratizing access to institutional-grade infrastructure assets through blockchain technology. secure, transparent, and liquid.
                        </motion.p>
                    </div>
                </Container>
            </section>

            {/* Lifecycle Section */}
            <Section className="relative z-10">
                <Container>
                    <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-2 md:order-1"
                        >
                            <div className="relative aspect-square rounded-3xl overflow-hidden glass border border-white/10 p-0 flex items-center justify-center">
                                <LifecycleAnimation />
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-1 md:order-2 space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-bold uppercase tracking-widest">
                                <RefreshCw className="w-3 h-3" />
                                The Lifecycle
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold">From Real Asset to Digital Token</h2>
                            <div className="space-y-6">
                                <div className="glass p-6 rounded-2xl border border-white/10 backdrop-blur-md hover:border-brand-gold/20 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0 border border-brand-gold/20 text-brand-gold font-bold">1</div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">Real Asset</h3>
                                            <p className="text-brand-slate leading-relaxed">High-value infrastructure projects are vetted and selected for tokenization.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass p-6 rounded-2xl border border-white/10 backdrop-blur-md hover:border-brand-gold/20 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0 border border-brand-gold/20 text-brand-gold font-bold">2</div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">SPV Creation</h3>
                                            <p className="text-brand-slate leading-relaxed">A Special Purpose Vehicle (SPV) is created to legally hold the asset, ensuring bankruptcy-remote protection.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass p-6 rounded-2xl border border-white/10 backdrop-blur-md hover:border-brand-gold/20 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0 border border-brand-gold/20 text-brand-gold font-bold">3</div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">Tokenization</h3>
                                            <p className="text-brand-slate leading-relaxed">Ownership of the SPV is represented by digital tokens on the Stellar blockchain, ensuring transparency and immutability.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass p-6 rounded-2xl border border-white/10 backdrop-blur-md hover:border-brand-gold/20 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0 border border-brand-gold/20 text-brand-gold font-bold">4</div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">Issuance & Distribution</h3>
                                            <p className="text-brand-slate leading-relaxed">Tokens are issued to investors through our regulated portal. You become a legal fractional owner of the infrastructure.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Payouts Section */}
                    <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest">
                                <Wallet className="w-3 h-3" />
                                Revenue Flow
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold">Smart Payouts: Crypto to Fiat</h2>
                            <p className="text-brand-slate text-lg leading-relaxed">
                                Our platform automates the entire dividend distribution process, bridging the gap between traditional finance and DeFi.
                            </p>
                            <div className="grid gap-4">
                                <div className="glass p-6 rounded-2xl border border-white/5">
                                    <h4 className="font-bold text-white mb-2">1. Revenue Collection</h4>
                                    <p className="text-sm text-brand-slate">Infrastructure assets generate revenue in fiat (USD/EUR) or stablecoins.</p>
                                </div>
                                <div className="glass p-6 rounded-2xl border border-white/5">
                                    <h4 className="font-bold text-white mb-2">2. Automated Conversion</h4>
                                    <p className="text-sm text-brand-slate">Fiat revenue is converted to USDC (Stellar) and automatically distributed to token holders' wallets via smart contracts.</p>
                                </div>
                                <div className="glass p-6 rounded-2xl border border-white/5">
                                    <h4 className="font-bold text-white mb-2">3. Flexible Withdrawal</h4>
                                    <p className="text-sm text-brand-slate">Hold as USDC for yield, or off-ramp directly to your local bank account in your preferred currency instantly.</p>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="relative aspect-video rounded-3xl overflow-hidden glass border border-white/10 p-0 flex items-center justify-center">
                                <PayoutAnimation />
                            </div>
                        </motion.div>
                    </div>

                    {/* Liquidity Section */}
                    <div className="p-12 rounded-3xl bg-gradient-to-br from-brand-blue to-slate-900 border border-white/10 text-center mb-32 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />

                        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                <Globe className="w-3 h-3" />
                                Liquidity
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold">Exit Anytime with Secondary Markets</h2>
                            <p className="text-brand-slate text-lg leading-relaxed">
                                Unlike traditional infrastructure investments with 5-10 year lockups, Infrabricks tokens are liquid. You can sell your tokens on our secondary market or any Stellar DEX instantly.
                            </p>
                            <div className="flex flex-col md:flex-row gap-6 justify-center pt-8">
                                <Link href="/investor-portal/login">
                                    <button className="px-8 py-4 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold rounded-xl transition-all flex items-center gap-2 mx-auto">
                                        Start Investing
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Advantages Grid */}
                    <div className="mb-20">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Tokenized Infrastructure?</h2>
                            <p className="text-brand-slate">The benefits of blockchain meeting real-world assets.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="glass p-8 rounded-3xl border border-white/5 hover:border-brand-gold/20 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-6">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Secure & Regulated</h3>
                                <p className="text-brand-slate leading-relaxed">
                                    Assets are held in bankruptcy-remote SPVs. We operate under strict regulatory compliance, ensuring your ownership is legally protected.
                                </p>
                            </div>
                            <div className="glass p-8 rounded-3xl border border-white/5 hover:border-brand-gold/20 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-6">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Instant Settlement</h3>
                                <p className="text-brand-slate leading-relaxed">
                                    No more T+2 settlement days. Transactions on Stellar settle in 5 seconds, allowing for real-time portfolio management.
                                </p>
                            </div>
                            <div className="glass p-8 rounded-3xl border border-white/5 hover:border-brand-gold/20 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-6">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Fractional Ownership</h3>
                                <p className="text-brand-slate leading-relaxed">
                                    Access multi-million dollar infrastructure projects with as little as $500. Diversify your portfolio across multiple high-yield assets.
                                </p>
                            </div>
                        </div>
                    </div>

                </Container>
            </Section>
        </main>
    );
}
