"use client";

import React from 'react';
import Section from '@/components/ui/Section';
import Container from '@/components/ui/Container';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ScrollAnimation, { StaggerContainer, revealItem } from '@/components/ui/ScrollAnimation';
import { motion } from 'framer-motion';

export default function WhitepaperPage() {
    return (
        <main className="min-h-screen bg-brand-blue font-sans text-white pt-24">
            <Section className="relative z-10">
                <Container>
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <ScrollAnimation mode="fade-up" className="mb-16 border-b border-white/10 pb-8">
                            <span className="text-brand-gold font-bold tracking-[0.2em] text-[10px] uppercase">Technical Whitepaper</span>
                            <h1 className="text-4xl md:text-6xl font-black mt-4 mb-6 bg-gradient-to-r from-white via-brand-slate to-brand-gold bg-clip-text text-transparent leading-[1.1]">
                                TURBODUCTO AIJCH Project
                            </h1>
                            <p className="text-xl text-brand-slate leading-relaxed max-w-2xl">
                                Modernization of the Jet-A1 fuel supply system for the Jorge Chávez International Airport (AIJCH).
                            </p>
                        </ScrollAnimation>

                        {/* Content Modules */}
                        <div className="space-y-16">

                            {/* Context & Opportunity */}
                            <ScrollAnimation mode="fade-up" delay={0.2} className="prose prose-invert max-w-none">
                                <h2 className="text-3xl font-bold text-white mb-6">1. Context and Opportunity</h2>
                                <p className="text-brand-slate mb-4 leading-relaxed">
                                    Jorge Chávez International Airport is Peru's main air hub. Currently, fuel supply relies on tanker trucks, creating inefficiencies, security risks, and unnecessary CO2 emissions.
                                </p>
                                <ul className="list-disc pl-5 text-brand-slate space-y-2">
                                    <li><strong>Growing Demand:</strong> Projected consumption from 1MM to ~2MM gallons/day (2025-2051).</li>
                                    <li><strong>Modernization Mandate:</strong> Critical need to migrate to a dedicated pipeline system to ensure operational continuity.</li>
                                    <li><strong>Strategic Alliance:</strong> Structured by <strong>Thomas Consulting Group</strong> and operated by <strong>PANMIDCO</strong>, with key agreements with LAP, Petroperú, and Exolum.</li>
                                </ul>
                            </ScrollAnimation>

                            {/* The Solution */}
                            <ScrollAnimation mode="fade-up" delay={0.1}>
                                <div className="glass p-8 rounded-2xl border border-white/10">
                                    <h2 className="text-3xl font-bold text-white mb-6">2. Technical Solution</h2>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-brand-gold mb-3">Physical Infrastructure</h3>
                                            <p className="text-brand-slate text-sm leading-relaxed">
                                                Construction of a <strong>2 km</strong> dedicated pipeline connecting the TDP Terminal (Callao) with the new AIJCH Fuel Plant. Uses Horizontal Directional Drilling (HDD) technology to minimize environmental impact and avoid open trenches under the Rímac River.
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-3">Operational Impact</h3>
                                            <ul className="space-y-2 text-sm text-brand-slate leading-relaxed">
                                                <li>• Elimination of +30,000 tanker truck trips/year.</li>
                                                <li>• Reduction of 7,000 tons of CO2 annually.</li>
                                                <li>• Greater safety and reliability in supply (Jet-A1).</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </ScrollAnimation>

                            {/* THE DIGITAL TWIN SECTION - KEY REQUEST */}
                            <ScrollAnimation mode="pop" delay={0.2} width="100%">
                                <div className="relative overflow-hidden rounded-3xl border border-brand-gold/20 bg-gradient-to-br from-brand-blue to-slate-900">
                                    <div className="absolute top-0 right-0 p-32 bg-brand-gold/5 blur-[100px] rounded-full pointer-events-none"></div>
                                    <div className="p-10 relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-2 w-2 rounded-full bg-brand-gold animate-pulse"></div>
                                            <span className="text-brand-gold font-bold text-[10px] tracking-[0.2em] uppercase">Infrabricks Technology</span>
                                        </div>

                                        <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                                            3. The Digital Twin
                                        </h2>
                                        <p className="text-lg text-brand-slate mb-8 leading-relaxed">
                                            To ensure full transparency for investors and regulatory compliance, Turboducto AIJCH will implement a state-of-the-art <strong>Digital Twin</strong>. This hybrid Hardware and Software system acts as the source of truth for the financial ecosystem.
                                        </p>

                                        <StaggerContainer className="grid md:grid-cols-3 gap-6" stagger={0.1}>
                                            <motion.div variants={revealItem} className="glass p-6 rounded-xl border border-white/5 hover:border-brand-gold/20 transition-colors">
                                                <div className="text-4xl mb-4">📡</div>
                                                <h4 className="text-white font-bold mb-2">IoT Hardware</h4>
                                                <p className="text-sm text-brand-slate leading-relaxed">
                                                    Certified industrial-grade flow sensors installed directly on pipeline transfer valves. They measure exact volume ("fuel pass-through") in real-time.
                                                </p>
                                            </motion.div>
                                            <motion.div variants={revealItem} className="glass p-6 rounded-xl border border-white/5 hover:border-brand-gold/20 transition-colors">
                                                <div className="text-4xl mb-4">🔮</div>
                                                <h4 className="text-white font-bold mb-2">Decentralized Oracle</h4>
                                                <p className="text-sm text-brand-slate leading-relaxed">
                                                    Sensor data is securely transmitted to an Oracle. This acts as a bridge, cryptographically validating physical world data before sending it to the blockchain.
                                                </p>
                                            </motion.div>
                                            <motion.div variants={revealItem} className="glass p-6 rounded-xl border border-white/5 hover:border-brand-gold/20 transition-colors">
                                                <div className="text-4xl mb-4">⛓️</div>
                                                <h4 className="text-white font-bold mb-2">Blockchain Reporting</h4>
                                                <p className="text-sm text-brand-slate leading-relaxed">
                                                    Transported volume is immutably recorded on-chain. This automatically triggers Dividend Distribution Smart Contracts based on actual reported flow.
                                                </p>
                                            </motion.div>
                                        </StaggerContainer>
                                    </div>
                                </div>
                            </ScrollAnimation>

                            {/* Financials Summary */}
                            <ScrollAnimation mode="fade-up" delay={0.2}>
                                <div className="border-t border-white/10 pt-10">
                                    <h2 className="text-2xl font-black text-white mb-6">Investment Summary</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                        <div className="p-4 glass rounded-2xl border border-white/5">
                                            <div className="text-3xl font-black text-white mb-1">$8.5M</div>
                                            <div className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">Total Investment</div>
                                        </div>
                                        <div className="p-4 glass rounded-2xl border border-white/5">
                                            <div className="text-3xl font-black text-white mb-1">30 Years</div>
                                            <div className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">BOOT Contract</div>
                                        </div>
                                        <div className="p-4 glass rounded-2xl border border-white/5">
                                            <div className="text-3xl font-black text-white mb-1">49%</div>
                                            <div className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">Equity Offered</div>
                                        </div>
                                        <div className="p-4 glass rounded-2xl border border-white/5">
                                            <div className="text-3xl font-black text-white mb-1">12.16x</div>
                                            <div className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">EBITDA Multiple</div>
                                        </div>

                                        {/* CTA */}
                                        <div className="col-span-2 md:col-span-4 pt-10">
                                            <Link href="/investor-portal/login" className="block w-full">
                                                <button className="w-full py-6 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue text-lg font-black rounded-full transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(197,160,89,0.3)] hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(197,160,89,0.5)]">
                                                    Start Investing Now
                                                    <ArrowRight className="w-6 h-6" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </ScrollAnimation>
                        </div>
                    </div>
                </Container>
            </Section>
        </main>
    );
}
