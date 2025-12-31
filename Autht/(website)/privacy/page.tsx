import React from 'react';
import Section from '@/components/ui/Section';
import Container from '@/components/ui/Container';

export default function PrivacyPage() {
    return (
        <main className="pt-24 pb-16">
            <Section className="bg-slate-950 text-white">
                <Container>
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brand-gold to-white">
                            Privacy Policy
                        </h1>
                        <p className="text-sm text-slate-400 mb-12">
                            Last Updated: {new Date().toLocaleDateString()}
                        </p>

                        <div className="space-y-12 text-slate-300 leading-relaxed">
                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">1. Introduction</h2>
                                <p>
                                    Infrabricks ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our platform.
                                </p>
                            </div>

                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">2. Information We Collect</h2>
                                <p className="mb-4">
                                    We may collect the following types of information:
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Personal Identification Information:</strong> Name, email address, phone number, government ID (for KYC).</li>
                                    <li><strong>Financial Information:</strong> Wallet addresses, transaction history, investment preferences.</li>
                                    <li><strong>Technical Data:</strong> IP address, browser type, device information, cookies.</li>
                                </ul>
                            </div>

                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">3. How We Use Your Information</h2>
                                <p className="mb-4">
                                    We use your data to:
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Provide and manage our services.</li>
                                    <li>Comply with legal and regulatory obligations (KYC/AML).</li>
                                    <li>Communicate with you regarding updates, offers, and support.</li>
                                    <li>Improve our platform security and functionality.</li>
                                </ul>
                            </div>

                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">4. Data Sharing</h2>
                                <p>
                                    We do not sell your personal data. We may share information with:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-2">
                                    <li>Regulatory authorities as required by law.</li>
                                    <li>Service providers (e.g., identity verification, hosting) under strict confidentiality agreements.</li>
                                </ul>
                            </div>

                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">5. Data Security</h2>
                                <p>
                                    We implement robust security measures to protect your data, including encryption and secure servers. However, no method of transmission over the internet is 100% secure.
                                </p>
                            </div>

                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <h2 className="text-xl font-bold mb-4 text-white">6. Your Rights</h2>
                                <p>
                                    Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data. To exercise these rights, please contact us.
                                </p>
                            </div>
                        </div>
                    </div>
                </Container>
            </Section>
        </main>
    );
}
