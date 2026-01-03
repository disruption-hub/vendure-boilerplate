'use client';

import React, { useState } from 'react';
import { useChatbotTheme } from './ChatbotThemeContext';
import { CHAT_THEME_OPTIONS } from '@/lib/chatbot/chat-themes';
import { ThemePreviewElements } from './ThemePreviewElements';
import { SaveThemeModal, DeleteConfirmModal } from './SaveThemeModal';

const THEME_GROUPS = [
    {
        name: 'My Themes',
        items: [] // Dynamic
    },
    {
        name: 'Presets',
        items: [] // Static
    },
    {
        name: 'Layout',
        items: [
            { label: 'Sidebar Background', key: '--chat-sidebar-bg' },
            { label: 'Sidebar Text', key: '--chat-sidebar-text' },
            { label: 'Sidebar Text (Active)', key: '--chat-sidebar-text-active' },
            { label: 'Sidebar Preview Text', key: '--chat-sidebar-preview' },
            { label: 'Sidebar Preview (Active)', key: '--chat-sidebar-preview-active' },
            { label: 'Sidebar Time Text', key: '--chat-sidebar-time' },
            { label: 'Sidebar Time (Active)', key: '--chat-sidebar-time-active' },
            { label: 'Main Background', key: '--chat-main-bg' },
            { label: 'Panel Background', key: '--chat-panel-bg' },
            { label: 'Hover Background', key: '--chat-hover-bg' },
            { label: 'Hover Text', key: '--chat-hover-text' },
            { label: 'Active Background', key: '--chat-active-bg' },
            { label: 'Active Text', key: '--chat-active-text' },
        ]
    },
    {
        name: 'Components',
        items: [
            { label: 'User Bubble (Sent)', key: '--chat-bubble-user-bg' },
            { label: 'User Text', key: '--chat-bubble-user-text' },
            { label: 'Bot Bubble (Received)', key: '--chat-bubble-bot-bg' },
            { label: 'Bot Text', key: '--chat-bubble-bot-text' },
            { label: 'Accent Color', key: '--chat-accent' },
            // Bot Buttons
            { label: 'Button Bg', key: '--chat-bot-btn-bg' },
            { label: 'Button Text', key: '--chat-bot-btn-text' },
            { label: 'Btn Hover Bg', key: '--chat-bot-btn-hover-bg' },
            { label: 'Btn Hover Text', key: '--chat-bot-btn-hover-text' },
        ]
    },
    {
        name: 'Status',
        items: [
            { label: 'Pending (Wait)', key: '--chat-status-pending' },
            { label: 'Sent (Check)', key: '--chat-status-sent' },
            { label: 'Read (Blue Check)', key: '--chat-status-read' },
            { label: 'Status Text', key: '--chat-status-text' },
        ]
    },
    {
        name: 'Custom',
        items: [
            { label: 'Header Background', key: '--chat-header-bg' },
            { label: 'Header Text', key: '--chat-header-text' },
            { label: 'Input Background', key: '--chat-input-bg' },
            { label: 'Input Text', key: '--chat-input-text' },
            { label: 'Panel Text Dim', key: '--chat-panel-text-dim' },
            { label: 'Sidebar Active', key: '--chat-sidebar-active' },
        ]
    },
    {
        name: 'Right Panel',
        items: [
            { label: 'Panel Background', key: '--chatbot-sidebar-topbar-bg' },
            { label: 'Border Color', key: '--chatbot-sidebar-border' },
            { label: 'Pill/Tab Background', key: '--chatbot-sidebar-pill-bg' },
            { label: 'Text Color', key: '--chatbot-sidebar-text' },
            { label: 'Secondary Text', key: '--chatbot-sidebar-secondary' },
            { label: 'Accent Color', key: '--chatbot-sidebar-accent' },
        ]
    },
    {
        name: 'Preview',
        items: []
    }
];

