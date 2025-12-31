"use client";

import { FileText, Download, CheckCircle, Search, User, Briefcase, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const kycDocuments = [
    { title: "Identity Verification", type: "PDF", size: "1.2 MB", date: "Dec 20, 2024", status: "verified" },
    { title: "Proof of Address", type: "PDF", size: "0.8 MB", date: "Dec 20, 2024", status: "verified" },
    { title: "Accredited Investor Declaration", type: "PDF", size: "0.5 MB", date: "Dec 21, 2024", status: "verified" },
    { title: "Tax Form W-8BEN", type: "PDF", size: "0.3 MB", date: "Dec 21, 2024", status: "pending" },
];

const projectDocuments = [
    {
        project: "TurboDucto AIJCH",
        docs: [
            { title: "Technical Whitepaper", type: "PDF", size: "2.4 MB", date: "Dec 12, 2024" },
            { title: "Business Case AIJCH", type: "PDF", size: "4.1 MB", date: "Dec 10, 2024" },
            { title: "Stellar Smart Contract Audit", type: "PDF", size: "1.2 MB", date: "Dec 15, 2024" },
            { title: "Bermuda License (Class T)", type: "PDF", size: "0.8 MB", date: "Nov 01, 2024" },
            { title: "Subscription Agreement", type: "PDF", size: "1.5 MB", date: "Dec 20, 2024" },
            { title: "Asset Valuation Report", type: "PDF", size: "3.2 MB", date: "Dec 18, 2024" },
        ]
    },
];

export default function DocumentsPage() {
    const [search, setSearch] = useState("");
    const [expandedSections, setExpandedSections] = useState<string[]>(['kyc', 'turboducto']);

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const filterDocs = (docs: any[]) => {
        if (!search) return docs;
        return docs.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase()));
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Documents</h1>
                <p className="text-slate-400 mt-2">Access your KYC documents and project files</p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search documents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-brand-gold/50"
                />
            </div>

            {/* KYC Documents Section */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <button
                    onClick={() => toggleSection('kyc')}
                    className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-lg font-bold text-white">KYC Documents</h2>
                            <p className="text-slate-400 text-sm">Identity verification and compliance</p>
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedSections.includes('kyc') ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {expandedSections.includes('kyc') && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/5"
                        >
                            <div className="p-6 space-y-3">
                                {filterDocs(kycDocuments).map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/5 rounded-lg">
                                                <FileText className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-white">{doc.title}</h3>
                                                <p className="text-slate-400 text-sm">{doc.type} • {doc.size} • {doc.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${doc.status === 'verified'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {doc.status}
                                            </span>
                                            <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Project Documents Sections */}
            {projectDocuments.map((project, index) => (
                <div key={index} className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => toggleSection(project.project.toLowerCase().replace(/\s/g, '-'))}
                        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-brand-gold" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-lg font-bold text-white">{project.project}</h2>
                                <p className="text-slate-400 text-sm">{project.docs.length} documents</p>
                            </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedSections.includes(project.project.toLowerCase().replace(/\s/g, '-')) ? 'rotate-180' : ''
                            }`} />
                    </button>

                    <AnimatePresence>
                        {expandedSections.includes(project.project.toLowerCase().replace(/\s/g, '-')) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-white/5"
                            >
                                <div className="p-6 space-y-3">
                                    {filterDocs(project.docs).map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-lg">
                                                    <FileText className="w-5 h-5 text-brand-gold" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">{doc.title}</h3>
                                                    <p className="text-slate-400 text-sm">{doc.type} • {doc.size} • {doc.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-green-400 text-[10px] font-bold uppercase">
                                                    <CheckCircle className="w-3 h-3" /> On-Chain
                                                </span>
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}
