'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/stores/toast-store';
import { useChatAuthStore } from '@/stores/chat-auth-store';

// Define the shape of a theme object from the database
export type ChatbotTheme = {
    id: string;
    name: string;
    colors: ThemeColors;
    isActive: boolean;
    isDefault: boolean;
};

export type ThemeColors = Record<string, string>;

const DEFAULT_THEME: ThemeColors = {
    // Top Level Layout
    '--chat-sidebar-bg': '#0f172a',
    '--chat-sidebar-text': '#f8fafc',
    '--chat-main-bg': '#f8fafc',
    '--chat-panel-bg': '#ffffff',
    '--chat-panel-text': '#0f172a',
    '--chat-hover-bg': '#1a2744',
    '--chat-hover-text': '#ffffff',
    '--chat-active-bg': '#ffffff',
    '--chat-active-text': '#0f172a',

    // Message Status
    '--chat-status-pending': '#94a3b8',
    '--chat-status-sent': '#cbd5e1',
    '--chat-status-read': '#22d3ee',
    '--chat-status-text': '#cbd5e1',

    // Components
    '--chat-bubble-user-bg': '#2563eb',
    '--chat-bubble-user-text': '#ffffff',
    '--chat-bubble-bot-bg': '#ffffff',
    '--chat-bubble-bot-text': '#0f172a',
    '--chat-accent': '#22d3ee',

    // Bot Buttons (Quick Actions)
    '--chat-bot-btn-bg': '#ffffff',
    '--chat-bot-btn-text': '#0f172a',
    '--chat-bot-btn-hover-bg': '#f1f5f9',
    '--chat-bot-btn-hover-text': '#0f172a',
    '--chat-bot-btn-active-bg': '#e2e8f0',
    '--chat-bot-btn-active-text': '#0f172a',

    // Header
    '--chat-header-bg': '#ffffff',
    '--chat-header-text': '#0f172a',

    // Right Panel (CRM/Details Sidebar)
    '--chatbot-sidebar-topbar-bg': '#1e293b',
    '--chatbot-sidebar-border': '#2a3a50',
    '--chatbot-sidebar-pill-bg': '#2a3a50',
    '--chatbot-sidebar-text': '#f8fafc',
    '--chatbot-sidebar-secondary': '#b8c4d0',
    '--chatbot-sidebar-accent': '#5a9080',
};

type ChatbotThemeContextType = {
    colors: ThemeColors;
    updateColor: (key: keyof ThemeColors, value: string) => void;
    setColors: (colors: ThemeColors) => void;
    resetTheme: () => void;
    saveTheme: (name?: string) => Promise<boolean>; // Updated signature
    createTheme: (name: string) => Promise<boolean>; // New
    deleteTheme: (id: string) => Promise<void>; // New
    activateTheme: (id: string) => Promise<void>; // New
    themes: ChatbotTheme[]; // New
    activeThemeId: string | null; // New
};

const ChatbotThemeContext = createContext<ChatbotThemeContextType | undefined>(undefined);

// Use Next.js API routes instead of direct backend calls
// This ensures the frontend works in both local and deployed environments
const API_URL = '/api/chatbot/themes';

