'use client'

import { createWithEqualityFn } from 'zustand/traditional'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_CHAT_THEME, ChatThemeId } from '@/lib/chatbot/chat-themes'

interface ChatThemeState {
    currentTheme: ChatThemeId
    setTheme: (theme: ChatThemeId) => void
}

const STORAGE_KEY = 'chat-theme-storage'

const fallbackStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
} as Storage

export const useChatThemeStore = createWithEqualityFn<ChatThemeState>()(
    persist(
        (set) => ({
            currentTheme: DEFAULT_CHAT_THEME,
            setTheme: (theme) => set({ currentTheme: theme }),
        }),
        {
            name: STORAGE_KEY,
            storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : fallbackStorage)),
        },
    ),
)
