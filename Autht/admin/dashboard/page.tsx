"use client";

import { useEffect } from 'react';
import { Users, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';

export default function AdminDashboard() {
    const { stats, isLoading, fetchStats } = useAdminStore();

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            fetchStats(token);
        }
    }, [fetchStats]);

    if (isLoading && !stats) {
        return <div className="text-slate-400">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Platform Overview</h1>
                <p className="text-slate-400">Welcome back, Administrator.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats?.totalUsers || 0}</div>
                    <div className="text-sm text-slate-500">Total Users</div>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <Building2 className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+4%</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats?.totalProjects || 0}</div>
                    <div className="text-sm text-slate-500">Total Projects</div>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+24%</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        ${(stats?.totalInvested || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">Total Invested Volume</div>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        {(stats?.pendingProjects || 0) > 0 && (
                            <span className="flex w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats?.pendingProjects || 0}</div>
                    <div className="text-sm text-slate-500">Pending Approvals</div>
                </div>
            </div>

            {/* Recent Activity / Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Action Required</h3>
                    {/* Placeholder for now */}
                    <div className="text-center py-12 text-slate-500 text-sm">
                        No urgent alerts at this time.
                    </div>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">System Status</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-slate-400 text-sm">Database Connection</span>
                            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Operational
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-slate-400 text-sm">Blockchain Node</span>
                            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Synced
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-slate-400 text-sm">Auth Services</span>
                            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
