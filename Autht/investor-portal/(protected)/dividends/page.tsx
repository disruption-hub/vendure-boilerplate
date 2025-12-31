"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, DollarSign, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock dividends data
const dividendHistory = [
    { id: 1, project: 'TurboDucto Peru', amount: 125.50, date: '2024-12-15', status: 'Paid', type: 'quarterly' },
    { id: 2, project: 'TurboDucto Peru', amount: 125.50, date: '2024-09-15', status: 'Paid', type: 'quarterly' },
    { id: 3, project: 'TurboDucto Peru', amount: 125.50, date: '2024-06-15', status: 'Paid', type: 'quarterly' },
    { id: 4, project: 'TurboDucto Peru', amount: 125.50, date: '2024-03-15', status: 'Paid', type: 'quarterly' },
];

const upcomingDividends = [
    { id: 1, project: 'TurboDucto Peru', estimatedAmount: 130.00, expectedDate: '2025-03-15', type: 'quarterly' },
];

export default function DividendsPage() {
    const totalEarned = dividendHistory.reduce((sum, d) => sum + d.amount, 0);
    const thisYear = dividendHistory.filter(d => d.date.startsWith('2024')).reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Earnings</h1>
                <p className="text-slate-400 mt-2">Track your earnings and payout history</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-slate-400 text-sm">Total Earned</span>
                    </div>
                    <p className="text-3xl font-bold text-white">${totalEarned.toFixed(2)}</p>
                    <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                        <ArrowUpRight className="w-4 h-4" />
                        All time earnings
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900/50 border border-white/5 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-brand-gold" />
                        </div>
                        <span className="text-slate-400 text-sm">This Year</span>
                    </div>
                    <p className="text-3xl font-bold text-white">${thisYear.toFixed(2)}</p>
                    <p className="text-slate-400 text-sm mt-2">2024 earnings</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900/50 border border-white/5 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-slate-400 text-sm">Next Payout</span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        ${upcomingDividends[0]?.estimatedAmount.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                        Expected {upcomingDividends[0]?.expectedDate || 'N/A'}
                    </p>
                </motion.div>
            </div>

            {/* Upcoming Dividends */}
            {upcomingDividends.length > 0 && (
                <div className="bg-gradient-to-r from-brand-gold/10 to-amber-500/5 border border-brand-gold/20 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">Upcoming Payouts</h2>
                    <div className="space-y-3">
                        {upcomingDividends.map((dividend) => (
                            <div key={dividend.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                                <div>
                                    <p className="text-white font-medium">{dividend.project}</p>
                                    <p className="text-slate-400 text-sm capitalize">{dividend.type} dividend</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-brand-gold font-bold">~${dividend.estimatedAmount.toFixed(2)}</p>
                                    <p className="text-slate-400 text-sm">{dividend.expectedDate}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Dividend History */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Payout History</h2>
                    <Button variant="outline" size="sm" className="border-white/10 text-black hover:bg-white/5">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Project</th>
                                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Type</th>
                                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Date</th>
                                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Amount</th>
                                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dividendHistory.map((dividend) => (
                                <tr key={dividend.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-4 px-4 text-white">{dividend.project}</td>
                                    <td className="py-4 px-4 text-slate-400 capitalize">{dividend.type}</td>
                                    <td className="py-4 px-4 text-slate-400">{dividend.date}</td>
                                    <td className="py-4 px-4 text-right text-green-400 font-medium">
                                        +${dividend.amount.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                                            {dividend.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
