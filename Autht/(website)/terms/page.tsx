import React from 'react';
import Section from '@/components/ui/Section';
import Container from '@/components/ui/Container';

export default function TermsPage() {
    return (
        <main className="pt-24 pb-16">
            <Section className="bg-slate-950 text-white">
                <Container>
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brand-gold to-white">
                            Terms of Service
                        </h1>
                        <p className="text-sm text-slate-400 mb-12">
                            Last Updated: {new Date().toLocaleDateString()}
                        </p>

                        <div className="space-y-12 text-slate-300 leading-relaxed">
                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">1. Introduction</h2>
                                <p>
                                    Welcome to Infrabricks. By accessing or using our website, platform, and services, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                                </p>
                            </div>

                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">2. Services</h2>
                                <p>
                                    Infrabricks provides a platform for the tokenization of real-world assets (RWA), specifically focusing on critical infrastructure. Our services include the issuance, management, and tracking of security tokens backed by these assets.
                                </p>
                            </div>

                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">3. User Eligibility</h2>
                                <p className="mb-4">
                                    To use our services, you must:
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Be at least 18 years old.</li>
                                    <li>Complete our KYC/AML verification process if required.</li>
                                    <li>Not be a resident of a restricted jurisdiction.</li>
                                    <li>Qualify as an accredited investor where applicable by law.</li>
                                </ul>
                            </div>

                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">4. Risks</h2>
                                <p>
                                    Investment in digital assets and security tokens involves a high degree of risk. You acknowledge that past performance is not indicative of future results and that you are solely responsible for your investment decisions.
                                </p>
                            </div>

                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">5. Governing Law</h2>
                                <p>
                                    These Terms are governed by and construed in accordance with the laws of Bermuda. Any disputes shall be subject to the exclusive jurisdiction of the courts of Bermuda.
                                </p>
                            </div>

                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">6. Contact Us</h2>
                                <p>
                                    If you have any questions about these Terms, please contact us at support@infrabricks.com.
                                </p>
                            </div>
                        </div>
                    </div>
                </Container>
            </Section>
        </main>
    );
}
