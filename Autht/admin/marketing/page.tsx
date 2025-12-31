'use client';

import { useState } from 'react';
import { Mail, Send, Users, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

export default function AdminMarketing() {
    const [target, setTarget] = useState<'investors' | 'subscribers' | 'all'>('subscribers');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | '', message: string }>({ type: '', message: '' });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm(`Are you sure you want to send this email to ${target.toUpperCase()}? This action cannot be undone.`)) {
            return;
        }

        setIsSending(true);
        setStatus({ type: '', message: '' });

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/admin/marketing/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ target, subject, content }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to send emails');
            }

            setStatus({ type: 'success', message: `Successfully sent emails to ${data.count} recipients.` });
            setSubject('');
            setContent('');
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Mail className="w-6 h-6 text-brand-gold" />
                Email Marketing
            </h1>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-200">
                        <p className="font-semibold mb-1">Mass Mailing</p>
                        <p>Emails will be sent using Brevo. A BCC copy will be sent to the address configured in Settings for compliance.</p>
                    </div>
                </div>

                <form onSubmit={handleSend} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTarget('subscribers')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${target === 'subscribers' ? 'bg-brand-gold text-brand-dark' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                >
                                    Subscribers Only
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTarget('investors')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${target === 'investors' ? 'bg-brand-gold text-brand-dark' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                >
                                    Investors Only
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTarget('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${target === 'all' ? 'bg-brand-gold text-brand-dark' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                >
                                    All Users
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Subject Line</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g. Monthly Investor Update"
                                required
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-gold/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Content (HTML supported)</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="<h1>Hello Investor,</h1><p>Here is your update...</p>"
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
                            disabled={isSending || !subject || !content}
                            className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-bold min-w-[200px]"
                        >
                            {isSending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                            ) : (
                                <><Send className="w-4 h-4 mr-2" /> Send Mass Email</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
