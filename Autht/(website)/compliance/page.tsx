"use client";

import React from 'react';
import Section from '@/components/ui/Section';
import Container from '@/components/ui/Container';
import Link from 'next/link';
import { Landmark, ShieldCheck, Scale, FileCheck, ArrowRight, CheckCircle } from 'lucide-react';
import ScrollAnimation, { StaggerContainer, revealItem } from '@/components/ui/ScrollAnimation';
import { motion } from 'framer-motion';

export default function RegulatoryPage() {
    return (
        <main className="min-h-screen bg-brand-blue font-sans text-white pt-24">
            <Section className="relative z-10">
                <Container>
                    <ScrollAnimation mode="fade-up" className="max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-brand-slate to-brand-gold bg-clip-text text-transparent">
                            Bermuda Regulatory Framework
                        </h1>
                        <p className="text-xl text-brand-slate mb-12">
                            Infrabricks operates under the highest standards of regulatory compliance, aligned with Bermuda's digital asset framework.
                        </p>
                    </ScrollAnimation>

                    <StaggerContainer className="grid md:grid-cols-2 gap-8 mb-16" stagger={0.2}>
                        <motion.div variants={revealItem} className="glass p-8 rounded-2xl border border-white/10 backdrop-blur-md hover:border-brand-gold/30 transition-colors">
                            <h3 className="text-2xl font-semibold mb-4 text-brand-gold">Bermuda Jurisdiction</h3>
                            <p className="text-brand-slate leading-relaxed">
                                Bermuda is a global leader in digital asset regulation. Through the <strong>Bermuda Monetary Authority (BMA)</strong>, it offers one of the world's most robust and clear legal frameworks: the <em>Digital Asset Business Act 2018 (DABA)</em>. This framework ensures legal clarity, investor protection, and prevention of financial crimes.
                            </p>
                        </motion.div>
                        <motion.div variants={revealItem} className="glass p-8 rounded-2xl border border-white/10 backdrop-blur-md hover:border-brand-gold/30 transition-colors">
                            <h3 className="text-2xl font-semibold mb-4 text-brand-gold">Infrabricks Compliance</h3>
                            <p className="text-brand-slate leading-relaxed">
                                Infrabricks is designed to rigorously comply with BMA requirements, ensuring that all Real World Asset (RWA) backed token issuances operate within a supervised and secure environment.
                            </p>
                        </motion.div>
                    </StaggerContainer>

                    <div className="space-y-12">
                        <ScrollAnimation mode="slide-right" className="glass p-8 rounded-2xl border border-white/10 hover:border-brand-gold/20 transition-colors">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center text-sm border border-brand-gold/20">1</span>
                                Investor Protection
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <p className="text-brand-slate leading-relaxed">
                                    Bermuda regulations require strict segregation of client assets from company operating funds. At Infrabricks, project capital flows (such as those from Turboducto) are legally isolated and managed through audited Smart Contracts.
                                </p>
                                <ul className="space-y-3 text-brand-slate">
                                    <li className="flex items-start gap-2">
                                        <span className="text-brand-gold mt-1">✓</span>
                                        Secure custody of digital assets.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-brand-gold mt-1">✓</span>
                                        Transparent risk disclosure.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-brand-gold mt-1">✓</span>
                                        Regular financial and technology audits.
                                    </li>
                                </ul>
                            </div>
                        </ScrollAnimation>

                        <ScrollAnimation mode="slide-left" delay={0.2} className="glass p-8 rounded-2xl border border-white/10 hover:border-brand-gold/20 transition-colors">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center text-sm border border-brand-gold/20">2</span>
                                KYC/AML and Global Compliance
                            </h2>
                            <p className="text-brand-slate mb-6 leading-relaxed">
                                Infrabricks implements institutional-grade <strong>Know Your Customer (KYC)</strong> and <strong>Anti-Money Laundering (AML)</strong> processes. Only verified investors can interact with security tokens, ensuring a clean ecosystem compliant with international laws.
                            </p>
                            <div className="p-4 bg-brand-blue/50 rounded-xl border border-white/5">
                                <p className="text-sm text-brand-slate italic">
                                    "Commitment to regulation is not a barrier, but the foundation of trust needed to tokenize critical infrastructure."
                                </p>
                            </div>
                        </ScrollAnimation>

                        <ScrollAnimation mode="fade-up" delay={0.3} className="glass p-8 rounded-2xl border border-white/10 hover:border-brand-gold/20 transition-colors">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center text-sm border border-brand-gold/20">3</span>
                                Digital Asset Business Supervision
                            </h2>
                            <p className="text-brand-slate leading-relaxed">
                                As a Digital Asset Business (subject to licensing), Infrabricks maintains cybersecurity standards, governance, and internal controls that are periodically audited by the BMA, ensuring the operational resilience of the platform.
                            </p>
                        </ScrollAnimation>
                    </div>
                </Container>
            </Section>
        </main >
    );
}