export function ChatbotThemeConfigurator() {
    const { colors, updateColor, setColors, saveTheme, resetTheme, themes, activeThemeId, activateTheme, deleteTheme, createTheme } = useChatbotTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('My Themes');

    // Modal states
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [themeToDelete, setThemeToDelete] = useState<{ id: string; name: string } | null>(null);

    const handleColorChange = (key: string, value: string) => {
        updateColor(key as any, value);
    };

    const handleSaveAsNew = () => {
        setShowSaveModal(true);
    };

    const handleCreateTheme = async (name: string) => {
        const success = await createTheme(name);
        if (success) {
            setActiveTab('My Themes'); // Switch to list to see it
            setShowSaveModal(false); // Close modal after saving
        }
    };

    const handleSave = async () => {
        if (!activeThemeId) {
            // No active theme, must save as new
            handleSaveAsNew();
        } else {
            // Update existing
            await saveTheme();
        }
    };

    const handleDeleteClick = (id: string, name: string) => {
        setThemeToDelete({ id, name });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (themeToDelete) {
            await deleteTheme(themeToDelete.id);
            setThemeToDelete(null);
            setShowDeleteModal(false); // Close modal after deleting
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9999] p-3 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
                title="Customize Theme"
            >
                🎨
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] p-0 bg-white border border-slate-200 rounded-xl shadow-2xl w-[480px] text-sm text-slate-900 overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-lg">Theme Editor</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50 overflow-x-auto">
                {THEME_GROUPS.map(group => (
                    <button
                        key={group.name}
                        onClick={() => setActiveTab(group.name)}
                        className={`flex-none px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${activeTab === group.name
                            ? 'bg-white border-b-2 border-slate-900 text-slate-900'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {group.name}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">

                {activeTab === 'Presets' ? (
                    <div className="space-y-3">
                        <p className="text-xs text-slate-500 italic mb-2">Select a preset to start customizing. It won't be saved until you click 'Save As New'.</p>
                        {CHAT_THEME_OPTIONS.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => {
                                    setColors(theme.tokens);
                                    // Presets don't set activeThemeId, effectively "unsaved" state
                                }}
                                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-slate-900 transition-all hover:shadow-md group"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-800">{theme.label}</span>
                                    <div
                                        className="w-6 h-6 rounded-full shadow-sm border border-white"
                                        style={{ background: theme.previewGradient }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 group-hover:text-slate-600 leading-snug">
                                    {theme.description}
                                </p>
                            </button>
                        ))}
                    </div>
                ) : activeTab === 'My Themes' ? (
                    <div className="space-y-3">
                        {themes.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <p>No saved themes yet.</p>
                                <button onClick={() => setActiveTab('Presets')} className="text-blue-500 hover:underline mt-2">Start with a preset</button>
                            </div>
                        ) : (
                            themes.map(theme => (
                                <div
                                    key={theme.id}
                                    className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md group relative ${activeThemeId === theme.id ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-400'}`}
                                >
                                    <button
                                        onClick={() => activateTheme(theme.id)}
                                        className="w-full text-left pr-16"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold ${activeThemeId === theme.id ? 'text-blue-700' : 'text-slate-800'}`}>
                                                {theme.name}
                                                {theme.isActive && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Active</span>}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {activeThemeId === theme.id ? 'Currently editing - make changes and click Save Updates' : 'Click to edit this theme'}
                                        </p>
                                    </button>

                                    {/* Action buttons */}
                                    <div className="absolute top-3 right-3 flex gap-1">
                                        {/* Edit button - switches to Layout tab for editing */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                activateTheme(theme.id);
                                                setActiveTab('Layout'); // Switch to editing tab
                                            }}
                                            className="text-slate-300 hover:text-blue-500 p-1"
                                            title="Edit Theme Colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        {/* Delete button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(theme.id, theme.name);
                                            }}
                                            className="text-slate-300 hover:text-red-500 p-1"
                                            title="Delete Theme"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        <button
                            onClick={handleSaveAsNew}
                            className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-500 rounded-lg hover:border-slate-400 hover:text-slate-700 transition-colors text-xs font-semibold uppercase tracking-wide"
                        >
                            + Create New Theme
                        </button>
                    </div>
                ) : activeTab === 'Preview' ? (
                    <ThemePreviewElements />
                ) : (
                    THEME_GROUPS.find(g => g.name === activeTab)?.items.map((item) => {
                        const currentValue = (colors as any)[item.key] || '#ffffff';
                        return (
                            <div key={item.key} className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-600">{item.label}</label>
                                <div className="flex items-center gap-2">
                                    {/* ... existing input logic ... */}
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                                        <input
                                            type="color"
                                            value={currentValue}
                                            onChange={(e) => handleColorChange(item.key, e.target.value)}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 border-0 cursor-pointer"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={currentValue}
                                        onChange={(e) => handleColorChange(item.key, e.target.value)}
                                        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 focus:border-slate-400 focus:outline-none bg-slate-50 text-slate-900 font-mono"
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                <button
                    onClick={handleSave}
                    className="flex-1 bg-slate-900 text-white py-2 px-4 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                    disabled={!activeThemeId} // Disable simple save if no active theme (force save as new)
                    title={!activeThemeId ? "Select a theme or Save As New" : "Update current theme"}
                >
                    {activeThemeId ? 'Save Updates' : 'Save Updates (Select Theme)'}
                </button>
                <button
                    onClick={handleSaveAsNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    Save As New
                </button>
                <button
                    onClick={resetTheme}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                    Reset
                </button>
            </div>

            {/* Save Theme Modal */}
            <SaveThemeModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={handleCreateTheme}
                mode="create"
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setThemeToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                themeName={themeToDelete?.name || ''}
            />
        </div >
    );
}

