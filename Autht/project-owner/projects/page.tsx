"use client";

import { useEffect, useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Building2, MapPin, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

export default function MyProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            const token = localStorage.getItem('project_owner_token');
            try {
                const res = await fetch(`${API_URL}/projects/owner/my-projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) {
        return <div className="text-slate-400 p-8">Loading projects...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
                    <p className="text-slate-400">Manage your infrastructure assets and funding campaigns</p>
                </div>
                <Link
                    href="/project-owner/projects/new"
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Project
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all group">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-8 h-8 text-slate-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{project.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <MapPin className="w-4 h-4" />
                                        {project.location || 'Peru'}
                                    </div>
                                </div>
                            </div>


                            <div className={`
                                text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full inline-block
                                ${project.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                    project.status === 'PENDING_APPROVAL' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-800 text-slate-400'}
                            `}>
                                {project.status.replace('_', ' ')}
                            </div>

                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                                <div className="text-xs text-slate-500 mb-1">Target Raise</div>
                                <div className="text-white font-semibold flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-slate-500" />
                                    {(project.hardCap || 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                                <div className="text-xs text-slate-500 mb-1">Raised</div>
                                <div className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-emerald-500" />
                                    {(project.currentRaised || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Funding Progress</span>
                                <span className="text-white font-medium">
                                    {project.hardCap > 0 ? Math.round(((project.currentRaised || 0) / project.hardCap) * 100) : 0}%
                                </span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                    style={{ width: `${project.hardCap > 0 ? ((project.currentRaised || 0) / project.hardCap) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* New Project Card */}
                <Link href="/project-owner/projects/new" className="bg-slate-900/50 border border-white/5 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-purple-400 hover:border-purple-500/30 hover:bg-slate-900 transition-all group min-h-[280px]">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Plus className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-1">Create New Project</h3>
                        <p className="text-sm text-slate-600">Start a new funding campaign</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
