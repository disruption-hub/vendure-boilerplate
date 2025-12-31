"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    ShieldCheck,
    Menu,
    X,
    Bell,
    Repeat,
    User,
    Mail,
    BarChart3,
    Activity,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import RoleSwitcherModal from '@/components/layout/RoleSwitcherModal';
import { WalletProvider } from '@/lib/stellar-wallet-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [userRoles, setUserRoles] = useState<string[]>(['SYSTEM_ADMIN']);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkAuth = useCallback(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            setIsAuthenticated(false);
            router.replace('/admin/login');
            return false;
        }
        return true;
    }, [router]);

    useEffect(() => {
        // Initial auth check
        if (checkAuth()) {
            setAdminName(localStorage.getItem('investor_name') || 'Admin');
            setAdminEmail(localStorage.getItem('investor_email') || '');
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
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkAuth();
            }
        };

        const handleFocus = () => checkAuth();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'admin_token' && !e.newValue) {
                setIsAuthenticated(false);
                router.replace('/admin/login');
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
            'user_roles', 'user_name'
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));
        setIsAuthenticated(false);
        router.replace('/admin/login');
    };

    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    const toggleMenu = (name: string) => {
        setExpandedMenus(prev =>
            prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
        );
    };

    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        {
            name: 'Analytics (V2)',
            href: '/admin/analytics-v2', // Navigate to Overview when clicked
            icon: Activity,
            subItems: [
                { name: 'Overview', href: '/admin/analytics-v2', icon: LayoutDashboard },
                { name: 'Heatmaps', href: '/admin/analytics-v2/heatmap', icon: Activity },
            ]
        },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Project Approvals', href: '/admin/approvals', icon: FileText },
        { name: 'Marketing', href: '/admin/marketing', icon: Mail },
        { name: 'Email Templates', href: '/admin/templates', icon: FileText },
        { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
    ];

    useEffect(() => {
        // Auto-expand menu if sub-item is active
        navItems.forEach(item => {
            if (item.subItems?.some(sub => pathname === sub.href)) {
                if (!expandedMenus.includes(item.name)) {
                    setExpandedMenus(prev => [...prev, item.name]);
                }
            }
        });
    }, [pathname]);

    const isLoginPage = pathname === '/admin/login';

    if (isLoginPage) {
        return <WalletProvider><div className="min-h-screen bg-slate-950 text-white">{children}</div></WalletProvider>;
    }

    // Show loading while checking auth
    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen bg-slate-950 items-center justify-center">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
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
                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                                <ShieldCheck className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <div className="font-bold text-lg leading-none">Admin</div>
                                <div className="text-xs text-slate-500">System Portal</div>
                            </div>
                        </div>

                        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                            {navItems.map((item) => {
                                const hasSubItems = item.subItems && item.subItems.length > 0;
                                const isParentActive = item.href
                                    ? pathname === item.href || item.subItems?.some(sub => pathname.startsWith(sub.href))
                                    : item.subItems?.some(sub => pathname.startsWith(sub.href));
                                const isExpanded = expandedMenus.includes(item.name) || isParentActive;

                                return (
                                    <div key={item.name} className="space-y-1">
                                        {item.href ? (
                                            <Link href={item.href}>
                                                <div className={`
                                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                                    ${isParentActive
                                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                    }
                                                `}>
                                                    <item.icon className={`w-5 h-5 ${isParentActive ? 'text-white' : 'text-slate-500'}`} />
                                                    <span className="font-medium text-sm">{item.name}</span>
                                                </div>
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={() => toggleMenu(item.name)}
                                                className={`
                                                    w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                                                    ${isParentActive
                                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className={`w-5 h-5 ${isParentActive ? 'text-white' : 'text-slate-500'}`} />
                                                    <span className="font-medium text-sm">{item.name}</span>
                                                </div>
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}

                                        {hasSubItems && isExpanded && (
                                            <div className="pl-4 space-y-1 mt-1">
                                                {item.subItems!.map((sub) => {
                                                    const isSubActive = pathname === sub.href;
                                                    return (
                                                        <Link key={sub.href} href={sub.href}>
                                                            <div className={`
                                                                flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                                                                ${isSubActive
                                                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                                    : 'text-slate-500 hover:bg-white/5 hover:text-white'
                                                                }
                                                            `}>
                                                                <sub.icon className="w-4 h-4" />
                                                                <span className="font-medium text-xs">{sub.name}</span>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-6 border-t border-white/5">
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
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
                            </button>

                            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-white leading-none">{adminName}</p>
                                    <p className="text-xs text-slate-500 mt-1">{adminEmail}</p>
                                </div>
                                <button
                                    onClick={() => setIsRoleModalOpen(true)}
                                    className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
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
                    currentRole="SYSTEM_ADMIN"
                />
            </div>
        </WalletProvider>
    );
}
