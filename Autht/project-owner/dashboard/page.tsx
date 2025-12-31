"use client";

import { useEffect } from 'react';
import { Building2, Plus, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useProjectStore } from '@/store/useProjectStore';

export default function ProjectOwnerDashboard() {
    const { projects, isLoading, fetchProjects } = useProjectStore();

    useEffect(() => {
        const token = localStorage.getItem('project_owner_token');
        if (token) {
            fetchProjects(token);
        }
    }, [fetchProjects]);

    if (isLoading && projects.length === 0) {
        return <div className="text-slate-400">Loading your dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
                    <p className="text-slate-400">Manage and monitor your infrastructure assets.</p>
                </div>
                <Link href="/project-owner/projects/new">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                        <Plus className="w-4 h-4" /> New Project
                    </Button>
                </Link>
            </div>

            {projects.length === 0 ? (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Projects Yet</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-8">
                        Start by creating your first infrastructure project to begin raising capital.
                    </p>
                    <Link href="/project-owner/projects/new">
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                            Create First Project
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-purple-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className={`
                                        text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full mb-3 inline-block
                                        ${project.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                            project.status === 'PENDING_APPROVAL' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-800 text-slate-400'}
                                    `}>
                                        {project.status.replace('_', ' ')}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
                                    <p className="text-slate-400 text-sm truncate">{project.description || 'No description'}</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Target</div>
                                    <div className="font-mono text-white">${project.hardCap.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Raised</div>
                                    <div className="font-mono text-emerald-500">${(project.currentRaised || 0).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Investors</div>
                                    <div className="font-mono text-white">0</div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Link href={`/project-owner/projects/${project.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-black">
                                        Manage
                                    </Button>
                                </Link>
                                {project.status === 'PENDING_APPROVAL' && (
                                    <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-3 rounded-lg">
                                        <Clock className="w-3 h-3" /> Awaiting Review
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
