"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Settings,
    LogOut,
    Building2,
    Menu,
    X,
    Bell,
    Repeat,
    User,
    Mail,
    ShieldAlert,
    Clock
} from 'lucide-react';
import RoleSwitcherModal from '@/components/layout/RoleSwitcherModal';
import { WalletProvider } from '@/lib/stellar-wallet-context';

export default function ProjectOwnerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [ownerName, setOwnerName] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [userRoles, setUserRoles] = useState<string[]>(['PROJECT_OWNER']);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [isCheckingApproval, setIsCheckingApproval] = useState(true);

    const checkAuth = useCallback(() => {
        const isAuthPage = pathname === '/project-owner/login' || pathname === '/project-owner/register';
        if (isAuthPage) return true;

        const token = localStorage.getItem('project_owner_token');
        if (!token) {
            setIsAuthenticated(false);
            router.replace('/project-owner/login');
            return false;
        }
        return true;
    }, [router, pathname]);

    const checkApproval = useCallback(async () => {
        const token = localStorage.getItem('project_owner_token');
        if (!token) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';
            const res = await fetch(`${API_URL}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsApproved(data.isApproved);
            } else {
                // If profile fetch fails (e.g. 401), we should probably log out or block
                setIsApproved(false);
            }
        } catch (error) {
            console.error('Failed to check approval status', error);
        } finally {
            setIsCheckingApproval(false);
        }
    }, []);

    useEffect(() => {
        // Initial auth check
        if (checkAuth()) {
            setOwnerName(localStorage.getItem('investor_name') || localStorage.getItem('project_owner_name') || 'Partner');
            setOwnerEmail(localStorage.getItem('investor_email') || '');
            const storedRoles = localStorage.getItem('investor_roles');
            if (storedRoles) {
                try {
                    const parsed = JSON.parse(storedRoles);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setUserRoles(parsed);
                    }
                } catch { }
            }
            setIsAuthenticated(true);
            checkApproval();
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkAuth();
            }
        };

        const handleFocus = () => checkAuth();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'project_owner_token' && !e.newValue) {
                setIsAuthenticated(false);
                router.replace('/project-owner/login');
            }
        };

        const handlePopState = () => checkAuth();

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
    }, [checkAuth, router, pathname]);

    const handleLogout = () => {
        const keysToRemove = [
            'admin_token', 'project_owner_token', 'investor_token',
            'investor_roles', 'investor_name', 'investor_email',
            'project_owner_name', 'user_roles', 'user_name'
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));
        setIsAuthenticated(false);
        router.replace('/project-owner/login');
    };

    const navItems = [
        { name: 'Dashboard', href: '/project-owner/dashboard', icon: LayoutDashboard },
        { name: 'My Projects', href: '/project-owner/projects', icon: Briefcase },
        { name: 'Investors', href: '/project-owner/investors', icon: Users },
        { name: 'Marketing', href: '/project-owner/marketing', icon: Mail },
        { name: 'Account Settings', href: '/project-owner/settings', icon: Settings },
    ];

    const isAuthPage = pathname === '/project-owner/login' || pathname === '/project-owner/register';

    if (isAuthPage) {
        return <WalletProvider><div className="min-h-screen bg-slate-950 text-white">{children}</div></WalletProvider>;
    }

    // Show loading while checking auth
    if (!isAuthenticated || isCheckingApproval) {
        return (
            <div className="flex min-h-screen bg-slate-950 items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isApproved) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-8">
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto border border-yellow-500/20">
                        <ShieldAlert className="w-10 h-10 text-yellow-500" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold">Account Pending</h1>
                        <p className="text-slate-400">
                            Welcome, <span className="text-white font-medium">{ownerName}</span>.
                            Your registration as a Project Owner is currently being reviewed by our team.
                        </p>
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex items-center gap-3 text-sm text-slate-300">
                            <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                            Approval usually takes 24-48 business hours. You'll be able to access the platform once confirmed.
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 mx-auto"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out and try later
                    </button>
                    <div className="pt-8 border-t border-white/5">
                        <p className="text-xs text-slate-500">
                            Need help? Contact us at <a href="mailto:support@infrabricks.com" className="text-purple-400">support@infrabricks.com</a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <WalletProvider>
            <div className="min-h-screen bg-slate-950 text-white flex">
                {/* Mobile Sidebar Backdrop */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 z-[45] md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-white/5 z-[60]
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                    <div className="p-6 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-10 px-2">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                                <Building2 className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <div className="font-bold text-lg leading-none">Partner</div>
                                <div className="text-xs text-slate-500">Project Portal</div>
                            </div>
                        </div>

                        <nav className="flex-1 space-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <div className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                        ${isActive
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }
                                    `}>
                                            <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                            <span className="font-medium text-sm">{item.name}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-6 border-t border-white/5">
                            <div className="px-4 mb-4">
                                <div className="text-xs text-slate-500 mb-1">Signed in as</div>
                                <div className="font-medium truncate">{ownerName}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium text-sm">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                    {/* Header */}
                    <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-4 md:px-8">
                        <button
                            className="md:hidden p-2 text-slate-400 hover:text-white"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="ml-auto flex items-center gap-4">
                            {/* Role Switcher Button (only if multiple roles) */}
                            {userRoles.length > 1 && (
                                <button
                                    onClick={() => setIsRoleModalOpen(true)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                    title="Switch Dashboard"
                                >
                                    <Repeat className="w-5 h-5" />
                                </button>
                            )}

                            <button className="p-2 text-slate-400 hover:text-white relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full border border-slate-900"></span>
                            </button>

                            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-white leading-none">{ownerName}</p>
                                    <p className="text-xs text-slate-500 mt-1">{ownerEmail}</p>
                                </div>
                                <button
                                    onClick={() => setIsRoleModalOpen(true)}
                                    className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 transition-colors"
                                >
                                    <User className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>

                <RoleSwitcherModal
                    isOpen={isRoleModalOpen}
                    onClose={() => setIsRoleModalOpen(false)}
                    roles={userRoles}
                    currentRole="PROJECT_OWNER"
                />
            </div>
        </WalletProvider >
    );
}
