'use client';

import { useState, useEffect } from 'react';
import {
    LogOut,
    Plus,
    Settings,
    ShieldCheck,
    GraduationCap,
    LayoutDashboard,
    User,
    Globe,
    Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

export function NavbarUser() {
    const { isAuthenticated, user, signOut, isLoading, initiateOIDCLogin } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isLoading) {
        return (
            <Button variant="ghost" disabled>
                <User className="h-5 w-5 animate-pulse" />
            </Button>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <Button variant="ghost" onClick={() => initiateOIDCLogin()}>
                Sign In
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                    <User className="h-5 w-5 mr-2" />
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.primaryEmail || 'Account'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel className="p-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-70">
                    Account & Personal
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href="/account/profile" className="cursor-pointer flex items-center py-2">
                        <User className="mr-3 h-4 w-4 text-slate-600" />
                        <span className="font-medium">My Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="cursor-pointer flex items-center py-2">
                        <Settings className="mr-3 h-4 w-4 text-slate-600" />
                        <span className="font-medium">Recent Orders</span>
                    </Link>
                </DropdownMenuItem>

                {user.roles && user.roles.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="p-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-70">
                            Dashboards
                        </DropdownMenuLabel>

                        {(user.roles.includes('system-admin') || user.roles.includes('system_admin')) && (
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/system-admin/booking-profiles" className="cursor-pointer flex items-center py-2">
                                    <Globe className="mr-3 h-4 w-4 text-indigo-600" />
                                    <span className="font-medium">Platform Admin (Templates)</span>
                                </Link>
                            </DropdownMenuItem>
                        )}

                        {(user.roles.includes('booking-admin') || user.roles.includes('booking_admin') || user.roles.includes('system-admin') || user.roles.includes('system_admin')) && (
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/system-admin/venue-networks" className="cursor-pointer flex items-center py-2">
                                    <Network className="mr-3 h-4 w-4 text-amber-600" />
                                    <span className="font-medium">Booking Admin (Networks)</span>
                                </Link>
                            </DropdownMenuItem>
                        )}

                        {(user.roles.includes('admin') || user.roles.includes('booking-admin') || user.roles.includes('booking_admin') || user.roles.includes('system-admin') || user.roles.includes('system_admin')) && (
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/admin" className="cursor-pointer flex items-center py-2">
                                    <ShieldCheck className="mr-3 h-4 w-4 text-blue-600" />
                                    <span className="font-medium">Unit Admin (Spaces)</span>
                                </Link>
                            </DropdownMenuItem>
                        )}

                        {(user.roles.includes('provider') || user.roles.includes('teacher')) && (
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/teacher" className="cursor-pointer flex items-center py-2">
                                    <GraduationCap className="mr-3 h-4 w-4 text-purple-600" />
                                    <span className="font-medium">Provider Dashboard (Teacher/Coach)</span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                    </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