export function ChatbotThemeProvider({ children }: { children: React.ReactNode }) {
    const [colors, setColorsState] = useState<ThemeColors>(DEFAULT_THEME);
    const [themes, setThemes] = useState<ChatbotTheme[]>([]);
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const sessionToken = useChatAuthStore(state => state.sessionToken);

    // Initial Load - load themes when sessionToken becomes available
    useEffect(() => {
        if (sessionToken) {
            refreshThemes();
        }
    }, [sessionToken]);

    // Apply CSS variables
    useEffect(() => {
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }, [colors]);

    const getAuthHeaders = () => {
        return {
            'Content-Type': 'application/json',
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        };
    };

    const refreshThemes = async () => {
        try {
            // 1. Fetch Active Theme to apply immediately
            const activeRes = await fetch(`${API_URL}/active`, { headers: getAuthHeaders() });
            if (activeRes.ok) {
                const activeTheme = await activeRes.json();
                if (activeTheme) {
                    setColorsState(prev => ({ ...prev, ...activeTheme.colors }));
                    setActiveThemeId(activeTheme.id);
                }
            }

            // 2. Fetch All Themes for the list
            const allRes = await fetch(`${API_URL}`, { headers: getAuthHeaders() });
            if (allRes.ok) {
                const allThemes = await allRes.json();
                setThemes(allThemes);
            }
        } catch (e) {
            console.error('Failed to load themes', e);
        }
    };

    const setColors = (newColors: ThemeColors) => {
        setColorsState(prev => ({ ...prev, ...newColors }));
    };

    const updateColor = (key: keyof ThemeColors, value: string) => {
        setColorsState(prev => ({ ...prev, [key]: value }));
    };

    const resetTheme = () => {
        setColorsState(DEFAULT_THEME);
        setActiveThemeId(null);
        // We don't delete from DB on reset, just reset local state to defaults
        // Logic choice: Does reset mean "load default theme" or "reset to factory values"?
        // Usually factory values. User can then save as new or update.
    };

    const createTheme = async (name: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, colors, isActive: true }), // Create and activate
            });
            if (res.ok) {
                const newTheme = await res.json();
                setColorsState(newTheme.colors);
                setActiveThemeId(newTheme.id);
                await refreshThemes();
                toast.success('Theme Created', `"${name}" has been saved and activated`);
                return true;
            } else {
                const errorData = await res.json().catch(() => ({}));
                const message = errorData.message || 'Could not create the theme. Please try again.';
                toast.error('Failed to Create', message);
                return false;
            }
        } catch (e) {
            console.error(e);
            toast.error('Error', 'An error occurred while creating the theme');
            return false;
        }
    };

    const saveTheme = async (name?: string): Promise<boolean> => {
        if (!activeThemeId) {
            if (name) {
                return createTheme(name);
            }
            toast.warning('No Theme Selected', 'Please create a new theme to save these settings.');
            return false;
        }

        try {
            // Update existing active theme
            const res = await fetch(`${API_URL}/${activeThemeId}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ colors, name }), // Can update name if provided
            });
            if (res.ok) {
                await refreshThemes();
                toast.success('Theme Saved', 'Your changes have been saved successfully');
                return true;
            } else {
                const errorData = await res.json().catch(() => ({}));
                const message = errorData.message || 'Could not save the theme. Please try again.';
                toast.error('Save Failed', message);
                return false;
            }
        } catch (e) {
            console.error(e);
            toast.error('Error', 'An error occurred while saving the theme');
            return false;
        }
    };

    const deleteTheme = async (id: string) => {
        try {
            const themeToDelete = themes.find(t => t.id === id);
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                if (activeThemeId === id) {
                    resetTheme(); // If deleted active, reset to default
                }
                await refreshThemes();
                toast.success('Theme Deleted', `"${themeToDelete?.name || 'Theme'}" has been removed`);
            } else {
                toast.error('Delete Failed', 'Could not delete the theme. Please try again.');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error', 'An error occurred while deleting the theme');
        }
    };

    const activateTheme = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/${id}/activate`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                await refreshThemes(); // Will fetch active and apply colors
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <ChatbotThemeContext.Provider value={{
            colors,
            updateColor,
            setColors,
            resetTheme,
            saveTheme,
            createTheme,
            deleteTheme,
            activateTheme,
            themes,
            activeThemeId
        }}>
            {children}
        </ChatbotThemeContext.Provider>
    );
}

export function useChatbotTheme() {
    const context = useContext(ChatbotThemeContext);
    if (context === undefined) {
        throw new Error('useChatbotTheme must be used within a ChatbotThemeProvider');
    }
    return context;
}
