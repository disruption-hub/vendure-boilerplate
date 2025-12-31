import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarCollapsed: false,
            setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            activeTab: 'general',
            setActiveTab: (tab) => set({ activeTab: tab }),
        }),
        {
            name: 'zkey-ui-storage',
        }
    )
);
