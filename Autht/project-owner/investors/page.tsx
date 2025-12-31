"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Mail, Loader2 } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';

export default function InvestorsPage() {
    const { investors, isLoading, error, fetchInvestors } = useProjectStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProject, setSelectedProject] = useState('Turboducto Lurin-Callao');

    useEffect(() => {
        const token = localStorage.getItem('project_owner_token');
        if (token) {
            fetchInvestors(token);
        }
    }, [fetchInvestors]);



    const filteredInvestors = investors.filter(inv => {
        const matchesSearch = inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesProject = selectedProject === 'All Projects' ||
            inv.projects.includes(selectedProject);

        return matchesSearch && matchesProject;
    });

    const uniqueProjects = Array.from(new Set(investors.flatMap(inv => inv.projects)));

    if (isLoading && investors.length === 0) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (error && investors.length === 0) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
                <p className="text-red-400 font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 text-sm text-red-500 hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Investors</h1>
                    <p className="text-slate-400">View and manage your project investors</p>
                </div>
                <div className="flex gap-2">

                    <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-medium transition-colors border border-white/10">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search investors by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-300 focus:outline-none focus:border-purple-500"
                    >
                        <option>All Projects</option>
                        {uniqueProjects.map(project => (
                            <option key={project} value={project}>{project}</option>
                        ))}
                    </select>
                    <button className="p-2 bg-slate-950 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Investors Table */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-slate-950/50">
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Investor</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invested</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Investment</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredInvestors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No investors found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvestors.map((investor) => (
                                    <tr key={investor.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <div className="font-medium text-white">{investor.name}</div>
                                                <div className="text-xs text-slate-500">{investor.email}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-emerald-400">
                                                ${investor.totalInvested.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="inline-flex items-center px-2 py-1 rounded bg-slate-800 text-xs text-slate-300">
                                                {investor.projectsCount} {investor.projectsCount === 1 ? 'Project' : 'Projects'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400 text-sm">
                                            {investor.lastInvestment}
                                        </td>
                                        <td className="p-4">
                                            <span className={`
                                                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                                ${investor.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}
                                            `}>
                                                {investor.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                                                <Mail className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Simplified for now) */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-500">
                    <div>Showing {filteredInvestors.length} investors</div>
                </div>
            </div>
        </div>
    );
}
