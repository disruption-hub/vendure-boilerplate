"use client";

import { FileText, Clock } from 'lucide-react';

export default function ApprovalsPlaceholder() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/10">
                <FileText className="w-10 h-10 text-slate-500" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Project Approvals</h1>
                <p className="text-slate-400 max-w-md mx-auto">
                    This module is currently under development. Here you will be able to review and approve new infrastructure projects submitted by project owners.
                </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Coming Soon</span>
            </div>
        </div>
    );
}
