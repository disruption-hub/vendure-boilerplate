"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkAuth = useCallback(() => {
        const token = localStorage.getItem('investor_token');
        if (!token) {
            setIsAuthenticated(false);
            const redirectPath = encodeURIComponent(pathname);
            router.replace(`/investor-portal/login?redirect=${redirectPath}`);
            return false;
        }
        return true;
    }, [router, pathname]);

    useEffect(() => {
        // Initial auth check
        if (checkAuth()) {
            setIsAuthenticated(true);
        }

        // Recheck auth when page becomes visible (back button, tab switch)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkAuth();
            }
        };

        // Recheck auth on window focus
        const handleFocus = () => {
            checkAuth();
        };

        // Listen for storage changes (logout in another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'investor_token' && !e.newValue) {
                setIsAuthenticated(false);
                const redirectPath = encodeURIComponent(pathname);
                router.replace(`/investor-portal/login?redirect=${redirectPath}`);
            }
        };

        // Recheck on popstate (browser back/forward)
        const handlePopState = () => {
            checkAuth();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('popstate', handlePopState);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [checkAuth, router]);

    // Show loading while checking auth
    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen bg-slate-950 items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-950">
            {/* Sidebar */}
            <DashboardSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col ml-0 md:ml-64 transition-all duration-300">
                {/* Header */}
                <DashboardHeader
                    onMenuClick={() => setIsSidebarOpen(true)}
                />

                {/* Main Content Area */}
                <main className="flex-1 mt-14 pt-2 px-4 pb-4 md:p-6 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
