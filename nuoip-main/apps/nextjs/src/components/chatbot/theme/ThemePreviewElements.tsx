import React from 'react';
import { User, Bot, Settings, ChevronDown, Check, MoreVertical } from 'lucide-react';

export function ThemePreviewElements() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Icons Section */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Icons</h4>
                <div className="flex gap-4 p-4 rounded-lg border border-dashed border-slate-200" style={{ background: 'var(--chat-panel-bg)' }}>
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-md" style={{ background: 'var(--chat-sidebar-bg)', color: 'var(--chat-sidebar-text)' }}>
                            <Bot size={20} />
                        </div>
                        <span className="text-[10px] text-slate-400">Sidebar</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-md" style={{ color: 'var(--chat-accent)' }}>
                            <User size={20} />
                        </div>
                        <span className="text-[10px] text-slate-400">Accent</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-md" style={{ color: 'var(--chat-panel-text-dim)' }}>
                            <Settings size={20} />
                        </div>
                        <span className="text-[10px] text-slate-400">Dim</span>
                    </div>
                </div>
            </div>

            {/* Typography Section */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Typography</h4>
                <div className="p-4 rounded-lg border border-dashed border-slate-200 space-y-2" style={{ background: 'var(--chat-panel-bg)' }}>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--chat-panel-text)' }}>Heading Text</h1>
                    <p className="text-sm" style={{ color: 'var(--chat-panel-text)' }}>
                        This is standard body text color. It should provide good contrast against the panel background.
                    </p>
                    <p className="text-xs" style={{ color: 'var(--chat-panel-text-dim)' }}>
                        This is dimmed text, often used for timestamps or secondary information.
                    </p>
                    <a href="#" className="text-sm underline" style={{ color: 'var(--chat-accent)' }}>Link Color</a>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tabs</h4>
                <div className="p-4 rounded-lg border border-dashed border-slate-200" style={{ background: 'var(--chat-panel-bg)' }}>
                    <div className="flex border-b" style={{ borderColor: 'var(--chat-bot-btn-active-bg)' }}>
                        <div className="px-4 py-2 border-b-2 font-medium text-sm"
                            style={{
                                borderColor: 'var(--chat-accent)',
                                color: 'var(--chat-panel-text)'
                            }}>
                            Active Tab
                        </div>
                        <div className="px-4 py-2 font-medium text-sm"
                            style={{
                                color: 'var(--chat-panel-text-dim)'
                            }}>
                            Inactive Tab
                        </div>
                    </div>
                </div>
            </div>

            {/* Dropdown / Interactive Section */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Interactive Elements</h4>
                <div className="p-4 rounded-lg border border-dashed border-slate-200 grid grid-cols-2 gap-4" style={{ background: 'var(--chat-main-bg)' }}>

                    {/* Mock Dropdown */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 mb-1">Dropdown Menu</span>
                        <div className="rounded-lg shadow-lg overflow-hidden w-full border"
                            style={{
                                background: 'var(--chat-panel-bg)',
                                borderColor: 'var(--chat-bot-btn-active-bg)'
                            }}>
                            <div className="px-3 py-2 text-sm flex justify-between items-center hover:brightness-95 cursor-pointer"
                                style={{ color: 'var(--chat-panel-text)' }}>
                                <span>Option 1</span>
                            </div>
                            <div className="px-3 py-2 text-sm flex justify-between items-center cursor-pointer"
                                style={{
                                    background: 'var(--chat-active-bg)',
                                    color: 'var(--chat-active-text)'
                                }}>
                                <span>Selected</span>
                                <Check size={14} />
                            </div>
                            <div className="px-3 py-2 text-sm flex justify-between items-center hover:brightness-95 cursor-pointer"
                                style={{ color: 'var(--chat-panel-text)' }}>
                                <span>Option 3</span>
                            </div>
                        </div>
                    </div>

                    {/* Mock Input */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 mb-1">Input Field</span>
                        <div className="rounded-lg border px-3 py-2"
                            style={{
                                background: 'var(--chat-input-bg)',
                                borderColor: 'var(--chat-bot-btn-active-bg)',
                                color: 'var(--chat-input-text)'
                            }}>
                            Typed text...
                        </div>
                        <div className="mt-2 flex gap-2">
                            <button className="px-3 py-1.5 rounded text-xs font-medium"
                                style={{
                                    background: 'var(--chat-bot-btn-bg)',
                                    color: 'var(--chat-bot-btn-text)',
                                    border: '1px solid var(--chat-bot-btn-active-bg)'
                                }}>
                                Action
                            </button>
                            <button className="px-3 py-1.5 rounded text-xs font-medium"
                                style={{
                                    background: 'var(--chat-accent)',
                                    color: '#ffffff'
                                }}>
                                Primary
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
