'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, Loader2, AlertCircle, CheckCircle, Store, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

export default function ProjectOwnerMarketing() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | '', message: string }>({ type: '', message: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('project_owner_token');
            const res = await fetch(`${API_URL}/projects/owner/my-projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setProjects(data);
                if (data.length > 0) setSelectedProject(data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;

        const project = projects.find(p => p.id === selectedProject);
        if (!confirm(`Are you sure you want to send this email to all investors of "${project?.name}"?`)) {
            return;
        }

        setIsSending(true);
        setStatus({ type: '', message: '' });

        try {
            const token = localStorage.getItem('project_owner_token');
            const res = await fetch(`${API_URL}/projects/${selectedProject}/marketing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ subject, content }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to send emails');
            }

            setStatus({ type: 'success', message: `Successfully sent emails to ${data.count} investors.` });
            setSubject('');
            setContent('');
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsSending(false);
        }
    };

    if (isLoadingProjects) {
        return <div className="flex items-center justify-center p-12 text-slate-400">Loading projects...</div>;
    }

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-white/5 rounded-xl bg-white/5">
                <Store className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-white mb-2">No Projects Found</h3>
                <p>You need to create a project before you can send marketing emails.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Mail className="w-6 h-6 text-brand-gold" />
                Investor Updates
            </h1>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-200">
                        <p className="font-semibold mb-1">Direct Investor Communication</p>
                        <p>Send updates, reports, and announcements directly to all investors in your project. A compliance copy will be sent to the platform administrators.</p>
                    </div>
                </div>

                <form onSubmit={handleSend} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Select Project</label>
                        <div className="relative">
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="w-full appearance-none pl-4 pr-10 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-gold/50"
                            >
                                {projects.map(p => (
                                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                                        {p.name} ({p.tokenSymbol})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Subject Line</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Q3 Performance Report"
                            required
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-gold/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Content (HTML supported)</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="<p>Dear Investors...</p>"
                            required
                            rows={12}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-brand-gold/50"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex-1">
                            {status.message && (
                                <div className={`flex items-center gap-2 text-sm ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {status.message}
                                </div>
                            )}
                        </div>
                        <Button
                            type="submit"
                            disabled={isSending || !subject || !content || !selectedProject}
                            className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-bold min-w-[200px]"
                        >
                            {isSending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                            ) : (
                                <><Send className="w-4 h-4 mr-2" /> Send Update</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
