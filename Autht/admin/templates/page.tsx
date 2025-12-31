"use client";

import { useState, useEffect } from 'react';
import { Mail, Save, Loader2, Plus, Trash2, Edit2, Code, Eye, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    content: string;
    type: string;
    isActive: boolean;
    placeholders: string[];
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
    const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/admin/email-templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const isNew = !editingTemplate?.id;
            const url = isNew
                ? `${API_URL}/admin/email-templates`
                : `${API_URL}/admin/email-templates/${editingTemplate.id}`;

            const res = await fetch(url, {
                method: isNew ? 'POST' : 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editingTemplate)
            });

            if (res.ok) {
                toast.success(isNew ? 'Template created successfully' : 'Template updated successfully');
                fetchTemplates();
                setEditingTemplate(null);
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save template');
            }
        } catch (error: any) {
            toast.error(error.message);
            console.error('Failed to save template', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/admin/email-templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Template deleted successfully');
                fetchTemplates();
            } else {
                throw new Error('Failed to delete template');
            }
        } catch (error: any) {
            toast.error(error.message);
            console.error('Failed to delete template', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Email Templates</h1>
                    <p className="text-slate-400 mt-1">Manage platform communication and welcome emails</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-black/20 border border-white/5 rounded-lg p-1 mr-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-brand-gold text-brand-blue shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'card' ? 'bg-brand-gold text-brand-blue shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Card
                        </button>
                    </div>
                    <Button
                        onClick={() => setEditingTemplate({ name: '', subject: '', content: '', type: 'WELCOME', isActive: true, placeholders: ['name', 'email'] })}
                        className="bg-brand-gold text-brand-blue font-bold hover:bg-brand-gold/90"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Template
                    </Button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="glass rounded-xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-black/20">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map(template => (
                                    <tr key={template.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <span className="text-white font-medium">{template.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-white/5">
                                                {template.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-sm text-slate-400 truncate">{template.subject}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {template.isActive ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase tracking-wider">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingTemplate(template)} className="h-8 w-8 text-slate-400 hover:text-white">
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)} className="h-8 w-8 text-red-400 hover:text-red-300">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <div key={template.id} className="glass rounded-xl p-6 border border-white/5 space-y-4 hover:border-brand-gold/20 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">{template.name}</h3>
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                            {template.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingTemplate(template)} className="text-slate-400 hover:text-white">
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)} className="text-red-400 hover:text-red-300">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 uppercase">Subject</p>
                                <p className="text-sm text-white line-clamp-1">{template.subject}</p>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex flex-wrap gap-1">
                                    {template.placeholders?.map(p => (
                                        <span key={p} className="text-[9px] text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 rounded-full border border-brand-gold/20">
                                            {`{{${p}}}`}
                                        </span>
                                    ))}
                                </div>
                                {template.isActive && (
                                    <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase tracking-wider shrink-0">
                                        <CheckCircle className="w-3 h-3" />
                                        Active
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Editing Modal */}
            {editingTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <button onClick={() => setEditingTemplate(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                                <Code className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {editingTemplate.id ? 'Edit Template' : 'New Email Template'}
                                </h2>
                                <p className="text-slate-400 text-sm">Design your email using placeholders for personalization</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">Template Name</label>
                                        <Input
                                            value={editingTemplate.name}
                                            onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                            placeholder="Welcome Email - Investor"
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">Email Subject</label>
                                        <Input
                                            value={editingTemplate.subject}
                                            onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                            placeholder="Welcome to Infrabricks, {{name}}!"
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">Type</label>
                                        <select
                                            value={editingTemplate.type}
                                            onChange={e => setEditingTemplate({ ...editingTemplate, type: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-md h-10 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                                        >
                                            <option value="WELCOME">Welcome Email</option>
                                            <option value="OTP">OTP Verification</option>
                                            <option value="PROFILE_UPDATE">Profile Update Request</option>
                                            <option value="PROFILE_UPDATED">Profile Updated Notice</option>
                                            <option value="NEWSLETTER">Newsletter</option>
                                            <option value="ALERT">System Alert</option>
                                            <option value="DISBURSEMENT">Disbursement Notification</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={editingTemplate.isActive}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })}
                                                className="w-4 h-4 rounded border-white/10 bg-black/20 text-brand-gold focus:ring-brand-gold"
                                            />
                                            <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Active Template</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs text-slate-400 uppercase tracking-widest font-bold">HTML Content</label>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setIsPreviewOpen(!isPreviewOpen)} className="h-6 text-[10px] text-brand-gold hover:bg-brand-gold/10">
                                                {isPreviewOpen ? <Eye className="w-3 h-3 mr-1" /> : <Code className="w-3 h-3 mr-1" />}
                                                {isPreviewOpen ? 'Preview' : 'Show Code'}
                                            </Button>
                                        </div>
                                    </div>

                                    {isPreviewOpen ? (
                                        <div className="bg-white rounded-lg p-6 h-[400px] overflow-y-auto text-black email-preview border border-white/5 shadow-inner">
                                            <div dangerouslySetInnerHTML={{
                                                __html: editingTemplate.content
                                                    ?.replace(/{{name}}/g, 'John Doe')
                                                    ?.replace(/{{email}}/g, 'john@example.com')
                                                    ?.replace(/{{otp_code}}/g, '123456')
                                                    ?.replace(/{{platform_name}}/g, 'Infrabricks')
                                                    ?.replace(/{{current_year}}/g, new Date().getFullYear().toString())
                                                    || ''
                                            }} />
                                        </div>
                                    ) : (
                                        <textarea
                                            id="template-content"
                                            value={editingTemplate.content}
                                            onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                            placeholder="<div style='font-family: sans-serif;'>Hello {{name}}...</div>"
                                            className="w-full h-[400px] bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-xs text-blue-400 focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Placeholder Library */}
                            <div className="space-y-6">
                                <div className="p-6 rounded-xl bg-black/20 border border-white/5 space-y-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <Code className="w-4 h-4 text-brand-gold" />
                                        Placeholder Library
                                    </h3>
                                    <p className="text-xs text-slate-400">Click a placeholder to insert it into the subject or content editor.</p>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">User Information</p>
                                            <div className="flex flex-wrap gap-2">
                                                {['name', 'email', 'phone', 'first_name', 'last_name'].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => {
                                                            const tag = `{{${p}}}`;
                                                            const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
                                                            if (textarea && !isPreviewOpen) {
                                                                const start = textarea.selectionStart;
                                                                const end = textarea.selectionEnd;
                                                                const text = editingTemplate.content || '';
                                                                const newText = text.substring(0, start) + tag + text.substring(end);
                                                                setEditingTemplate({ ...editingTemplate, content: newText });
                                                                setTimeout(() => {
                                                                    textarea.focus();
                                                                    textarea.setSelectionRange(start + tag.length, start + tag.length);
                                                                }, 0);
                                                            } else {
                                                                setEditingTemplate({ ...editingTemplate, subject: (editingTemplate.subject || '') + tag });
                                                            }
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300 hover:border-brand-gold hover:text-brand-gold transition-colors"
                                                    >
                                                        {`{{${p}}}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">System & Platform</p>
                                            <div className="flex flex-wrap gap-2">
                                                {['otp_code', 'platform_name', 'support_email', 'current_year', 'login_url'].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => {
                                                            const tag = `{{${p}}}`;
                                                            const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
                                                            if (textarea && !isPreviewOpen) {
                                                                const start = textarea.selectionStart;
                                                                const end = textarea.selectionEnd;
                                                                const text = editingTemplate.content || '';
                                                                const newText = text.substring(0, start) + tag + text.substring(end);
                                                                setEditingTemplate({ ...editingTemplate, content: newText });
                                                                setTimeout(() => {
                                                                    textarea.focus();
                                                                    textarea.setSelectionRange(start + tag.length, start + tag.length);
                                                                }, 0);
                                                            } else {
                                                                setEditingTemplate({ ...editingTemplate, subject: (editingTemplate.subject || '') + tag });
                                                            }
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300 hover:border-brand-gold hover:text-brand-gold transition-colors"
                                                    >
                                                        {`{{${p}}}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-3 bg-brand-gold/5 rounded-lg border border-brand-gold/20">
                                            <p className="text-[10px] text-brand-gold font-bold uppercase mb-1 flex items-center gap-1">
                                                <Eye className="w-3 h-3" /> Tip
                                            </p>
                                            <p className="text-[10px] text-slate-400 italic">
                                                Selection focus is on the editor. If you click a placeholder while the editor has focus, it will insert at your cursor position.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-white/5">
                            <Button variant="outline" onClick={() => setEditingTemplate(null)} className="border-white/10 text-black hover:text-white hover:border-white hover:bg-white/5">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveTemplate}
                                disabled={isSaving}
                                className="bg-brand-gold text-brand-blue font-bold hover:bg-brand-gold/90 min-w-[120px]"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Template</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
